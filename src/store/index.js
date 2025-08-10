// src/store/index.js
import { createStore } from "vuex";
import clientsModule from "./modules/clients";
import productsModule from "./modules/products"; // Importa el módulo de productos
import salesModule from "./modules/sales"; // Importa el módulo de ventas/movimientos

export default createStore({
  state: {
    // Estado global de la aplicación
    isOnline: navigator.onLine,
    syncStatus: "idle", // 'idle', 'syncing', 'error'
    syncProgress: 0, // 0-100%
    showSyncAnimation: false, // Controla la visibilidad de la animación Matrix
  },
  getters: {
    getIsOnline: (state) => state.isOnline,
    getSyncStatus: (state) => state.syncStatus,
    getSyncProgress: (state) => state.syncProgress,
    getShowSyncAnimation: (state) => state.showSyncAnimation,
  },
  mutations: {
    SET_ONLINE_STATUS(state, status) {
      state.isOnline = status;
    },
    SET_SYNC_STATUS(state, status) {
      state.syncStatus = status;
    },
    SET_SYNC_PROGRESS(state, progress) {
      state.syncProgress = progress;
    },
    SET_SHOW_SYNC_ANIMATION(state, status) {
      state.showSyncAnimation = status;
    },
  },
  actions: {
    // Acciones globales (ej. para actualizar el estado de la red)
    updateOnlineStatus({ commit }) {
      commit("SET_ONLINE_STATUS", navigator.onLine);
    },
    // Acción para iniciar la animación de sincronización
    startSyncAnimation({ commit }) {
      commit("SET_SHOW_SYNC_ANIMATION", true);
      // Puedes añadir un temporizador para ocultarla automáticamente si no hay progreso
      // o dejar que syncService la oculte al finalizar.
    },
    // Acción para detener la animación de sincronización
    stopSyncAnimation({ commit }) {
      commit("SET_SHOW_SYNC_ANIMATION", false);
    },
  },
  modules: {
    clients: clientsModule, // Registra el módulo de clientes
    products: productsModule, // Registra el módulo de productos
    sales: salesModule, // Registra el módulo de ventas/movimientos
  },
});
