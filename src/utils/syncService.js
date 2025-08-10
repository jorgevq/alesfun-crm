// src/utils/syncService.js
import db from "@/utils/db"; // IndexedDB (asumiendo que esta es tu instancia de Dexie)
import { db as firestoreDb, auth } from "@/firebase/config"; // Firestore
import {
  collection,
  doc,
  setDoc, // Usaremos setDoc para crear o sobrescribir
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  getDoc, // Importar getDoc para verificar si el documento existe
} from "firebase/firestore";
import store from "@/store"; // Vuex store para actualizar el estado de sincronización

// Define appId de forma segura a nivel global del módulo, usando window para mayor compatibilidad
const appId =
  typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// Variable para controlar si la sincronización ya está en curso
let isSyncing = false;
let syncInterval = null; // Para el intervalo de sincronización periódica

// Función para obtener el userId actual
const getUserId = () => {
  return auth.currentUser ? auth.currentUser.uid : "anonymous"; // O un ID generado para usuarios no autenticados
};

/**
 * Asegura que el documento del usuario exista en Firestore.
 * Esto es crucial para que las subcolecciones como 'clients' puedan crearse.
 */
const ensureUserDocumentExists = async (userId) => {
  if (!userId || userId === "anonymous") {
    console.warn("No user authenticated. Cannot ensure user document exists.");
    return;
  }
  const userDocRef = doc(firestoreDb, `artifacts/${appId}/users/${userId}`);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      // Si el documento del usuario no existe, créalo (puede ser un documento vacío)
      await setDoc(userDocRef, { createdAt: serverTimestamp() });
      console.log(`[Firestore] Documento de usuario ${userId} creado.`);
    }
  } catch (error) {
    console.error(
      `[Firestore] Error al asegurar el documento de usuario ${userId}:`,
      error,
    );
    // No lanzar el error para no detener el proceso de sincronización
  }
};

/**
 * Sube los cambios pendientes de IndexedDB a Firestore.
 */
const uploadPendingChanges = async () => {
  const userId = getUserId();
  if (!userId || userId === "anonymous") {
    console.warn(
      "No hay usuario autenticado para subir cambios a Firestore. Saltando subida.",
    );
    return;
  }

  // Asegúrate de que el documento del usuario exista antes de subir datos
  await ensureUserDocumentExists(userId);

  // Asegúrate de que db y syncQueue estén disponibles antes de usarlos
  if (!db || !db.syncQueue) {
    console.error(
      "[Sync] Dexie DB o syncQueue no están listos. Reintentando...",
    );
    store.commit("SET_SYNC_STATUS", "error"); // O un estado de "espera"
    return;
  }

  const pendingItems = await db.syncQueue.orderBy("timestamp").toArray();
  if (pendingItems.length === 0) {
    console.log("No hay cambios pendientes para subir.");
    store.commit("SET_SYNC_STATUS", "idle");
    store.commit("SET_SYNC_PROGRESS", 100); // Completo si no hay nada que hacer
    return;
  }

  store.commit("SET_SYNC_STATUS", "syncing");
  let processedCount = 0;

  for (const item of pendingItems) {
    try {
      const collectionRef = collection(
        firestoreDb,
        `artifacts/${appId}/users/${userId}/${item.collectionName}`, // Usando appId
      );
      let docRef;

      // Firestore no permite 'undefined' en los datos, convertir a null si es necesario
      const dataToFirestore = JSON.parse(
        JSON.stringify(item.data, (key, value) => {
          if (value === undefined) return null;
          return value;
        }),
      );

      // Añadir timestamp del servidor para la creación/actualización en Firestore
      if (item.operation === "add" || item.operation === "update") {
        dataToFirestore.updatedAt = serverTimestamp();
        if (item.operation === "add") {
          dataToFirestore.createdAt = serverTimestamp();
        }
      }

      if (item.operation === "add") {
        // Para nuevas adiciones, Firestore asignará un ID
        docRef = doc(collectionRef); // Crea una referencia de documento con un ID automático
        await setDoc(docRef, dataToFirestore);
        // Actualizar el firestoreId en IndexedDB para el elemento local
        await db[item.collectionName].update(item.localId, {
          firestoreId: docRef.id,
          syncStatus: "synced",
        });
        console.log(
          `[Sync] Añadido ${item.collectionName} con ID local ${item.localId} a Firestore con ID ${docRef.id}`,
        );
      } else if (item.operation === "update") {
        // Para actualizaciones, necesitamos el firestoreId
        if (item.firestoreId) {
          docRef = doc(collectionRef, item.firestoreId);
          try {
            await updateDoc(docRef, dataToFirestore);
            // Actualizar el estado de sincronización en IndexedDB
            await db[item.collectionName].update(item.localId, {
              syncStatus: "synced",
            });
            console.log(
              `[Sync] Actualizado ${item.collectionName} con ID Firestore ${item.firestoreId}`,
            );
          } catch (updateError) {
            // Manejar específicamente el error "No document to update" o "not-found"
            if (
              updateError.code === "not-found" ||
              updateError.message.includes("No document to update")
            ) {
              console.warn(
                `[Sync] Documento ${item.collectionName} con ID Firestore ${item.firestoreId} no encontrado para actualizar. Intentando crear/sobrescribir con setDoc.`,
              );
              // Si el documento no existe en Firestore para actualizar, lo creamos/sobrescribimos con setDoc
              // usando el MISMO firestoreId. Esto evitará duplicados.
              await setDoc(docRef, dataToFirestore); // Usa el docRef original con el firestoreId
              // Actualizar el estado de sincronización en IndexedDB
              await db[item.collectionName].update(item.localId, {
                syncStatus: "synced",
              });
              console.log(
                `[Sync] Creado/Sobreescrito ${item.collectionName} (ID: ${item.firestoreId}) con setDoc.`,
              );
            } else {
              // Re-lanzar otros errores que no sean "documento no encontrado"
              throw updateError;
            }
          }
        } else {
          // Si no tiene firestoreId, puede ser un elemento pendiente que no se subió correctamente antes.
          // Intentar añadirlo como nuevo para no perder el dato.
          console.warn(
            `[Sync] No se pudo actualizar ${item.collectionName} (ID local: ${item.localId}): firestoreId no encontrado. Intentando añadir como nuevo.`,
          );
          docRef = doc(collectionRef);
          await setDoc(docRef, dataToFirestore);
          await db[item.collectionName].update(item.localId, {
            firestoreId: docRef.id,
            syncStatus: "synced",
          });
          console.log(
            `[Sync] Añadido ${item.collectionName} con ID local ${item.localId} como nuevo a Firestore con ID ${docRef.id} (resolución de ID faltante).`,
          );
        }
      } else if (item.operation === "delete") {
        // Para eliminaciones, necesitamos el firestoreId
        if (item.firestoreId) {
          docRef = doc(collectionRef, item.firestoreId);
          try {
            await deleteDoc(docRef);
            // El elemento ya se eliminó de IndexedDB, solo quitar de la cola
            console.log(
              `[Sync] Eliminado ${item.collectionName} con ID Firestore ${item.firestoreId}`,
            );
          } catch (deleteError) {
            if (
              deleteError.code === "not-found" ||
              deleteError.message.includes("No document to delete")
            ) {
              console.warn(
                `[Sync] Documento ${item.collectionName} con ID Firestore ${item.firestoreId} no encontrado para eliminar. Asumiendo que ya no existe en Firestore.`,
              );
              // Si el documento ya no existe, simplemente lo consideramos eliminado y continuamos.
            } else {
              throw deleteError; // Re-lanzar otros errores de eliminación
            }
          }
        } else {
          console.warn(
            `[Sync] No se pudo eliminar ${item.collectionName} (ID local: ${item.localId}): firestoreId no encontrado. Asumiendo que ya no existe en Firestore.`,
          );
        }
      }
      // Eliminar el item de la cola de sincronización después de una subida exitosa o resolución de conflicto
      await db.syncQueue.delete(item.id);
      processedCount++;
      store.commit(
        "SET_SYNC_PROGRESS",
        Math.round((processedCount / pendingItems.length) * 100),
      );
    } catch (error) {
      console.error(
        `[Sync] Error al procesar item de syncQueue (ID: ${item.id}, Op: ${item.operation}, Col: ${item.collectionName}):`,
        error,
      );
      // Marcar el item en IndexedDB como 'error' si es una adición/actualización
      if (item.operation === "add" || item.operation === "update") {
        await db[item.collectionName].update(item.localId, {
          syncStatus: "error",
        });
      }
      // No break aquí para permitir que otros ítems se procesen si el error es solo para uno.
      store.commit("SET_SYNC_STATUS", "error");
    }
  }
  if (store.state.syncStatus !== "error") {
    store.commit("SET_SYNC_STATUS", "idle");
    store.commit("SET_SYNC_PROGRESS", 100);
  }
  console.log(
    `[Sync] Subida de cambios completada. Items procesados: ${processedCount}`,
  );
};

/**
 * Descarga los cambios desde Firestore a IndexedDB.
 */
const downloadAndSyncFromFirestore = async () => {
  const userId = getUserId();
  if (!userId || userId === "anonymous") {
    console.warn(
      "No hay usuario autenticado para descargar cambios de Firestore. Saltando descarga.",
    );
    return;
  }

  // Asegúrate de que el documento del usuario exista antes de descargar datos
  await ensureUserDocumentExists(userId);

  console.log("[Sync] Descargando cambios desde Firestore...");
  store.commit("SET_SYNC_STATUS", "syncing");
  store.commit("SET_SYNC_PROGRESS", 0); // Resetear progreso para descarga

  const collectionsToSync = ["clients", "products", "movements"]; // Define qué colecciones sincronizar

  try {
    for (const collectionName of collectionsToSync) {
      const firestoreCollectionRef = collection(
        firestoreDb,
        `artifacts/${appId}/users/${userId}/${collectionName}`, // Usando appId
      );
      const snapshot = await getDocs(firestoreCollectionRef);
      const firestoreDocs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        firestoreId: doc.id,
      }));

      // Obtener todos los documentos locales para la colección actual
      const localDocs = await db[collectionName].toArray();
      // Crear un mapa de documentos locales por firestoreId para búsqueda rápida
      const localMap = new Map(localDocs.map((doc) => [doc.firestoreId, doc]));

      // Procesar documentos de Firestore
      for (const firestoreDoc of firestoreDocs) {
        const docToSaveLocally = { ...firestoreDoc, syncStatus: "synced" };

        // Normalizar campos de fecha y otros tipos de datos
        const normalizeData = (data) => {
          const newData = { ...data };
          if (
            newData.createdAt &&
            typeof newData.createdAt.toDate === "function"
          ) {
            newData.createdAt = newData.createdAt.toDate().getTime();
          } else if (typeof newData.createdAt !== "number") {
            newData.createdAt = Date.now();
          }
          if (
            newData.updatedAt &&
            typeof newData.updatedAt.toDate === "function"
          ) {
            newData.updatedAt = newData.updatedAt.toDate().getTime();
          } else if (typeof newData.updatedAt !== "number") {
            newData.updatedAt = Date.now();
          }
          // Para movimientos, fecha también puede ser un Timestamp
          if (newData.fecha && typeof newData.fecha.toDate === "function") {
            newData.fecha = newData.fecha.toDate().getTime();
          } else if (typeof newData.fecha !== "number") {
            newData.fecha = Date.now();
          }

          // Asegurar tipos de datos para campos específicos que podrían ser nulos/undefined en Firestore
          if (collectionName === "products") {
            newData.codigo =
              typeof newData.codigo === "string" ? newData.codigo : "";
            newData.nombre =
              typeof newData.nombre === "string" ? newData.nombre : "";
            newData.precio =
              typeof newData.precio === "number" && !isNaN(newData.precio)
                ? newData.precio
                : 0;
            newData.stock =
              typeof newData.stock === "number" && !isNaN(newData.stock)
                ? newData.stock
                : 0;
          } else if (collectionName === "clients") {
            newData.ci = typeof newData.ci === "string" ? newData.ci : "";
            newData.nombre =
              typeof newData.nombre === "string" ? newData.nombre : "";
            newData.celular =
              typeof newData.celular === "string" ? newData.celular : "";
            newData.direccion =
              typeof newData.direccion === "string" ? newData.direccion : "";
            newData.saldoActual =
              typeof newData.saldoActual === "number" &&
              !isNaN(newData.saldoActual)
                ? newData.saldoActual
                : 0;
          } else if (collectionName === "movements") {
            newData.clienteId =
              typeof newData.clienteId === "string" ? newData.clienteId : ""; // ID local de Dexie del cliente
            newData.clienteFirestoreId =
              typeof newData.clienteFirestoreId === "string"
                ? newData.clienteFirestoreId
                : ""; // ID de Firestore del cliente
            newData.clienteNombre =
              typeof newData.clienteNombre === "string"
                ? newData.clienteNombre
                : "";
            newData.clienteCi =
              typeof newData.clienteCi === "string" ? newData.clienteCi : "";
            newData.type = typeof newData.type === "string" ? newData.type : "";
            newData.monto =
              typeof newData.monto === "number" && !isNaN(newData.monto)
                ? newData.monto
                : 0;
            newData.montoPago =
              typeof newData.montoPago === "number" && !isNaN(newData.montoPago)
                ? newData.montoPago
                : 0;
            newData.cambio =
              typeof newData.cambio === "number" && !isNaN(newData.cambio)
                ? newData.cambio
                : 0;
            newData.saldoAnterior =
              typeof newData.saldoAnterior === "number" &&
              !isNaN(newData.saldoAnterior)
                ? newData.saldoAnterior
                : 0;
            newData.newBalance =
              typeof newData.newBalance === "number" &&
              !isNaN(newData.newBalance)
                ? newData.newBalance
                : 0;
            newData.ventaItems = Array.isArray(newData.ventaItems)
              ? newData.ventaItems
              : [];
            // Asegurar que los items de venta tengan productNombre
            newData.ventaItems = newData.ventaItems.map((item) => ({
              ...item,
              productNombre: item.productNombre || item.nombre || "Desconocido", // Fallback para nombre
            }));
          }
          return newData;
        };

        const normalizedDocToSaveLocally = normalizeData(docToSaveLocally);

        const localDoc = localMap.get(firestoreDoc.firestoreId); // Buscar por firestoreId

        if (localDoc) {
          // Si el documento local existe, verificar si hay cambios pendientes localmente
          if (localDoc.syncStatus === "pending") {
            console.log(
              `[Sync] Conflicto potencial en ${collectionName} (ID: ${firestoreDoc.firestoreId}). Local pendiente, se mantiene local.`,
            );
            // Si hay un cambio local pendiente, no sobrescribir desde Firestore en este paso.
            // La subida de cambios local manejará esto.
            continue; // Pasar al siguiente documento de Firestore
          } else {
            // Si no hay cambios pendientes localmente, comparar timestamps
            const firestoreUpdatedAt = normalizedDocToSaveLocally.updatedAt;
            const localUpdatedAt = localDoc.updatedAt;

            if (firestoreUpdatedAt > localUpdatedAt) {
              // Si la versión de Firestore es más reciente, actualizar el documento local
              // Usar .put() con el ID local existente para actualizar el registro
              normalizedDocToSaveLocally.id = localDoc.id; // Mantener el ID local de Dexie
              await db[collectionName].put(normalizedDocToSaveLocally);
              console.log(
                `[Sync] Actualizado ${collectionName} (ID: ${firestoreDoc.firestoreId}) desde Firestore.`,
              );
            }
            // Si la versión local es más reciente o igual, no hacer nada (se asume que ya está sincronizado o será subido)
          }
        } else {
          // Si el documento no existe localmente (es nuevo de Firestore), añadirlo
          // Asegurarse de que no tenga un 'id' para que Dexie genere uno nuevo
          delete normalizedDocToSaveLocally.id;
          await db[collectionName].add(normalizedDocToSaveLocally); // Usar .add() para nuevos registros
          console.log(
            `[Sync] Añadido nuevo ${collectionName} (ID: ${firestoreDoc.firestoreId}) desde Firestore.`,
          );
        }
      }

      // Después de procesar todos los documentos de Firestore,
      // eliminar los documentos locales que ya no existen en Firestore.
      const firestoreIds = new Set(firestoreDocs.map((doc) => doc.firestoreId));
      for (const localDoc of localDocs) {
        // Solo eliminar si no existe en Firestore Y no tiene cambios pendientes locales
        if (
          !firestoreIds.has(localDoc.firestoreId) &&
          localDoc.syncStatus !== "pending"
        ) {
          await db[collectionName].delete(localDoc.id); // Eliminar por ID local de Dexie
          console.log(
            `[Sync] Eliminado ${collectionName} (ID local: ${localDoc.id}, FirestoreId: ${localDoc.firestoreId}) que ya no existe en Firestore.`,
          );
        }
      }

      store.commit(
        "SET_SYNC_PROGRESS",
        Math.round(
          ((collectionsToSync.indexOf(collectionName) + 1) /
            collectionsToSync.length) *
            100,
        ),
      );
    }
  } catch (error) {
    console.error("[Sync] Error al descargar cambios desde Firestore:", error);
    store.commit("SET_SYNC_STATUS", "error");
  }
};

/**
 * Inicia el proceso de sincronización (subida y descarga).
 */
const startSyncProcess = async () => {
  if (isSyncing) {
    console.log("Sincronización ya en curso. Ignorando solicitud.");
    return;
  }
  isSyncing = true;
  store.commit("SET_SYNC_STATUS", "syncing");
  store.commit("SET_SYNC_PROGRESS", 0);

  const userId = getUserId();
  await ensureUserDocumentExists(userId);

  try {
    // 1. Descargar primero para obtener las últimas versiones de la nube
    await downloadAndSyncFromFirestore();
    // 2. Luego, subir los cambios locales pendientes
    await uploadPendingChanges();
    console.log("Proceso de sincronización completo (subida y descarga).");
  } catch (error) {
    console.error("Error general en el proceso de sincronización:", error);
    store.commit("SET_SYNC_STATUS", "error");
  } finally {
    isSyncing = false;
    setTimeout(() => {
      if (store.state.syncStatus !== "error") {
        store.commit("SET_SYNC_STATUS", "idle");
        store.commit("SET_SYNC_PROGRESS", 100);
        console.log(
          "[Sync] Estado de sincronización establecido a 'idle' después de un retraso.",
        );
      }
    }, 100);
  }
};

let authStateUnsubscribe = null;

export const setupSyncService = () => {
  const handleOnline = () => {
    store.commit("SET_ONLINE_STATUS", true);
    console.log(
      "Conexión a internet restablecida. Iniciando sincronización automática...",
    );
    startSyncProcess();
  };

  const handleOffline = () => {
    store.commit("SET_ONLINE_STATUS", false);
    console.warn(
      "Conexión a internet perdida. La aplicación funcionará en modo offline.",
    );
    store.commit("SET_SYNC_STATUS", "idle");
  };

  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  if (authStateUnsubscribe) {
    authStateUnsubscribe();
  }

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  authStateUnsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      console.log(
        "Usuario autenticado, iniciando sincronización inicial y periódica.",
      );
      if (navigator.onLine) {
        startSyncProcess();
      }

      syncInterval = setInterval(
        () => {
          if (navigator.onLine && auth.currentUser) {
            console.log("Sincronización periódica activada.");
            startSyncProcess();
          }
        },
        5 * 60 * 1000,
      );
    } else {
      console.log(
        "Usuario no autenticado. La sincronización automática no se iniciará.",
      );
      store.commit("SET_SYNC_STATUS", "idle");
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
    }
  });
};

export const forceSync = () => {
  if (navigator.onLine) {
    console.log("Forzando sincronización manual...");
    startSyncProcess();
  } else {
    console.warn("No hay conexión a internet para forzar la sincronización.");
    store.commit("SET_SYNC_STATUS", "error");
  }
};
