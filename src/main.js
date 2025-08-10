// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // Importa el enrutador
import store from "./store"; // Importa el store de Vuex

import "./styles/global.css"; // Importa los estilos globales

// Este archivo es generado por Vue CLI para el soporte PWA (Service Worker)
import "./registerServiceWorker";

const app = createApp(App);

// Asegúrate de usar el router y el store ANTES de montar la aplicación
app.use(router); // Usa el enrutador en la aplicación
app.use(store); // Usa el store de Vuex en la aplicación

app.mount("#app"); // Monta la aplicación en el elemento HTML con id="app"
