<template>
  <div id="app">
    <!-- Usamos el componente RouterView importado directamente -->
    <RouterView />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { RouterView } from "vue-router"; // Importar RouterView explícitamente

onMounted(async () => {
  console.log("App.vue mounted. Initializing data if needed.");
});
</script>

<style>
/* Tus estilos globales o específicos para #app */
</style>
