<template>
  <div class="page-container">
    <h1 class="page-title">Deudores</h1>
    <p class="intro-text">Aquí se listarán los clientes con saldo pendiente.</p>

    <div v-if="loading" class="loading-message card">Cargando deudores...</div>
    <div v-else-if="error" class="error-message card">
      Error al cargar deudores: {{ error.message }}
    </div>
    <div v-else-if="debtors.length > 0" class="debtors-list-container card">
      <h2 class="section-title">
        Clientes con Saldo Pendiente ({{ debtors.length }})
      </h2>
      <ul class="debtors-list">
        <li
          v-for="debtor in debtors"
          :key="debtor.firestoreId"
          class="debtor-item"
        >
          <div class="debtor-info">
            <span class="debtor-name">{{ debtor.nombre }}</span>
            <span class="debtor-ci">CI: {{ debtor.ci }}</span>
            <span class="debtor-balance"
              >Saldo: {{ formatCurrency(debtor.saldoActual) }}</span
            >
          </div>
          <button
            @click="viewClientDetails(debtor)"
            class="btn small primary-light"
          >
            Ver Detalles
          </button>
        </li>
      </ul>
    </div>
    <div v-else class="no-data-message card">
      <p>¡Felicidades! No hay clientes con saldo pendiente en este momento.</p>
    </div>

    <!-- Modal para mostrar los detalles del cliente y sus movimientos -->
    <div
      v-if="showClientDetailsModal"
      class="modal-overlay"
      @click.self="closeClientDetailsModal"
    >
      <div class="modal-content client-details-modal">
        <button class="close-modal-button" @click="closeClientDetailsModal">
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
        <h2 class="section-title">Detalles del Cliente</h2>

        <div v-if="loadingClient || loadingMovements" class="loading-message">
          Cargando detalles...
        </div>
        <div v-else-if="clientError || movementsError" class="error-message">
          Error: {{ clientError?.message || movementsError?.message }}
        </div>
        <div v-else-if="!selectedClientForDetails" class="no-data-message">
          No se pudo cargar la información del cliente.
        </div>
        <div v-else>
          <!-- Información Principal del Cliente -->
          <div class="client-info-section">
            <p>
              <strong>Nombre:</strong> {{ selectedClientForDetails.nombre }}
            </p>
            <p><strong>CI / NIT:</strong> {{ selectedClientForDetails.ci }}</p>
            <p>
              <strong>Celular:</strong>
              {{ selectedClientForDetails.celular || "N/A" }}
            </p>
            <p>
              <strong>Saldo Actual:</strong>
              <span
                :class="{
                  'saldo-positivo': selectedClientForDetails.saldoActual <= 0,
                  'saldo-negativo': selectedClientForDetails.saldoActual > 0,
                }"
              >
                {{ formatCurrency(selectedClientForDetails.saldoActual) }}
              </span>
            </p>
            <p>
              <strong>Fecha de Registro:</strong>
              {{ formatDate(selectedClientForDetails.fechaRegistro) }}
            </p>
            <div class="button-group">
              <button class="btn primary" @click="editClient">
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
                  class="feather feather-edit"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  ></path>
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  ></path>
                </svg>
                Editar Cliente
              </button>
              <button class="btn secondary" @click="initiateSale">
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
                  class="feather feather-shopping-cart"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path
                    d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                  ></path>
                </svg>
                Nueva Venta/Pago
              </button>
            </div>
          </div>

          <!-- Historial de Movimientos -->
          <div class="movements-history-section">
            <h3 class="section-subtitle">Historial de Movimientos</h3>
            <div v-if="clientMovements.length > 0" class="responsive-table">
              <table class="movements-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Saldo Ant.</th>
                    <th>Nuevo Saldo</th>
                    <th>Recibo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mov in clientMovements" :key="mov.firestoreId">
                    <td>{{ formatDate(mov.fecha) }}</td>
                    <td>{{ mov.type === "venta" ? "Venta" : "Pago a/c" }}</td>
                    <td>{{ formatCurrency(mov.monto) }}</td>
                    <td>{{ formatCurrency(mov.saldoAnterior) }}</td>
                    <td>{{ formatCurrency(mov.newBalance) }}</td>
                    <td>
                      <button
                        class="btn small primary-light"
                        @click="viewReceiptDetailsInModal(mov)"
                      >
                        Ver Recibo
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="no-data-message">
              No hay movimientos registrados para este cliente.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para mostrar el recibo en texto plano (dentro del modal de detalles del cliente) -->
    <div
      v-if="showReceiptModal"
      class="modal-overlay nested-modal"
      @click.self="closeReceiptModal"
    >
      <div class="modal-content receipt-modal-content">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  formatCurrency,
  generateReceiptText,
  // Removed unused imports:
  // formatInputData,
  // generateWhatsAppLink,
} from "@/utils/helpers";

const store = useStore();
const router = useRouter();

// State for the list of debtors
const debtors = computed(() => store.getters["clients/getDebtors"]);
const loading = computed(() => store.state.clients.loading);
const error = computed(() => store.state.clients.error);

// State for the client details modal
const showClientDetailsModal = ref(false);
const selectedClientForDetails = ref(null);
const clientMovements = ref([]);
const loadingClient = ref(false);
const loadingMovements = ref(false);
const clientError = ref(null);
const movementsError = ref(null);

// State for the receipt modal (nested)
const showReceiptModal = ref(false);
const currentReceiptText = ref("");

// Computed properties from the store
const allClients = computed(() => store.getters["clients/getClients"]);
const allMovements = computed(() => store.getters["sales/getMovements"]);

// --- Functions for Client Details Modal ---
const viewClientDetails = async (client) => {
  showClientDetailsModal.value = true;
  selectedClientForDetails.value = null; // Clear before loading
  clientMovements.value = [];
  clientError.value = null;
  movementsError.value = null;

  loadingClient.value = true;
  loadingMovements.value = true;

  try {
    // Find the client in the store by firestoreId
    const foundClient = allClients.value.find(
      (c) => c.firestoreId === client.firestoreId,
    );
    if (foundClient) {
      selectedClientForDetails.value = foundClient;
      console.log(
        "Cliente encontrado en store para detalles:",
        selectedClientForDetails.value,
      );
    } else {
      console.warn(
        "Cliente no encontrado en el store Vuex. Intentando recargar clientes.",
      );
      await store.dispatch("clients/fetchClients"); // Try reloading clients
      const reFoundClient = allClients.value.find(
        (c) => c.firestoreId === client.firestoreId,
      );
      if (reFoundClient) {
        selectedClientForDetails.value = reFoundClient;
        console.log(
          "Cliente encontrado después de recargar store:",
          selectedClientForDetails.value,
        );
      } else {
        selectedClientForDetails.value = null;
        clientError.value = new Error("Cliente no encontrado.");
      }
    }
  } catch (err) {
    console.error("Error al buscar cliente para detalles:", err);
    clientError.value = err;
  } finally {
    loadingClient.value = false;
  }

  // Load client movements
  try {
    const movements = allMovements.value.filter(
      (mov) => mov.clienteId === client.firestoreId,
    );
    clientMovements.value = movements.sort((a, b) => b.fecha - a.fecha);
    console.log(
      "Movimientos del cliente cargados para detalles:",
      clientMovements.value.length,
    );
  } catch (err) {
    console.error("Error al cargar movimientos para detalles:", err);
    movementsError.value = err;
  } finally {
    loadingMovements.value = false;
  }
};

const closeClientDetailsModal = () => {
  showClientDetailsModal.value = false;
  selectedClientForDetails.value = null;
  clientMovements.value = [];
  currentReceiptText.value = ""; // Also clear the receipt if it was open
  showReceiptModal.value = false; // Ensure receipt modal is closed if it was open
};

// --- Actions from Client Details Modal ---
const editClient = () => {
  if (selectedClientForDetails.value) {
    router.push({
      name: "Clients",
      query: { editId: selectedClientForDetails.value.firestoreId },
    });
    closeClientDetailsModal(); // Close the modal when navigating
  }
};

const initiateSale = () => {
  if (selectedClientForDetails.value) {
    router.push({
      name: "Sales",
      query: { clientId: selectedClientForDetails.value.firestoreId },
    });
    closeClientDetailsModal(); // Close the modal when navigating
  }
};

// --- Functions for Receipt Modal (nested) ---
const viewReceiptDetailsInModal = (movement) => {
  if (!selectedClientForDetails.value) {
    alert("Error: Cliente no seleccionado para ver el recibo.");
    return;
  }

  const receiptData = {
    clientName: selectedClientForDetails.value.nombre,
    clientCi: selectedClientForDetails.value.ci,
    type: movement.type === "venta" ? "Venta" : "P. a/c",
    amountPaid: movement.montoPago || movement.monto,
    prevBalance: movement.saldoAnterior,
    newBalance: movement.newBalance,
    items: movement.ventaItems || [],
    totalSale: movement.type === "venta" ? movement.monto : 0,
    change: movement.cambio || 0,
    // generateReceiptText will fetch last3Movements if needed
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

// --- Formatting Utilities ---
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString("es-BO") +
    " " +
    date.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
  );
};

// --- Component Lifecycle ---
onMounted(async () => {
  await store.dispatch("clients/fetchClients");
  await store.dispatch("sales/fetchMovements");
});

// Watch for changes in store getters to update modal data if already open
watch(
  allClients,
  (newClients) => {
    if (showClientDetailsModal.value && selectedClientForDetails.value) {
      const foundClient = newClients.find(
        (c) => c.firestoreId === selectedClientForDetails.value.firestoreId,
      );
      if (foundClient) {
        selectedClientForDetails.value = foundClient;
      }
    }
  },
  { deep: true },
);

watch(
  allMovements,
  (newMovements) => {
    if (showClientDetailsModal.value && selectedClientForDetails.value) {
      const movements = newMovements.filter(
        (mov) => mov.clienteId === selectedClientForDetails.value.firestoreId,
      );
      clientMovements.value = movements.sort((a, b) => b.fecha - a.fecha);
    }
  },
  { deep: true },
);
</script>

<style scoped>
/* Fuentes (ya deberían estar en global.css, pero se mantienen aquí para este componente) */
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

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
  color: #e0e0e0;
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

.intro-text {
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.1em;
  color: #add8e6;
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

.section-subtitle {
  font-family: "Orbitron", sans-serif;
  color: #a7f3d0; /* Verde lima */
  font-size: 1.4em;
  margin-top: 30px;
  margin-bottom: 20px;
  text-align: center;
  text-shadow: 0 0 5px #a7f3d0;
}

.loading-message,
.error-message,
.no-data-message {
  text-align: center;
  padding: 20px;
  font-size: 1.1em;
  border-radius: 10px;
  margin-top: 20px;
  color: #e0e0e0; /* Texto claro por defecto */
}

.loading-message {
  background-color: rgba(0, 191, 255, 0.1);
  color: #00bfff;
}

.error-message {
  background-color: rgba(255, 99, 71, 0.1);
  color: #ff6347;
}

.no-data-message {
  background-color: rgba(144, 238, 144, 0.1);
  color: #90ee90;
  font-style: italic;
}

.debtors-list {
  list-style: none;
  padding: 0;
}

.debtor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255, 82, 82, 0.1); /* Fondo rojizo para deudores */
  border: 1px solid rgba(255, 82, 82, 0.3);
  border-radius: 10px; /* Más redondeado */
  padding: 18px 25px; /* Más padding */
  margin-bottom: 15px; /* Más margen inferior */
  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.debtor-item:hover {
  background-color: rgba(255, 82, 82, 0.15); /* Más intenso al pasar el ratón */
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.debtor-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  text-align: left; /* Alinea el texto a la izquierda */
}

.debtor-name {
  font-weight: bold;
  color: #e0e0e0;
  font-size: 1.2em; /* Más grande */
  margin-bottom: 5px;
}

.debtor-ci,
.debtor-balance {
  font-size: 1em; /* Más grande */
  color: #add8e6;
  margin-top: 5px;
}

.debtor-balance {
  font-weight: bold;
  color: #ff5252; /* Color rojo vibrante para saldos deudores */
  font-size: 1.1em; /* Más grande */
  text-shadow: 0 0 5px #ff5252;
}

/* Información del Cliente dentro del modal */
.client-info-section p {
  margin-bottom: 10px;
  font-size: 1.05em;
  color: #c0c0c0;
}

.client-info-section p strong {
  color: #e0e0e0;
}

.saldo-positivo {
  color: #00e676; /* Verde neón */
  font-weight: bold;
  text-shadow: 0 0 5px #00e676;
}

.saldo-negativo {
  color: #ff5252; /* Rojo vibrante */
  font-weight: bold;
  text-shadow: 0 0 5px #ff5252;
}

/* Historial de Movimientos dentro del modal */
.movements-history-section {
  margin-top: 40px;
}

.responsive-table {
  width: 100%;
  overflow-x: auto; /* Permite el scroll horizontal SÓLO en la tabla si es demasiado ancha */
  -webkit-overflow-scrolling: touch; /* Mejora el scroll en iOS */
  border-radius: 15px;
  border: 1px solid rgba(0, 191, 255, 0.3);
  margin-top: 25px;
  background-color: rgba(10, 10, 20, 0.8);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  overflow-y: hidden; /* Evita doble scroll si el contenido de la tabla es alto */
}

.movements-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 650px; /* Ancho mínimo para la tabla en móviles */
}

.movements-table th,
.movements-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 191, 255, 0.15);
  color: #e0e0e0;
}

.movements-table th {
  background-color: rgba(0, 191, 255, 0.1);
  color: #a7f3d0;
  font-family: "Orbitron", sans-serif;
  font-weight: 500;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.movements-table tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.1);
}

.movements-table tbody tr:hover {
  background-color: rgba(0, 191, 255, 0.08);
}

.movements-table td {
  font-size: 0.95em;
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

/* Specific styles for client details modal */
.modal-content.client-details-modal {
  max-width: 700px; /* Wider for client details */
  max-height: 90vh; /* Allows scrolling if content is very long */
  overflow-y: auto;
}

/* Specific styles for receipt modal (nested) */
.modal-overlay.nested-modal {
  z-index: 2001; /* Ensures it's above the client details modal */
}

.modal-content.receipt-modal-content {
  max-width: 500px; /* Smaller than details modal */
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

/* Media Queries for Responsiveness */
@media (max-width: 768px) {
  .page-container {
    padding: 15px;
    margin: 10px auto;
    border-radius: 15px;
    max-height: calc(100vh - 100px);
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
  .debtor-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 15px 20px;
  }
  .debtor-info {
    margin-bottom: 15px;
    width: 100%;
  }
  .debtor-name {
    font-size: 1.1em;
  }
  .debtor-ci,
  .debtor-balance {
    font-size: 0.95em;
  }
  .btn {
    width: 100%;
    margin-top: 0;
  }
  .modal-content {
    padding: 20px;
  }
  .modal-content.client-details-modal {
    max-width: 95%;
    max-height: 90vh;
  }
  .responsive-table {
    overflow-x: auto;
  }
  .movements-table {
    min-width: 450px;
  }
  .movements-table th,
  .movements-table td {
    padding: 10px 12px;
    font-size: 0.85em;
  }
  .receipt-preview {
    padding: 15px;
    font-size: 0.85em;
    max-height: 250px;
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
  .debtor-name {
    font-size: 1em;
  }
  .debtor-ci,
  .debtor-balance {
    font-size: 0.85em;
  }
  .movements-table {
    min-width: 350px;
  }
  .movements-table th,
  .movements-table td {
    padding: 8px 10px;
    font-size: 0.75em;
  }
  .receipt-preview {
    font-size: 0.8em;
  }
}
</style>
