<template>
  <div class="page-container">
    <h1 class="page-title">
      ALESFUN ¡Siempre imparable, más allá de los límites!
    </h1>
    <p class="intro-text">
      "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes,
      porque Jehová tu Dios estará contigo dondequiera que vayas."
    </p>

    <div v-if="loading" class="loading-message card">Cargando datos...</div>
    <div v-else-if="error" class="error-message card">
      Error al cargar datos: {{ error.message }}
    </div>
    <div v-else>
      <!-- Sección de Resumen de Actividad Diaria -->
      <div class="summary-section card">
        <h2 class="section-title">Actividad de Hoy</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="summary-item">
            <span class="item-label">Ventas del Día:</span>
            <span class="item-value">{{ formatCurrency(dailySales) }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Pagos a Cuenta del Día:</span>
            <span class="item-value">{{ formatCurrency(dailyPayments) }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Total Recaudado Hoy:</span>
            <span class="item-value">{{ formatCurrency(dailyRevenue) }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Nuevos Clientes Hoy:</span>
            <span class="item-value">{{ newClientsToday }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Transacciones Hoy:</span>
            <span class="item-value">{{ dailyTransactions }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Stock Bajo:</span>
            <span class="item-value">{{ lowStockProductsCount }}</span>
          </div>
        </div>
      </div>

      <!-- Sección de Resumen General -->
      <div class="general-summary-section card">
        <h2 class="section-title">Resumen General</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="summary-item">
            <span class="item-label">Total Clientes:</span>
            <span class="item-value">{{ totalClients }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Clientes Deudores:</span>
            <span class="item-value">{{ totalDebtors }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Cuentas por Cobrar:</span>
            <span class="item-value">{{
              formatCurrency(totalAccountsReceivable)
            }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">Total Productos:</span>
            <span class="item-value">{{ totalProducts }}</span>
          </div>
        </div>
      </div>

      <div class="button-group mt-8">
        <button @click="refreshData" class="btn primary">
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
            class="feather feather-refresh-cw"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path
              d="M3.5 22c-.6-.6-1-1.4-1-2.3 0-2.2 1.8-4 4-4h14a4 4 0 0 0 0-8H6.5c-.9 0-1.7.4-2.3 1"
            ></path>
          </svg>
          Actualizar Datos
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { formatCurrency } from "@/utils/helpers";

const store = useStore();

// Estados de carga y error
const loading = ref(true);
const error = ref(null);

// --- Computed Properties (Datos del Store) ---
const allClients = computed(() => store.getters["clients/getClients"]);
const allProducts = computed(() => store.getters["products/getProducts"]);
const allMovements = computed(() => store.getters["sales/getMovements"]);

// --- Resumen de Actividad Diaria ---
const today = computed(() => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
});

const dailyMovements = computed(() => {
  return allMovements.value.filter((mov) => {
    const movDate = new Date(mov.fecha);
    movDate.setHours(0, 0, 0, 0);
    return movDate.getTime() >= today.value;
  });
});

const dailySales = computed(() => {
  return dailyMovements.value
    .filter((mov) => mov.type === "venta")
    .reduce((sum, mov) => sum + mov.monto, 0);
});

const dailyPayments = computed(() => {
  return dailyMovements.value
    .filter((mov) => mov.type === "pago")
    .reduce((sum, mov) => sum + mov.monto, 0);
});

const dailyRevenue = computed(() => {
  return dailyMovements.value
    .filter((mov) => mov.type === "pago" || mov.type === "venta") // Podrías tener otros tipos de ingresos, ajústalos según tu lógica de negocio
    .reduce((sum, mov) => sum + mov.monto, 0);
});

const newClientsToday = computed(() => {
  return allClients.value.filter((client) => {
    const clientRegDate = new Date(client.fechaRegistro);
    clientRegDate.setHours(0, 0, 0, 0);
    return clientRegDate.getTime() >= today.value;
  }).length;
});

const dailyTransactions = computed(() => dailyMovements.value.length);

const lowStockProductsCount = computed(() => {
  return allProducts.value.filter(
    (product) => product.stock < 10 && product.stock > 0,
  ).length;
});

// --- Resumen General ---
const totalClients = computed(() => allClients.value.length);
const totalProducts = computed(() => allProducts.value.length);
const totalDebtors = computed(
  () => allClients.value.filter((client) => client.saldoActual > 0).length,
);
const totalAccountsReceivable = computed(() => {
  return allClients.value.reduce((sum, client) => sum + client.saldoActual, 0);
});

// --- Métodos ---
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    await store.dispatch("clients/fetchClients");
    await store.dispatch("products/fetchProducts");
    await store.dispatch("sales/fetchMovements");
  } catch (err) {
    console.error("Error fetching data for HomePage:", err);
    error.value = err;
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  fetchData();
};

// --- Ciclo de Vida ---
onMounted(() => {
  fetchData();
});
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
  color: #e0e0e0;
}

.page-title {
  font-family: "Orbitron", sans-serif;
  color: #00bfff; /* Azul neón */
  font-size: 2.8em; /* Más grande */
  text-align: center;
  margin-bottom: 20px;
  text-shadow:
    0 0 15px #00bfff,
    0 0 25px rgba(0, 191, 255, 0.6); /* Glow más intenso */
  letter-spacing: 1.5px;
}

.intro-text {
  text-align: center;
  margin-bottom: 40px;
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

.summary-item {
  background-color: rgba(0, 191, 255, 0.1); /* Fondo azul claro translúcido */
  border: 1px solid rgba(0, 191, 255, 0.4);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: background-color 0.2s ease;
}

.summary-item:hover {
  background-color: rgba(0, 191, 255, 0.2);
}

.item-label {
  display: block;
  font-size: 0.95em;
  color: #add8e6;
  margin-bottom: 8px;
  font-weight: 500;
}

.item-value {
  font-family: "Orbitron", sans-serif;
  font-size: 1.8em; /* Más grande para los valores */
  color: #a7f3d0; /* Verde lima brillante */
  font-weight: bold;
  text-shadow: 0 0 8px #a7f3d0; /* Glow para los valores */
}

.loading-message,
.error-message {
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

/* Media Queries para responsividad */
@media (max-width: 768px) {
  .page-container {
    padding: 15px;
    margin: 10px auto;
    border-radius: 15px;
    max-height: calc(100vh - 100px);
  }
  .page-title {
    font-size: 2.2em;
    margin-bottom: 20px;
  }
  .intro-text {
    font-size: 1em;
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
  .summary-item {
    padding: 15px;
  }
  .item-label {
    font-size: 0.9em;
  }
  .item-value {
    font-size: 1.5em;
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
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8em;
    margin-bottom: 15px;
  }
  .intro-text {
    font-size: 0.9em;
    margin-bottom: 20px;
  }
  .card {
    padding: 15px;
    margin-bottom: 15px;
  }
  .section-title {
    font-size: 1.3em;
    margin-bottom: 15px;
  }
  .summary-item {
    padding: 12px;
  }
  .item-label {
    font-size: 0.8em;
  }
  .item-value {
    font-size: 1.3em;
  }
}
</style>
