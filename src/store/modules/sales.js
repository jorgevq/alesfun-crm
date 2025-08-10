// src/store/modules/sales.js
import db from "@/utils/db"; // Importa la instancia de Dexie
import { auth, db as firestoreDb } from "@/firebase/config"; // Importa Firebase auth y db
import { collection, getDocs, query } from "firebase/firestore";

const salesModule = {
  namespaced: true,
  state: () => ({
    allMovements: [],
    isLoadingMovements: false,
    movementsError: null,
  }),
  mutations: {
    SET_MOVEMENTS(state, movements) {
      state.allMovements = movements;
    },
    ADD_MOVEMENT(state, movement) {
      state.allMovements.push(movement);
    },
    UPDATE_MOVEMENT(state, updatedMovement) {
      // Buscar movimiento por firestoreId para asegurar consistencia
      const index = state.allMovements.findIndex(
        (m) => m.firestoreId === updatedMovement.firestoreId,
      );
      if (index !== -1) {
        state.allMovements.splice(index, 1, updatedMovement);
      }
    },
    REMOVE_MOVEMENT(state, movementId) {
      // Filtrar movimientos por firestoreId para asegurar consistencia
      state.allMovements = state.allClients.filter(
        (movement) => movement.firestoreId !== movementId,
      );
    },
    SET_LOADING_MOVEMENTS(state, status) {
      state.isLoadingMovements = status;
    },
    SET_MOVEMENTS_ERROR(state, error) {
      state.movementsError = error;
    },
  },
  actions: {
    async fetchMovements({ commit }) {
      commit("SET_LOADING_MOVEMENTS", true);
      commit("SET_MOVEMENTS_ERROR", null);
      try {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
          console.warn(
            "No user authenticated. Cannot fetch movements from Firestore.",
          );
          // Si no hay usuario, intenta cargar desde IndexedDB local
          const localMovements = await db.movements.toArray();
          commit("SET_MOVEMENTS", localMovements);
          commit("SET_LOADING_MOVEMENTS", false);
          return;
        }

        const movementsFromFirestore = [];
        // Asegúrate de que 'alesfun-crm' sea el appId correcto
        const q = query(
          collection(
            firestoreDb,
            `artifacts/alesfun-crm/users/${userId}/movements`,
          ),
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const movementForIndexedDB = {
            firestoreId: doc.id, // Almacenar el ID de Firestore explícitamente
            // Normalizar las fechas de Timestamp de Firestore a milisegundos
            fecha:
              data.fecha && typeof data.fecha.toDate === "function"
                ? data.fecha.toDate().getTime()
                : data.fecha || Date.now(),
            createdAt:
              data.createdAt && typeof data.createdAt.toDate === "function"
                ? data.createdAt.toDate().getTime()
                : data.createdAt || Date.now(),
            updatedAt:
              data.updatedAt && typeof data.updatedAt.toDate === "function"
                ? data.updatedAt.toDate().getTime()
                : data.updatedAt || Date.now(),

            // Asegurar que los IDs de cliente sean los de Firestore
            clienteId: data.clienteId || null, // Este podría ser el ID local de Dexie si se guardó así
            clienteFirestoreId: data.clienteFirestoreId || null, // Este es el importante para la consistencia
            clienteNombre: data.clienteNombre || "",
            clienteCi: data.clienteCi || "",
            type: data.type || "unknown",
            monto:
              typeof data.monto === "number" && !isNaN(data.monto)
                ? data.monto
                : 0,
            montoPago:
              typeof data.montoPago === "number" && !isNaN(data.montoPago)
                ? data.montoPago
                : 0,
            saldoAnterior:
              typeof data.saldoAnterior === "number" &&
              !isNaN(data.saldoAnterior)
                ? data.saldoAnterior
                : 0,
            newBalance:
              typeof data.newBalance === "number" && !isNaN(data.newBalance)
                ? data.newBalance
                : 0,
            cambio:
              typeof data.cambio === "number" && !isNaN(data.cambio)
                ? data.cambio
                : 0,
            // Asegurar que ventaItems sea un array y que los nombres de producto estén presentes
            ventaItems: Array.isArray(data.ventaItems)
              ? data.ventaItems.map((item) => ({
                  ...item,
                  productNombre:
                    item.productNombre || item.nombre || "Desconocido", // Fallback
                }))
              : [],
            syncStatus: "synced",
          };
          movementsFromFirestore.push(movementForIndexedDB);
        });

        // Obtener los movimientos locales para fusionar o actualizar
        const localMovements = await db.movements.toArray();
        const localMovementsMap = new Map(
          localMovements.map((mov) => [mov.firestoreId, mov]),
        );

        const movementsToPut = [];
        for (const firestoreMov of movementsFromFirestore) {
          const existingLocalMov = localMovementsMap.get(
            firestoreMov.firestoreId,
          );
          if (existingLocalMov) {
            // Si existe localmente, mantener su ID local de Dexie
            movementsToPut.push({ ...firestoreMov, id: existingLocalMov.id });
          } else {
            // Si no existe localmente, Dexie generará un nuevo ID
            movementsToPut.push(firestoreMov);
          }
        }

        // Usar bulkPut para insertar o actualizar, usando firestoreId como clave
        // Asegúrate de que tu db.js tenga 'id++, firestoreId' en el esquema de movimientos.
        await db.movements.bulkPut(movementsToPut);
        console.log(
          "[Sales Module] bulkPut de movimientos completado. Total:",
          movementsToPut.length,
        );

        // Actualizar el estado de Vuex con los movimientos recién sincronizados
        // Es importante cargar desde IndexedDB después del bulkPut para asegurar que el estado de Vuex
        // refleje exactamente lo que está en IndexedDB, incluyendo los IDs locales de Dexie.
        const updatedLocalMovements = await db.movements.toArray();
        commit("SET_MOVEMENTS", updatedLocalMovements);
      } catch (error) {
        console.error("Error al cargar movimientos desde Firestore:", error);
        commit("SET_MOVEMENTS_ERROR", error);
        // Volver a los datos locales si la obtención de Firestore falla
        const localMovements = await db.movements.toArray();
        commit("SET_MOVEMENTS", localMovements);
      } finally {
        commit("SET_LOADING_MOVEMENTS", false);
      }
    },
  },
  getters: {
    getMovements: (state) => state.allMovements,
    // Obtener los últimos 3 movimientos para un cliente específico
    getLast3MovementsByClient: (state) => (clientFirestoreId) => {
      // Filtrar, ordenar por fecha (más reciente primero) y tomar los últimos 5
      const filteredAndSorted = [...state.allMovements]
        .filter((mov) => mov.clienteFirestoreId === clientFirestoreId) // Usar clienteFirestoreId
        .sort((a, b) => b.fecha - a.fecha); // Ordenar por fecha descendente

      console.log(
        `[Sales Getter] Movimientos encontrados para ${clientFirestoreId}:`,
        filteredAndSorted.length,
      );
      console.log(
        `[Sales Getter] Últimos 3 Movimientos para ${clientFirestoreId}:`,
        filteredAndSorted.slice(0, 3),
      );

      return filteredAndSorted.slice(0, 3); // Tomar los últimos 3
    },
  },
};

export default salesModule;
