<template>
  <div class="page-container">
    <h1 class="page-title">Gestión de Datos</h1>

    <div class="export-section card">
      <h2 class="section-title">Exportar Datos a Excel</h2>
      <p>
        Selecciona un rango de fechas para exportar los movimientos de ventas y
        pagos a un archivo Excel liviano.
      </p>
      <div class="input-group">
        <label for="export-start-date">Fecha de Inicio:</label>
        <input type="date" id="export-start-date" v-model="exportStartDate" />
      </div>
      <div class="input-group">
        <label for="export-end-date">Fecha de Fin:</label>
        <input type="date" id="export-end-date" v-model="exportEndDate" />
      </div>
      <div class="button-group">
        <button
          class="btn primary"
          @click="exportDataToExcel"
          :disabled="!exportStartDate || !exportEndDate"
        >
          Exportar a Excel
        </button>
      </div>
    </div>

    <div class="export-section card">
      <h2 class="section-title">Exportar Base de Datos de Clientes a Excel</h2>
      <p>
        Exporta la lista completa de tus clientes con su información básica y
        saldo actual.
      </p>
      <div class="button-group">
        <button
          class="btn primary"
          @click="exportClientsToExcel"
          :disabled="loadingClients"
        >
          {{
            loadingClients
              ? "Cargando Clientes..."
              : "Exportar Clientes a Excel"
          }}
        </button>
      </div>
      <p v-if="clientError" class="error-message">
        Error al cargar clientes: {{ clientError.message }}
      </p>
    </div>

    <div class="delete-section card">
      <h2 class="section-title">Eliminar Datos Históricos de Firebase</h2>
      <p>
        Esta acción eliminará permanentemente los movimientos de gestiones
        pasadas de Firebase para mantener la aplicación ágil. Los saldos
        actuales de los clientes NO se verán afectados.
      </p>
      <div class="input-group">
        <label for="delete-end-date">Eliminar hasta la Fecha:</label>
        <input type="date" id="delete-end-date" v-model="deleteEndDate" />
      </div>
      <div class="button-group">
        <button
          class="btn delete-btn"
          @click="confirmDeleteHistoricalData"
          :disabled="!deleteEndDate || deletingData"
        >
          {{ deletingData ? "Eliminando..." : "Eliminar Datos Históricos" }}
        </button>
      </div>
      <p v-if="deleteError" class="error-message">
        Error al eliminar: {{ deleteError.message }}
      </p>
    </div>

    <div v-if="showDeleteConfirmModal" class="modal-overlay">
      <div class="modal-content delete-modal">
        <h2>Confirmar Eliminación</h2>
        <p>
          ¿Estás seguro de que quieres eliminar todos los datos históricos
          (ventas y pagos) anteriores a
          <strong>{{ deleteEndDate }}</strong>
          permanentemente?
        </p>
        <p class="warning-text">
          Esta acción es irreversible y los datos eliminados no se podrán
          recuperar.
        </p>
        <div class="button-group">
          <button class="btn delete-btn" @click="deleteHistoricalData">
            Sí, Eliminar Permanentemente
          </button>
          <button class="btn secondary" @click="showDeleteConfirmModal = false">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
// MODIFICADO: Se ha eliminado 'formatDate' ya que no se usa directamente aquí.
import { exportToExcel, formatCurrency } from "@/utils/helpers";

// NUEVAS IMPORTACIONES: Necesarias para interactuar con Firebase Firestore y tu base de datos local Dexie.
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import db from "@/utils/db"; // Dexie local database

const store = useStore();

const exportStartDate = ref("");
const exportEndDate = ref("");
const deleteEndDate = ref("");
const deletingData = ref(false);
const deleteError = ref(null);
const showDeleteConfirmModal = ref(false);

const loadingClients = computed(() => store.getters["clients/getLoading"]);
const clientError = computed(() => store.getters["clients/getError"]);
const allClients = computed(() => store.getters["clients/getClients"]);

const exportDataToExcel = async () => {
  alert(
    "Funcionalidad de exportación de movimientos (ventas/pagos) no implementada completamente en este ejemplo. ¡Añade tu lógica aquí!",
  );
};

const confirmDeleteHistoricalData = () => {
  if (deleteEndDate.value) {
    showDeleteConfirmModal.value = true;
  } else {
    alert("Por favor, selecciona una fecha para eliminar los datos.");
  }
};

const deleteHistoricalData = async () => {
  deletingData.value = true;
  deleteError.value = null;

  try {
    const dbFirestore = getFirestore();
    const deleteDateTimestamp = new Date(deleteEndDate.value).getTime();

    const movementsCollectionRef = collection(dbFirestore, "movements");
    const q = query(
      movementsCollectionRef,
      where("fecha", "<=", deleteDateTimestamp),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No se encontraron movimientos para eliminar.");
      alert(
        "No se encontraron movimientos para eliminar en ese rango de fechas.",
      );
      showDeleteConfirmModal.value = false;
      return;
    }

    console.log(
      `Se encontraron ${querySnapshot.size} movimientos para eliminar.`,
    );

    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);
    console.log("Eliminación de documentos en Firebase completada.");

    await db.movements
      .where("fecha")
      .belowOrEqual(deleteDateTimestamp)
      .delete();
    console.log(
      "Eliminación de documentos en la base de datos local (IndexedDB) completada.",
    );

    alert(
      `Se han eliminado ${querySnapshot.size} movimientos históricos de Firebase e IndexedDB correctamente.`,
    );
    showDeleteConfirmModal.value = false;
    deleteEndDate.value = "";
  } catch (error) {
    deleteError.value = error;
    console.error("Error al intentar eliminar datos históricos:", error);
    alert(
      `Ocurrió un error al eliminar los datos: ${error.message}. Revisa la consola para más detalles.`,
    );
  } finally {
    deletingData.value = false;
  }
};

const exportClientsToExcel = async () => {
  await store.dispatch("clients/fetchClients");

  if (allClients.value && allClients.value.length > 0) {
    const clientsToExport = allClients.value.map((client) => ({
      nombre: client.nombre,
      ci: client.ci || "N/A",
      celular: client.celular || "N/A",
      direccion: client.direccion || "N/A",
      saldoActual: formatCurrency(client.saldoActual),
    }));

    const headers = [
      { key: "nombre", title: "Nombre Completo" },
      { key: "ci", title: "CI / NIT" },
      { key: "celular", title: "Celular" },
      { key: "direccion", title: "Dirección" },
      { key: "saldoActual", title: "Saldo Actual" },
    ];

    exportToExcel(clientsToExport, "Clientes", headers);
  } else {
    alert("No hay clientes para exportar.");
  }
};

onMounted(() => {
  store.dispatch("clients/fetchClients");
});
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 30px;
  background-color: #2c2c2c;
  border-radius: 15px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  color: #e0e0e0;
}

.page-title {
  font-size: 2.5em;
  color: #00bfff;
  text-align: center;
  margin-bottom: 35px;
  font-family: "Orbitron", sans-serif;
  text-shadow: 0 0 15px rgba(0, 191, 255, 0.7);
}

.card {
  background-color: #3b3b3b;
  padding: 25px;
  margin-bottom: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  border: 1px solid #4a4a4a;
}

.section-title {
  font-size: 1.8em;
  color: #00bfff;
  margin-bottom: 20px;
  border-bottom: 2px solid #4a4a4a;
  padding-bottom: 10px;
}

p {
  line-height: 1.6;
  margin-bottom: 15px;
}

.warning-text {
  color: #ff6347;
  font-weight: bold;
}

.error-message {
  color: #ff4d4d;
  background-color: #4a1c1c;
  padding: 10px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #add8e6;
}

input[type="date"] {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #4682b4;
  border-radius: 8px;
  background: #1a2a3a;
  color: #e0e0e0;
  font-size: 1em;
  box-sizing: border-box;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

input[type="date"]:focus {
  border-color: #00bfff;
  box-shadow: 0 0 8px rgba(0, 191, 255, 0.5);
  outline: none;
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition:
    background 0.3s ease,
    transform 0.2s ease,
    box-shadow 0.3s ease;
  min-width: 120px;
}

.btn.primary {
  background: linear-gradient(45deg, #00bfff, #1e90ff);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 191, 255, 0.4);
}

.btn.primary:hover:not(:disabled) {
  background: linear-gradient(45deg, #1e90ff, #00bfff);
  transform: translateY(-2px);
}

.btn.primary:disabled {
  background: #424242;
  cursor: not-allowed;
  box-shadow: none;
}

.btn.delete-btn {
  background: linear-gradient(45deg, #ff6347, #cd5c5c);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 99, 71, 0.4);
}

.btn.delete-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #cd5c5c, #ff6347);
  transform: translateY(-2px);
}

.btn.delete-btn:disabled {
  background: #424242;
  cursor: not-allowed;
  box-shadow: none;
}

.btn.secondary {
  background: linear-gradient(45deg, #6a5acd, #483d8b);
  color: white;
  box-shadow: 0 4px 15px rgba(106, 90, 205, 0.4);
}

.btn.secondary:hover {
  background: linear-gradient(45deg, #483d8b, #6a5acd);
  transform: translateY(-2px);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #3b3b3b;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.8);
  max-width: 500px;
  width: 90%;
  text-align: center;
  border: 1px solid #4a4a4a;
}

.modal-content h2 {
  color: #00bfff;
  margin-bottom: 20px;
}

/* Media Queries para responsividad */
@media (max-width: 768px) {
  .page-container {
    padding: 20px;
    margin: 20px auto;
  }

  .page-title {
    font-size: 2em;
    margin-bottom: 25px;
  }

  .card {
    padding: 20px;
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 1.6em;
    margin-bottom: 15px;
  }

  .input-group label {
    font-size: 0.9em;
  }

  .input-group input {
    padding: 10px 12px;
  }

  .button-group {
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  .btn {
    width: 100%;
    padding: 10px 20px;
    font-size: 0.95em;
  }
}
</style>
