<template>
  <div class="page-container">
    <h1 class="page-title">Cierres de Caja</h1>

    <div class="closure-filter-section card">
      <h2 class="section-title">Seleccionar Período</h2>
      <div class="input-group">
        <label for="start-date">Fecha de Inicio:</label>
        <input type="date" id="start-date" v-model="startDate" required />
      </div>
      <div class="input-group">
        <label for="end-date">Fecha de Fin:</label>
        <input type="date" id="end-date" v-model="endDate" required />
      </div>

      <div class="button-group">
        <button
          class="btn primary"
          @click="generateClosureReport"
          :disabled="!startDate || !endDate"
        >
          Generar Reporte
        </button>
        <button class="btn secondary" @click="clearDates">
          Limpiar Fechas
        </button>
      </div>
    </div>

    <div v-if="closureReport" class="closure-results-section card">
      <h2 class="section-title">Resultados del Cierre</h2>
      <p>
        <strong>Período:</strong> {{ formatDate(closureReport.startDate) }} -
        {{ formatDate(closureReport.endDate) }}
      </p>
      <p>
        <strong>Saldo Inicial:</strong>
        {{ formatCurrency(closureReport.initialBalance) }}
      </p>
      <p>
        <strong>Total Entradas (Pagos):</strong>
        {{ formatCurrency(closureReport.totalPayments) }}
      </p>
      <p>
        <strong>Total Ventas:</strong>
        {{ formatCurrency(closureReport.totalSales) }}
      </p>
      <p>
        <strong>Saldo Final:s</strong>
        {{ formatCurrency(closureReport.finalBalance) }}
      </p>

      <div class="button-group">
        <button class="btn primary" @click="exportToPdf">Exportar a PDF</button>
      </div>
    </div>
    <p v-else class="no-data-message">
      Selecciona un rango de fechas para generar el reporte de cierre.
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
// import db from '@/utils/db'; // IndexedDB - Eliminado, no se usa directamente
import { formatCurrency } from "@/utils/helpers"; // Funciones de ayuda
import jsPDF from "jspdf"; // Importa jsPDF

const store = useStore();

const startDate = ref("");
const endDate = ref("");
const closureReport = ref(null);

const allMovements = computed(() => store.getters["sales/getMovements"]);
// allClients no se usa directamente en este componente, solo se asegura que se cargue en el store.
// const allClients = computed(() => store.getters['clients/getClients']);

const formatDate = (dateString) => {
  if (!dateString) return "";
  // Si dateString ya es un número (timestamp), creamos la fecha directamente.
  // Si es una cadena, asumimos que es un formato ISO de fecha.
  const date =
    typeof dateString === "number"
      ? new Date(dateString)
      : new Date(dateString);
  return date.toLocaleDateString("es-BO");
};

const generateClosureReport = async () => {
  if (!startDate.value || !endDate.value) {
    alert("Por favor, selecciona una fecha de inicio y una fecha de fin.");
    return;
  }

  const start = new Date(startDate.value);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate.value);
  end.setHours(23, 59, 59, 999);

  if (start.getTime() > end.getTime()) {
    alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
    return;
  }

  // Cargar todos los movimientos y clientes para el cálculo
  await store.dispatch("sales/fetchMovements");
  await store.dispatch("clients/fetchClients"); // Asegurarse de que los clientes estén cargados en el store

  let totalSales = 0;
  let totalPayments = 0;

  const movementsInPeriod = allMovements.value.filter((mov) => {
    const movDate = new Date(mov.fecha);
    return (
      movDate.getTime() >= start.getTime() && movDate.getTime() <= end.getTime()
    );
  });

  movementsInPeriod.forEach((mov) => {
    if (mov.type === "venta") {
      totalSales += mov.monto;
    } else if (mov.type === "pago") {
      totalPayments += mov.monto;
    }
  });

  const initialBalance = 0;
  const finalBalance = initialBalance + totalPayments - totalSales;

  closureReport.value = {
    startDate: start.getTime(),
    endDate: end.getTime(),
    initialBalance: initialBalance,
    totalPayments: totalPayments,
    totalSales: totalSales,
    finalBalance: finalBalance,
  };
};

const clearDates = () => {
  startDate.value = "";
  endDate.value = "";
  closureReport.value = null;
};

const exportToPdf = () => {
  if (!closureReport.value) {
    alert("No hay reporte de cierre para exportar.");
    return;
  }

  const doc = new jsPDF();
  const report = closureReport.value;

  doc.setFont("helvetica");
  doc.setFontSize(18);
  doc.setTextColor("#00BFFF");
  doc.text("Reporte de Cierre de Caja ALESFUN", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor("#e0e0e0");
  doc.text(
    `Período: ${formatDate(report.startDate)} - ${formatDate(report.endDate)}`,
    10,
    40,
  );
  doc.text(
    `Fecha de Generación: ${new Date().toLocaleDateString("es-BO")}`,
    10,
    47,
  );

  doc.setDrawColor("#00BFFF");
  doc.line(10, 50, 200, 50);

  let y = 60;
  const addLine = (label, value, color = "#e0e0e0", isBold = false) => {
    doc.setFontSize(12);
    doc.setTextColor(color);
    if (isBold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");
    doc.text(`${label}:`, 10, y);
    doc.text(value, 100, y);
    y += 10;
  };

  addLine("Saldo Inicial", formatCurrency(report.initialBalance));
  addLine("Total Entradas (Pagos)", formatCurrency(report.totalPayments));
  addLine("Total Ventas", formatCurrency(report.totalSales));
  doc.setDrawColor("#00BFFF");
  doc.line(10, y - 5, 200, y - 5);
  addLine("Saldo Final", formatCurrency(report.finalBalance), "#00BFFF", true);

  doc.save(
    `Cierre_Caja_ALESFUN_${formatDate(report.startDate).replace(
      /\//g,
      "-",
    )}_${formatDate(report.endDate).replace(/\//g, "-")}.pdf`,
  );
  alert("Reporte PDF generado exitosamente.");
};
</script>

<style scoped>
/* Estilos generales de la página (similar a ClientsPage.vue) */
.page-container {
  padding: 20px;
  max-width: 800px;
  margin: 20px auto;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 191, 255, 0.3);
}

.page-title {
  font-family: "Orbitron", sans-serif;
  color: #00bfff;
  font-size: 2.5em;
  text-align: center;
  margin-bottom: 30px;
  text-shadow:
    0 0 10px #00bfff,
    0 0 20px rgba(0, 191, 255, 0.5);
}

.card {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 191, 255, 0.2);
}

.section-title {
  font-family: "Orbitron", sans-serif;
  color: #87ceeb;
  font-size: 1.5em;
  margin-bottom: 20px;
  text-align: center;
}

.card p {
  font-size: 0.95em;
  line-height: 1.5;
  margin-bottom: 15px;
  text-align: justify;
  color: #b0bec5;
}

.input-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #add8e6;
  font-size: 0.95em;
}

input[type="date"],
input[type="number"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #4682b4;
  border-radius: 5px;
  background-color: #1a2a3a;
  color: #e0e0e0;
  font-size: 1em;
  box-sizing: border-box;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

input[type="date"]:focus,
input[type="number"]:focus {
  border-color: #00bfff;
  box-shadow: 0 0 8px rgba(0, 191, 255, 0.5);
  outline: none;
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

.closure-results-section p {
  font-size: 1.1em;
  margin-bottom: 10px;
  color: #e0e0e0;
}

.closure-results-section strong {
  color: #87ceeb;
}

.no-data-message {
  text-align: center;
  margin-top: 30px;
  font-size: 1.1em;
  color: #b0bec5;
}

/* Media Queries */
@media (max-width: 600px) {
  .page-container {
    padding: 15px;
    margin: 10px auto;
  }
  .page-title {
    font-size: 2em;
    margin-bottom: 20px;
  }
  .section-title {
    font-size: 1.3em;
    margin-bottom: 15px;
  }
  .btn {
    width: 100%;
    margin-bottom: 10px;
  }
  .button-group {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
