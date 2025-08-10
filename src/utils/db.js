// src/utils/db.js
import Dexie from "dexie";

// Define la base de datos y sus "tablas" (Object Stores)
const db = new Dexie("AlesfunCRM_DB"); // Cambiado el nombre para asegurar una nueva instancia

// Versión 3 de la base de datos: Elimina las restricciones de unicidad en 'ci' y 'codigo'
// '++id' es la clave primaria auto-incrementable (autogenerada por Dexie)
// 'firestoreId', 'ci', 'codigo' ahora son índices regulares (no únicos)
db.version(3)
  .stores({
    // <--- Versión de la base de datos incrementada a 3
    clients:
      "++id, firestoreId, ci, nombre, celular, direccion, saldoActual, syncStatus, updatedAt, createdAt",
    products:
      "++id, firestoreId, codigo, nombre, precio, stock, syncStatus, updatedAt, createdAt",
    movements:
      "++id, clienteId, clienteFirestoreId, fecha, tipo, monto, montoPago, cambio, saldoAnterior, newBalance, ventaItems, firestoreId, syncStatus, updatedAt, createdAt",
    syncQueue:
      "++id, timestamp, collectionName, operation, localId, firestoreId",
  })
  .upgrade(() => {
    // El parámetro _tx se mantiene para compatibilidad con la firma, aunque no se use
    console.log(
      "Migrando DB a la versión 3: Esquema de tablas actualizado (ci y codigo ya no son únicos).",
    );
    // Aquí iría la lógica de migración si hubiese cambios estructurales de la versión 2 a la 3.
    // Para este cambio de unicidad, no se necesita lógica de migración de datos, solo el cambio de esquema.
  });

// Este listener se ejecuta una vez que la base de datos está abierta y lista.
db.on("ready", async () => {
  console.log("IndexedDB Abierta y Lista.");
});

// Abre la base de datos y adjunta el manejador de errores aquí
db.open().catch((e) => {
  console.error("Failed to open Dexie DB:", e);
  // Si el error de versión persiste y no puedes acceder a la DB,
  // la única solución a menudo es eliminar la DB manualmente en el navegador.
  // Puedes descomentar el siguiente bloque para un reseteo forzado si es necesario,
  // PERO TEN CUIDADO: Esto borrará todos los datos locales no sincronizados.
  /*
    if (e.name === 'VersionError') {
      console.warn("Versión de DB incompatible. Intentando limpiar la base de datos.");
      Dexie.delete('AlesfunCRM_DB').then(() => { // Usar el nuevo nombre
        console.log("Base de datos eliminada. Recargando página...");
        window.location.reload();
      }).catch(deleteError => {
        console.error("Error al eliminar la base de datos:", deleteError);
      });
    }
    */
});

export default db;
