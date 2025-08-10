<template>
  <div class="page-container">
    <h1 class="page-title">Estado de Sincronización</h1>

    <div class="sync-status-section card">
      <h2 class="section-title">Detalles de Sincronización</h2>
      <p>
        <strong>Estado de Conexión:</strong>
        <span
          :class="{ 'status-online': isOnline, 'status-offline': !isOnline }"
        >
          {{ isOnline ? "Online" : "Offline" }}
        </span>
      </p>
      <p>
        <strong>Estado de Sincronización:</strong>
        <span
          :class="{
            'status-syncing': syncStatus === 'syncing',
            'status-idle': syncStatus === 'idle',
            'status-error': syncStatus === 'error',
          }"
        >
          {{ syncStatusText }}
        </span>
      </p>
      <p v-if="syncStatus === 'syncing'">
        <strong>Progreso:</strong> {{ syncProgress }}%
      </p>

      <div class="button-group">
        <button
          class="btn primary"
          @click="forceSync"
          :disabled="syncStatus === 'syncing' || !isOnline"
        >
          Forzar Sincronización
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import { forceSync } from "@/utils/syncService"; // Importa la función para forzar sincronización

const store = useStore();

const isOnline = computed(() => store.getters.getIsOnline);
const syncStatus = computed(() => store.getters.getSyncStatus);
const syncProgress = computed(() => store.getters.getSyncProgress);

const syncStatusText = computed(() => {
  switch (syncStatus.value) {
    case "idle":
      return "Inactivo";
    case "syncing":
      return "Sincronizando...";
    case "error":
      return "Error de Sincronización";
    default:
      return "Desconocido";
  }
});
</script>

<style scoped>
/* Estilos generales de la página */
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

.sync-status-section p {
  font-size: 1.1em;
  margin-bottom: 10px;
  color: #e0e0e0;
}

.sync-status-section strong {
  color: #add8e6;
}

.status-online {
  color: #00bfff; /* Celeste para online */
  font-weight: bold;
}
.status-offline {
  color: #ff6347; /* Rojo para offline */
  font-weight: bold;
}
.status-syncing {
  color: #ffd700; /* Dorado para sincronizando */
  font-weight: bold;
}
.status-idle {
  color: #00bfff; /* Celeste para inactivo */
  font-weight: bold;
}
.status-error {
  color: #ff6347; /* Rojo para error */
  font-weight: bold;
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
