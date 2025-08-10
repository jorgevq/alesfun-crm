<template>
  <div class="page-container">
    <h1 class="page-title">Consulta de Recibos</h1>

    <div class="search-section card">
      <h2 class="section-title">Buscar Recibo</h2>
      <div class="input-group">
        <label for="client-search-receipt"
          >Buscar por Cliente (Nombre o CI):</label
        >
        <input
          type="text"
          id="client-search-receipt"
          v-model="clientSearchTerm"
          @input="searchClientsForReceipts"
          placeholder="Escribe para buscar cliente..."
          class="input-field"
        />
        <ul
          v-if="clientSuggestions.length && clientSearchTerm.length > 2"
          class="suggestions-list"
        >
          <li
            v-for="client in clientSuggestions"
            :key="client.firestoreId"
            @click="selectClientForReceipts(client)"
          >
            {{ client.nombre }} (CI: {{ client.ci }})
          </li>
        </ul>
      </div>

      <div v-if="selectedClient" class="selected-client-info">
        <h3>Cliente Seleccionado:</h3>
        <p><strong>Nombre:</strong> {{ selectedClient.nombre }}</p>
        <p><strong>CI:</strong> {{ selectedClient.ci }}</p>
        <button class="btn secondary small" @click="clearClientSelection">
          Cambiar Cliente
        </button>
      </div>
      <p v-else class="no-data-message">
        Selecciona un cliente para ver sus recibos.
      </p>

      <div class="input-group" v-if="selectedClient">
        <label for="receipt-date-filter">Filtrar por Fecha:</label>
        <input
          type="date"
          id="receipt-date-filter"
          v-model="receiptDateFilter"
          class="input-field"
        />
      </div>

      <div class="button-group" v-if="selectedClient">
        <button class="btn primary" @click="filterReceipts">
          Buscar Recibos
        </button>
        <button class="btn secondary" @click="clearReceiptFilter">
          Limpiar Filtro
        </button>
      </div>
    </div>

    <div v-if="filteredReceipts.length > 0" class="receipts-list-section card">
      <h2 class="section-title">Recibos del Cliente</h2>
      <div class="receipt-table-container responsive-table">
        <table class="receipt-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Saldo Ant.</th>
              <th>Nuevo Saldo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="receipt in filteredReceipts" :key="receipt.firestoreId">
              <td>{{ formatDate(receipt.fecha) }}</td>
              <td>{{ receipt.type === "venta" ? "Venta" : "Pago a/c" }}</td>
              <td>{{ formatCurrency(receipt.monto) }}</td>
              <td>{{ formatCurrency(receipt.saldoAnterior) }}</td>
              <td>{{ formatCurrency(receipt.newBalance) }}</td>
              <td class="actions-cell">
                <button
                  class="btn small primary-light"
                  @click="viewReceiptDetails(receipt)"
                >
                  Ver Recibo
                </button>
                <button
                  class="btn small delete-btn"
                  @click="confirmDeleteReceipt(receipt)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-trash-2"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    ></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p v-else-if="selectedClient" class="no-data-message">
      No se encontraron recibos para el cliente seleccionado en el período.
    </p>
  </div>

  <!-- Modal para mostrar el recibo en texto plano -->
  <div
    v-if="showReceiptModal"
    class="modal-overlay"
    @click.self="closeReceiptModal"
  >
    <div class="modal-content">
      <button class="close-modal-button" @click="closeReceiptModal">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="feather feather-x"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <h2 class="section-title">Detalle del Recibo</h2>
      <pre class="receipt-preview">{{ currentReceiptText }}</pre>
      <div class="button-group">
        <button class="btn primary" @click="copyReceiptToClipboard">
          Copiar Recibo
        </button>
        <button class="btn secondary" @click="printReceipt">
          Imprimir Recibo
        </button>
      </div>
    </div>
  </div>

  <!-- Modal de Confirmación de Eliminación de Recibo/Movimiento -->
  <div
    v-if="showDeleteConfirmModal"
    class="modal-overlay"
    @click.self="cancelDeleteReceipt"
  >
    <div class="modal-content delete-modal">
      <h2 class="section-title">Confirmar Eliminación de Recibo</h2>
      <p class="modal-message">
        ¿Estás seguro de que quieres eliminar este recibo (movimiento) del
        cliente <strong>{{ receiptToDelete.clienteNombre }}</strong
        >?
      </p>
      <p class="modal-message-warning">
        Esta acción es irreversible y podría afectar el saldo del cliente si no
        se ajusta manualmente. Para confirmar, escribe "YES" en el campo de
        abajo.
      </p>
      <input
        type="text"
        v-model="deleteConfirmText"
        placeholder="Escribe YES para confirmar"
        class="input-field"
        @keyup.enter="deleteReceipt"
      />
      <div class="button-group">
        <button
          class="btn primary delete-confirm-btn"
          @click="deleteReceipt"
          :disabled="deleteConfirmText.toLowerCase() !== 'yes'"
        >
          Eliminar Recibo
        </button>
        <button class="btn secondary" @click="cancelDeleteReceipt">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useStore } from "vuex";
import db from "@/utils/db"; // Ensure your IndexedDB instance is exported here
import {
  formatCurrency,
  formatInputData,
  generateReceiptText,
} from "@/utils/helpers";
import { forceSync } from "@/utils/syncService"; // Ensure syncService.js exists

const store = useStore();

const clientSearchTerm = ref("");
const clientSuggestions = ref([]);
const selectedClient = ref(null);
const receiptDateFilter = ref("");
const filteredReceipts = ref([]);

const showReceiptModal = ref(false);
const currentReceiptText = ref("");

// --- State for Receipt/Movement Deletion ---
const showDeleteConfirmModal = ref(false);
const receiptToDelete = ref(null);
const deleteConfirmText = ref("");

const allClients = computed(() => store.getters["clients/getClients"]);
const allMovements = computed(() => store.getters["sales/getMovements"]);

// --- Client Search and Selection ---
const searchClientsForReceipts = () => {
  if (clientSearchTerm.value.length < 3) {
    clientSuggestions.value = [];
    return;
  }
  const term = formatInputData(clientSearchTerm.value);
  clientSuggestions.value = allClients.value
    .filter(
      (client) =>
        client.firestoreId &&
        (formatInputData(client.nombre).includes(term) ||
          formatInputData(client.ci).includes(term)),
    )
    .slice(0, 3); // Limit to 3 suggestions
};

const selectClientForReceipts = (client) => {
  selectedClient.value = client;
  clientSearchTerm.value = client.nombre; // Display name in input
  clientSuggestions.value = []; // Clear suggestions
  filterReceipts(); // Automatically load receipts when client is selected
};

const clearClientSelection = () => {
  selectedClient.value = null;
  clientSearchTerm.value = "";
  receiptDateFilter.value = "";
  filteredReceipts.value = [];
  currentReceiptText.value = ""; // Clear the receipt from the modal if it was open
};

// --- Receipt Filtering ---
const filterReceipts = () => {
  if (!selectedClient.value) {
    filteredReceipts.value = [];
    return;
  }

  // CORRECCIÓN CLAVE: Filtrar por clienteFirestoreId
  let movements = allMovements.value.filter(
    (mov) => mov.clienteFirestoreId === selectedClient.value.firestoreId,
  );

  if (receiptDateFilter.value) {
    const filterDate = new Date(receiptDateFilter.value);
    filterDate.setHours(0, 0, 0, 0); // Start of the day
    const nextDay = new Date(filterDate);
    nextDay.setDate(filterDate.getDate() + 1); // Start of the next day

    movements = movements.filter((mov) => {
      const movDate = new Date(mov.fecha);
      return (
        movDate.getTime() >= filterDate.getTime() &&
        movDate.getTime() < nextDay.getTime()
      );
    });
  }

  // Sort movements from most recent to oldest
  filteredReceipts.value = movements.sort((a, b) => b.fecha - a.fecha);
};

const clearReceiptFilter = () => {
  receiptDateFilter.value = "";
  filterReceipts(); // Filter again without the date
};

// --- Receipt Display ---
const viewReceiptDetails = (receipt) => {
  const client = selectedClient.value;
  if (!client) {
    alert("Error: Cliente no seleccionado para ver el recibo.");
    return;
  }

  // Get the last 3 movements of the client for the receipt
  const last3Movements = store.getters["sales/getLast3MovementsByClient"](
    client.firestoreId,
  );

  const receiptData = {
    clientName: client.nombre,
    clientCi: client.ci,
    type: receipt.type === "venta" ? "Venta" : "P. a/c",
    amountPaid: receipt.montoPago || receipt.monto,
    prevBalance: receipt.saldoAnterior,
    newBalance: receipt.newBalance,
    items: receipt.ventaItems || [],
    totalSale: receipt.type === "venta" ? receipt.monto : 0,
    change: receipt.cambio || 0,
    last3Movements: last3Movements,
  };
  currentReceiptText.value = generateReceiptText(receiptData);
  showReceiptModal.value = true;
};

const closeReceiptModal = () => {
  showReceiptModal.value = false;
  currentReceiptText.value = "";
};

const copyReceiptToClipboard = () => {
  const textarea = document.createElement("textarea");
  textarea.value = currentReceiptText.value;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    alert("Recibo copiado al portapapeles.");
  } catch (err) {
    console.error("Error al copiar al portapapeles:", err);
    alert("No se pudo copiar el recibo. Por favor, cópialo manualmente.");
  } finally {
    document.body.removeChild(textarea);
  }
};

const printReceipt = () => {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
    <head>
      <title>Recibo ALESFUN</title>
      <style>
        body { font-family: 'monospace', sans-serif; font-size: 12px; white-space: pre-wrap; margin: 20px; }
        pre { margin: 0; }
      </style>
    </head>
    <body>
      <pre>${currentReceiptText.value}</pre>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

// --- Receipt/Movement Deletion Methods ---
const confirmDeleteReceipt = (receipt) => {
  receiptToDelete.value = receipt;
  deleteConfirmText.value = ""; // Clear confirmation field
  showDeleteConfirmModal.value = true;
};

const deleteReceipt = async () => {
  if (deleteConfirmText.value.toLowerCase() !== "yes") {
    alert("Debes escribir 'YES' para confirmar la eliminación.");
    return;
  }
  if (!receiptToDelete.value || !receiptToDelete.value.firestoreId) {
    alert("Error: No hay recibo seleccionado para eliminar.");
    return;
  }

  try {
    // Delete from IndexedDB
    // Nota: Si IndexedDB usa 'id' autoincremental como clave primaria y no 'firestoreId',
    // necesitarás obtener el ID local de Dexie para el borrado.
    // Asumiendo que 'firestoreId' es la clave primaria o un índice único en Dexie para 'movements'.
    // Si no, necesitarías: const localMov = await db.movements.where('firestoreId').equals(receiptToDelete.value.firestoreId).first();
    // await db.movements.delete(localMov.id);
    await db.movements.delete(receiptToDelete.value.firestoreId); // Esto asume que firestoreId es la clave primaria en Dexie
    console.log(
      "Movimiento eliminado de IndexedDB:",
      receiptToDelete.value.firestoreId,
    );

    // Add to sync queue
    await db.syncQueue.add({
      collectionName: "movements",
      operation: "delete",
      data: { id: receiptToDelete.value.firestoreId }, // Only need the ID to delete in Firestore
      localId: receiptToDelete.value.firestoreId, // Usar firestoreId como localId para la cola
      firestoreId: receiptToDelete.value.firestoreId,
      timestamp: Date.now(),
    });

    alert("Recibo eliminado exitosamente. Se sincronizará pronto.");
    cancelDeleteReceipt(); // Close modal and clear state
    await store.dispatch("sales/fetchMovements"); // Reload movements
    // No need to force sync here, as deleting a movement does not directly affect the client's balance
    // unless a balance reversal logic is implemented, which is more complex and was not requested.
    // Deleting a movement should not automatically change the client's balance.
    store.dispatch("startSyncAnimation");
    setTimeout(() => {
      forceSync();
    }, 500);
  } catch (error) {
    console.error("Error al eliminar recibo:", error);
    alert("Error al eliminar recibo. Revisa la consola.");
  }
};

const cancelDeleteReceipt = () => {
  showDeleteConfirmModal.value = false;
  receiptToDelete.value = null;
  deleteConfirmText.value = "";
};

// --- Watchers ---
watch(selectedClient, (newClient) => {
  if (newClient) {
    filterReceipts();
  } else {
    filteredReceipts.value = [];
  }
});

// --- Component Lifecycle ---
onMounted(async () => {
  await store.dispatch("clients/fetchClients");
  await store.dispatch("sales/fetchMovements"); // Asegúrate de cargar movimientos al inicio
});

// --- Date Formatting for Table ---
const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString("es-BO") +
    " " +
    date.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
  );
};
</script>

<style scoped>
/* Fuentes (ya deberían estar en global.css, pero se mantienen aquí para este componente) */
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

/* Estilos generales de la página */
.page-container {
  padding: 20px;
  max-width: 900px;
  margin: 20px auto;
  background-color: rgba(0, 0, 0, 0.6); /* Fondo más oscuro y translúcido */
  border-radius: 20px; /* Más redondeado */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7); /* Sombra más pronunciada */
  border: 2px solid rgba(0, 191, 255, 0.4); /* Borde más visible */
  overflow-y: auto; /* Permite el scroll vertical si el contenido excede la altura */
  max-height: calc(
    100vh - 120px
  ); /* Ajusta la altura máxima para no desbordar */
}

.page-title {
  font-family: "Orbitron", sans-serif;
  color: #00bfff; /* Azul neón */
  font-size: 2.8em; /* Más grande */
  text-align: center;
  margin-bottom: 40px;
  text-shadow:
    0 0 15px #00bfff,
    0 0 25px rgba(0, 191, 255, 0.6); /* Glow más intenso */
  letter-spacing: 1.5px;
}

.card {
  background-color: rgba(
    10,
    10,
    20,
    0.8
  ); /* Fondo de tarjeta más oscuro y opaco */
  border-radius: 15px; /* Más redondeado */
  padding: 30px; /* Más padding */
  margin-bottom: 30px; /* Más margen inferior */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); /* Sombra más profunda */
  border: 1px solid rgba(0, 191, 255, 0.3); /* Borde más sutil */
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
}

.section-title {
  font-family: "Orbitron", sans-serif;
  color: #87ceeb; /* Azul cielo claro */
  font-size: 1.8em; /* Más grande */
  margin-bottom: 25px;
  text-align: center;
  text-shadow:
    0 0 8px #87ceeb,
    0 0 15px rgba(135, 206, 235, 0.4); /* Glow azul claro */
}

.input-group {
  margin-bottom: 20px;
  position: relative;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #add8e6; /* Azul claro */
  font-size: 1em; /* Más grande */
  letter-spacing: 0.5px;
}

.input-field {
  width: 100%;
  padding: 12px 15px; /* Más padding */
  border: 2px solid #4682b4; /* Borde más grueso */
  border-radius: 8px; /* Más redondeado */
  background-color: #1a2a3a; /* Fondo oscuro */
  color: #e0e0e0; /* Texto claro */
  font-size: 1.1em; /* Más grande */
  box-sizing: border-box;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.input-field:focus {
  border-color: #00bfff; /* Azul neón al enfocar */
  box-shadow: 0 0 12px rgba(0, 191, 255, 0.6); /* Glow azul al enfocar */
  outline: none;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #1a2a3a;
  border: 1px solid #00bfff; /* Borde azul neón */
  border-radius: 8px;
  list-style: none;
  padding: 0;
  margin-top: 5px;
  max-height: 200px;
  overflow-y: auto; /* Mantener scroll vertical para sugerencias */
  z-index: 10;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
}

.suggestions-list li {
  padding: 12px 15px;
  cursor: pointer;
  color: #e0e0e0;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.suggestions-list li:hover {
  background-color: rgba(
    0,
    191,
    255,
    0.3
  ); /* Fondo azul más intenso al pasar el ratón */
  color: white;
}

.selected-client-info {
  background-color: rgba(0, 191, 255, 0.15); /* Fondo azul más visible */
  border: 1px solid rgba(0, 191, 255, 0.5); /* Borde azul más fuerte */
  border-radius: 12px;
  padding: 20px;
  margin-top: 25px;
  text-align: left;
  box-shadow: 0 2px 10px rgba(0, 191, 255, 0.2);
}

.selected-client-info h3 {
  color: #a7f3d0; /* Verde lima para el título del cliente */
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.3em;
  text-shadow: 0 0 5px rgba(167, 243, 208, 0.3);
}

.selected-client-info p {
  margin-bottom: 8px;
  font-size: 1em;
  color: #c0c0c0; /* Gris claro */
}

.selected-client-info p strong {
  color: #e0e0e0; /* Un blanco más puro para las etiquetas */
}

.no-data-message {
  text-align: center;
  margin-top: 25px;
  font-size: 1.1em;
  color: #b0bec5;
  font-style: italic;
}

/* Tablas */
.receipt-table-container {
  border-radius: 15px;
  border: 1px solid rgba(0, 191, 255, 0.3);
  margin-top: 25px;
  background-color: rgba(10, 10, 20, 0.8);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  overflow: hidden; /* Asegura que los bordes redondeados se apliquen al contenido */
}

.responsive-table {
  width: 100%;
  overflow-x: auto; /* Permite el scroll horizontal SÓLO en la tabla si es demasiado ancha */
  -webkit-overflow-scrolling: touch; /* Mejora el scroll en iOS */
}

.receipt-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 650px; /* Ancho mínimo para la tabla en móviles para evitar colapso excesivo */
}

.receipt-table th,
.receipt-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 191, 255, 0.15);
  color: #e0e0e0;
}

.receipt-table th {
  background-color: rgba(0, 191, 255, 0.1);
  color: #a7f3d0;
  font-family: "Orbitron", sans-serif;
  font-weight: 500;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.receipt-table tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.1);
}

.receipt-table tbody tr:hover {
  background-color: rgba(0, 191, 255, 0.08);
}

.receipt-table td {
  font-size: 0.95em;
}

.actions-cell {
  white-space: nowrap; /* Evita que los botones se envuelvan */
  display: flex;
  gap: 8px; /* Espacio entre botones de acción */
  justify-content: center;
  align-items: center;
  height: 100%; /* Asegura que los botones estén centrados verticalmente */
}

/* Botones */
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
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn svg {
  margin-right: 8px;
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

.btn.secondary {
  background: linear-gradient(45deg, #6a5acd, #483d8b);
  color: white;
  box-shadow: 0 4px 15px rgba(106, 90, 205, 0.4);
}

.btn.secondary:hover {
  background: linear-gradient(45deg, #483d8b, #6a5acd);
  transform: translateY(-2px);
}

.btn.small {
  padding: 8px 15px;
  font-size: 0.85em;
  min-width: unset;
}

.btn.primary-light {
  background: linear-gradient(45deg, #4682b4, #00bfff);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 191, 255, 0.3);
}

.btn.primary-light:hover {
  background: linear-gradient(45deg, #00bfff, #4682b4);
  transform: translateY(-2px);
}

.delete-btn {
  background: linear-gradient(45deg, #ff5252, #e04040); /* Rojo */
  color: white;
  box-shadow: 0 2px 8px rgba(255, 82, 82, 0.3);
}
.delete-btn:hover {
  background: linear-gradient(45deg, #e04040, #ff5252);
  transform: translateY(-1px);
}

/* Modal General */
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
  z-index: 2000;
}

.modal-content {
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 5px 25px rgba(0, 191, 255, 0.5);
  position: relative;
  border: 1px solid rgba(0, 191, 255, 0.5);
}

.close-modal-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #ff5252;
  font-size: 1.5em;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.close-modal-button:hover {
  background: rgba(255, 82, 82, 0.1);
}

.close-modal-button svg {
  width: 24px;
  height: 24px;
  stroke-width: 2;
}

.receipt-preview {
  background-color: #1a2a3a;
  border: 1px solid #00bfff;
  border-radius: 10px;
  padding: 20px;
  white-space: pre-wrap;
  font-family: "monospace";
  font-size: 0.95em;
  max-height: 350px;
  overflow-y: auto;
  color: #a7f3d0;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

/* Modal de Eliminación */
.modal-content.delete-modal {
  background-color: rgba(
    20,
    20,
    30,
    0.95
  ); /* Fondo más oscuro para el modal de eliminación */
  border-radius: 15px;
  padding: 30px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 5px 30px rgba(255, 82, 82, 0.6); /* Sombra roja para advertencia */
  position: relative;
  border: 2px solid #ff5252; /* Borde rojo */
  text-align: center;
}

.modal-message {
  font-size: 1.1em;
  color: #e0e0e0;
  margin-bottom: 20px;
  line-height: 1.5;
}

.modal-message-warning {
  font-size: 1.05em;
  color: #ffc107; /* Amarillo para la advertencia */
  font-weight: bold;
  margin-bottom: 20px;
}

.delete-confirm-btn {
  background: linear-gradient(45deg, #ff5252, #e04040); /* Rojo */
  box-shadow: 0 4px 15px rgba(255, 82, 82, 0.5);
}
.delete-confirm-btn:disabled {
  background: #424242;
  cursor: not-allowed;
  box-shadow: none;
}

/* Media Queries para responsividad */
@media (max-width: 768px) {
  .page-container {
    padding: 15px;
    margin: 10px auto;
    border-radius: 15px;
    max-height: calc(100vh - 100px); /* Ajuste para móviles */
  }
  .page-title {
    font-size: 2.2em;
    margin-bottom: 30px;
  }
  .card {
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 12px;
  }
  .section-title {
    font-size: 1.5em;
    margin-bottom: 20px;
  }
  .input-field {
    padding: 10px 12px;
    font-size: 1em;
  }
  label {
    font-size: 0.9em;
  }
  .button-group {
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
  }
  .btn {
    width: 100%;
    padding: 12px 20px;
    font-size: 1em;
  }
  .btn.small {
    padding: 8px 15px;
    font-size: 0.9em;
  }
  .responsive-table {
    overflow-x: auto; /* Asegura scroll horizontal para la tabla en móviles */
  }
  .receipt-table {
    min-width: 450px; /* Asegura que la tabla no se colapse demasiado */
  }
  .receipt-table th,
  .receipt-table td {
    padding: 10px 12px;
    font-size: 0.85em;
  }
  .actions-cell {
    flex-direction: row; /* Mantener horizontal en móvil si hay espacio */
    justify-content: center;
  }
  .modal-content {
    padding: 20px;
  }
  .receipt-preview {
    padding: 15px;
    font-size: 0.85em;
    max-height: 250px;
  }
  .modal-content.delete-modal {
    padding: 20px;
  }
  .modal-message,
  .modal-message-warning {
    font-size: 1em;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8em;
    margin-bottom: 25px;
  }
  .card {
    padding: 15px;
    margin-bottom: 15px;
  }
  .section-title {
    font-size: 1.3em;
    margin-bottom: 15px;
  }
  .input-field {
    padding: 8px 10px;
    font-size: 0.9em;
  }
  label {
    font-size: 0.85em;
  }
  .receipt-table {
    min-width: 350px;
  }
  .receipt-table th,
  .receipt-table td {
    padding: 8px 10px;
    font-size: 0.75em;
  }
  .receipt-preview {
    font-size: 0.8em;
  }
}
</style>
