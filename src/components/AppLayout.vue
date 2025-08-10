<template>
  <!-- Contenedor principal con fondo negro -->
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Barra de navegación superior con tema Windows 11 Neo -->
    <header
      class="text-white py-3 px-4 shadow-2xl grid grid-cols-[auto_1fr_auto] items-center gap-4 relative z-[10000] border-b-2 border-lime-600 backdrop-blur-sm"
      style="
        background-color: rgba(
          255,
          255,
          255,
          0.08
        ); /* Fondo translúcido suave */
        backdrop-filter: blur(12px); /* Efecto de desenfoque Mica */
        -webkit-backdrop-filter: blur(12px); /* Para compatibilidad */
        /* Estilos Neo para la cabecera */
        box-shadow:
          0 4px 25px rgba(0, 191, 255, 0.4),
          0 0 40px rgba(0, 191, 255, 0.2); /* Sombra de neón cian más intensa */
        border-bottom: 3px solid #00bfff; /* Borde inferior cian más grueso */
      "
    >
      <!-- Columna 1: Botón de menú (ahora un icono de cuadrícula) -->
      <div class="col-start-1 flex items-center">
        <button
          ref="hamburgerButton"
          @click.stop.prevent="handleToggleSidebar"
          class="text-cyan-400 focus:outline-none p-2 rounded-md hover:bg-lime-600 hover:bg-opacity-30 transition duration-300 ease-in-out group"
          aria-label="Toggle navigation"
        >
          <!-- Nuevo Icono de Menú (Cuadrícula/Grid) - Tamaño Aumentado y Color Celeste -->
          <svg
            class="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
          </svg>
        </button>
      </div>

      <!-- Columna 2: Título y Subtítulo centrados con frases ajustadas y estilo suave -->
      <div
        class="col-start-2 flex flex-col items-center justify-center text-center"
      >
        <h1
          class="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-wider text-lime-300 whitespace-nowrap overflow-hidden text-ellipsis"
          style="
            text-shadow:
              0 0 10px #00ffff,
              0 0 20px rgba(0, 255, 255, 0.6); /* Glow más intenso */
          "
        >
          ALESFUN
        </h1>
        <p
          class="text-base sm:text-lg lg:text-xl text-gray-400 font-medium mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis"
          style="text-shadow: 0 0 5px #add8e6"
        >
          Aleaciones Especiales en Fundición
        </p>
      </div>

      <!-- Columna 3: Información del usuario e icono de Sincronización -->
      <div
        class="col-start-3 flex items-center space-x-2 sm:space-x-4 justify-end"
      >
        <span
          class="text-sm sm:text-base font-semibold hidden md:block text-gray-300 whitespace-nowrap"
          >Hola, {{ userEmail }}</span
        >
        <!-- Icono de Sincronización - Tamaño Aumentado y Color Celeste -->
        <div class="relative group">
          <svg
            class="w-8 h-8 text-cyan-400 transition-colors duration-300"
            :class="{
              'text-blue-400 animate-spin': showSyncAnimation,
              'text-gray-500': !showSyncAnimation,
            }"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M21 21v-5h-5" />
          </svg>
          <span
            class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
          >
            <span v-if="showSyncAnimation">Sincronizando...</span>
            <span v-else>Sincronizado</span>
          </span>
        </div>
      </div>
    </header>

    <!-- Contenido principal y barra lateral -->
    <div class="flex flex-1">
      <!-- Barra lateral (Sidebar) con Vue Transition -->
      <Transition name="sidebar-slide">
        <aside
          v-if="isSidebarOpen"
          ref="sidebarRef"
          class="fixed inset-y-0 left-0 w-full sm:w-3/4 md:w-[280px] md:flex-none text-white z-[9999] shadow-xl overflow-y-auto"
        >
          <nav class="mt-4">
            <ul class="list-none p-0">
              <li class="mb-2">
                <router-link
                  to="/app/home"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-200 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Inicio (Home) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Inicio
                </router-link>
              </li>
              <li class="mb-2">
                <router-link
                  to="/app/sales"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-200 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Ventas (Shopping Cart) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path
                      d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
                    />
                  </svg>
                  Ventas
                </router-link>
              </li>
              <li class="mb-2">
                <router-link
                  to="/app/receipts"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-200 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Recibos (File Text) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <path
                      d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
                    />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="M10 9H8" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                  </svg>
                  Recibos
                </router-link>
              </li>
              <li class="mb-2">
                <router-link
                  to="/app/inventory"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-200 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Inventario (Package) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <path d="m7.5 4.27 9 5.15" />
                    <path d="M12 22V4.27" />
                    <path
                      d="M20.93 11.12 12 16.5l-8.93-5.38L12 2 20.93 11.12Z"
                    />
                    <path
                      d="M2.27 14.83v5.13a2 2 0 0 0 2 2h15.46a2 2 0 0 0 2-2v-5.13"
                    />
                    <polyline points="3.5 12.5 12 17.5 20.5 12.5" />
                  </svg>
                  Inventario
                </router-link>
              </li>
              <li class="mb-2">
                <router-link
                  to="/app/clients"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-200 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Clientes (Users) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Clientes
                </router-link>
              </li>
              <li class="mb-2">
                <router-link
                  to="/app/closures"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-200 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Cierres (Lock) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Cierres
                </router-link>
              </li>
              <li class="mb-2">
                <router-link
                  to="/app/debtors"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-200 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Deudores (Wallet) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <path
                      d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h12a2 2 0 0 1 0 4H5a2 2 0 0 0 0 4h12a2 2 0 0 1 0 4h-3"
                    />
                    <path d="M2 20v-2.5a2.5 2.5 0 0 1 5 0V20" />
                    <path d="M12 10h.01" />
                  </svg>
                  Deudores
                </router-link>
              </li>
              <li class="mb-2">
                <router-link
                  to="/app/data-management"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-200 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Gestión de Datos (Database) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 12A9 3 0 0 0 21 12" />
                    <path d="M3 19A9 3 0 0 0 21 19" />
                    <path d="M12 5V2" />
                    <path d="M12 12V8" />
                    <path d="M12 19V15" />
                  </svg>
                  Gestión de Datos
                </router-link>
              </li>
              <li class="mb-2">
                <router-link
                  to="/app/sync"
                  @click="closeSidebar"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide hover:bg-zinc-800 hover:bg-opacity-50 transition duration-300 ease-in-out rounded-md no-underline"
                  active-class="bg-lime-700 bg-opacity-75 text-white rounded-md shadow-inner border-l-4 border-lime-400 pl-[calc(1rem-4px)]"
                >
                  <!-- Icono de Sincronización (Refresh CW) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <path
                      d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                    />
                    <path d="M3 3v5h5" />
                    <path
                      d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                    />
                    <path d="M21 21v-5h-5" />
                  </svg>
                  Sincronización
                </router-link>
              </li>
              <!-- Enlace para Cerrar Sesión en el menú lateral -->
              <li class="mt-8">
                <a
                  href="#"
                  @click.prevent="logout"
                  class="flex items-center py-2 px-4 font-semibold uppercase tracking-wide text-red-400 hover:bg-red-800 hover:bg-opacity-50 hover:text-white transition duration-200 ease-in-out rounded-md no-underline"
                >
                  <!-- Icono de Salir (Log Out) -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="mr-3 flex-shrink-0 inline-block"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="17 16 22 12 17 8" />
                    <line x1="22" x2="10" y1="12" y2="12" />
                  </svg>
                  Cerrar Sesión
                </a>
              </li>
            </ul>
          </nav>
        </aside>
      </Transition>

      <!-- Overlay para cerrar sidebar en móvil -->
      <div
        v-if="isSidebarOpen && !isDesktop"
        @click.stop="closeSidebar"
        class="fixed inset-0 bg-black opacity-50 z-[9998]"
      ></div>

      <!-- Contenido de la página -->
      <main
        class="flex-1 p-6 bg-black text-gray-200 overflow-auto transition-all duration-300 ease-in-out"
        :class="{ 'md:ml-[280px]': isSidebarOpen && isDesktop }"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";

const store = useStore();
const router = useRouter();
const route = useRoute();

const isSidebarOpen = ref(false);
const userEmail = ref("");
const isToggling = ref(false); // Flag para controlar el estado de alternancia
const isDesktop = ref(window.innerWidth >= 768); // Estado para detectar si es desktop

const sidebarRef = ref(null); // Referencia al elemento <aside>
const hamburgerButton = ref(null); // Referencia al botón de menú

// showSyncAnimation se mantiene para el icono en la cabecera.
const showSyncAnimation = computed(() => {
  const isSyncing = store.getters.getShowSyncAnimation;
  console.log("[AppLayout] showSyncAnimation computed value:", isSyncing); // Añadido para depuración
  return isSyncing;
});
// syncProgress ya no es necesario aquí.
// const syncProgress = computed(() => store.getters.getSyncProgress); // ELIMINADO

// Función para manejar el cambio de tamaño de la ventana
const handleResize = () => {
  const newIsDesktop = window.innerWidth >= 768;
  if (newIsDesktop !== isDesktop.value) {
    // Solo actualizar si realmente ha cambiado
    isDesktop.value = newIsDesktop;
    console.log(
      "[Sidebar] isDesktop actualizado a:",
      isDesktop.value,
      "Ancho de ventana:",
      window.innerWidth,
    );

    // En desktop, la sidebar siempre debe estar abierta
    // En móvil, la sidebar se cierra
    if (isDesktop.value) {
      isSidebarOpen.value = true;
      console.log(
        "[Sidebar] Usuario autenticado, en desktop, sidebar abierta por defecto.",
      );
    } else {
      isSidebarOpen.value = false;
      console.log("[Sidebar] En móvil, sidebar forzada a cerrarse.");
    }
  }
};

// Función para manejar el clic en el botón de menú
const handleToggleSidebar = () => {
  if (isToggling.value) {
    console.log("[Sidebar] Ignorando clic: Ya en proceso de alternancia.");
    return;
  }

  isToggling.value = true;
  isSidebarOpen.value = !isSidebarOpen.value;
  console.log(
    "[Sidebar] handleToggleSidebar llamado. isSidebarOpen:",
    isSidebarOpen.value,
  );

  // Restablecer el flag después de un breve retraso para permitir que la UI se actualice
  setTimeout(() => {
    isToggling.value = false;
    console.log("[Sidebar] isToggling restablecido a false.");
  }, 450); // Mantiene el retraso a 450ms para la alternancia
};

// Función para cerrar la barra lateral
const closeSidebar = () => {
  // Solo cerrar si está abierto y NO estamos en medio de una alternancia
  // Y solo cerrar en móvil (en desktop, la sidebar siempre está abierta por diseño)
  if (isSidebarOpen.value && !isToggling.value && !isDesktop.value) {
    isSidebarOpen.value = false;
    console.log(
      "[Sidebar] closeSidebar llamado. isSidebarOpen:",
      isSidebarOpen.value,
    );
  } else if (isToggling.value) {
    console.log("[Sidebar] Ignorando closeSidebar: isToggling es true.");
  } else if (isDesktop.value) {
    console.log("[Sidebar] Ignorando closeSidebar: Estamos en desktop.");
  }
};

// Manejador de clic global para cerrar el sidebar al hacer clic fuera
const handleClickOutside = (event) => {
  // Si el sidebar no está abierto o estamos en desktop, no hacer nada
  if (!isSidebarOpen.value || isDesktop.value) {
    return;
  }

  // Verificar si el clic fue dentro del sidebar o del botón de menú
  const clickedInsideSidebar =
    sidebarRef.value && sidebarRef.value.contains(event.target);
  const clickedOnHamburger =
    hamburgerButton.value && hamburgerButton.value.contains(event.target);

  // Si el clic no fue dentro del sidebar y no fue en el botón de menú, cerrar el sidebar
  if (!clickedInsideSidebar && !clickedOnHamburger) {
    console.log("[Sidebar] Clic fuera del sidebar o botón, cerrando sidebar.");
    isSidebarOpen.value = false;
  }
};

// Manejadores para el estado de conexión online/offline (se mantienen los listeners por si se necesitan)
const updateOnlineStatus = () => {
  console.log(
    "[Network] Estado de conexión:",
    navigator.onLine ? "Online" : "Offline",
  );
};

// Observar cambios en la ruta para cerrar la barra lateral automáticamente
watch(route, (newRoute, oldRoute) => {
  if (
    isSidebarOpen.value &&
    newRoute.path !== oldRoute.path &&
    !isDesktop.value
  ) {
    isSidebarOpen.value = false;
    console.log(
      "[Sidebar] Sidebar cerrada automáticamente debido a cambio de ruta (móvil).",
    );
  }
});

// Observar cambios en el estado de autenticación de Firebase
onMounted(() => {
  // Inicializa el estado de desktop y añade el listener de resize
  handleResize(); // Llama una vez al montar para establecer el estado inicial
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleClickOutside); // Añadir listener global al montar

  // Añadir listeners para el estado de conexión
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userEmail.value = user.email;
      // Si es desktop, asegúrate de que la sidebar esté abierta al iniciar sesión
      if (isDesktop.value) {
        isSidebarOpen.value = true;
        console.log(
          "[Sidebar] Usuario autenticado, en desktop, sidebar abierta por defecto.",
        );
      }
    } else {
      userEmail.value = "";
      router.push({ name: "Auth" }); // Redirigir a la página de autenticación si no hay usuario
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleClickOutside); // Limpiar listener global al desmontar
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
});

// Función para cerrar sesión
const logout = async () => {
  try {
    await signOut(auth);
    console.log("Sesión cerrada.");
    // La redirección es manejada por el guardia de navegación en router/index.js
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    console.log(
      "Hubo un error al cerrar sesión. Por favor, inténtalo de nuevo.",
    );
  }
};
</script>

<style scoped>
/* Estilos para la transición de la barra lateral */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.3s ease-out;
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(-100%);
}

.sidebar-slide-enter-to,
.sidebar-slide-leave-from {
  transform: translateX(0);
}

/* REGLA CSS DIRECTA PARA EL ASIDE CON FONDO GRIS TRANSLÚCIDO TIPO WINDOWS 11 */
aside {
  background-color: rgba(
    45,
    45,
    45,
    0.85
  ) !important; /* Gris oscuro con 85% de opacidad */
  backdrop-filter: blur(
    8px
  ); /* Efecto de desenfoque para simular el "Mica" de Windows 11 */
  -webkit-backdrop-filter: blur(
    8px
  ); /* Para compatibilidad con navegadores WebKit */
}

/* Estilos para la transición del overlay de sincronización */
/* Estas reglas ya no son necesarias si el overlay se elimina, pero las dejo comentadas */
/*
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
*/

/* Ajustes para los elementos de la lista de navegación */
aside nav ul li {
  font-size: 1.2rem; /* Aumenta el tamaño de la fuente */
  line-height: 2; /* Aumenta el interlineado para mayor espacio */
  margin-bottom: 0.75rem; /* Mayor margen inferior para separar los elementos */
  /* font-weight: normal; */ /* Asegura que no haya negrita forzada desde aquí */
}

/* Asegura que el color de los enlaces sea blanco por defecto para un contraste óptimo y sin subrayado */
aside nav ul li a {
  color: white;
  text-decoration: none; /* Elimina el subrayado de los enlaces del menú */
}

/* Ajuste del tamaño de los iconos dentro de los enlaces del menú */
aside nav ul li a svg {
  width: 30px; /* Aumenta el tamaño del icono a 30px */
  height: 30px; /* Aumenta el tamaño del icono a 30px */
}

/* En pantallas grandes (desktop), la barra lateral siempre debe estar visible por defecto y no empujar el contenido */
@media (min-width: 768px) {
  aside {
    transform: translateX(
      0
    ); /* Eliminado !important para permitir la transición */
    /* Ancho fijo en desktop para que el main pueda tener un margin-left - definido con md:w-[280px] en el template */
  }
  /* El margin-left para 'main' ahora se aplica condicionalmente en el template con :class */
}
/* Animación de giro para el icono de sincronización (se mantiene el estilo por si se usa en otro lugar) */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
