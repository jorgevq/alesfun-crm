import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
// No es necesario importar 'store' si no se usa directamente en este archivo.

// Importa tus componentes de vista (NOMBRES DE ARCHIVO CORREGIDOS)
import AuthPage from "../views/AuthPage.vue";
import AppLayout from "../components/AppLayout.vue";
import HomePage from "../views/HomePage.vue";
import SalesPage from "../views/SalesPage.vue";
import RecibosPage from "../views/RecibosPage.vue"; // <-- CORREGIDO: Coincide con tu archivo
import InventoryPage from "../views/InventoryPage.vue";
import ClientsPage from "../views/ClientsPage.vue";
import ClosuresPage from "../views/ClosuresPage.vue";
import DeudoresPage from "../views/DeudoresPage.vue"; // <-- CORREGIDO: Coincide con tu archivo
import DataManagementPage from "../views/DataManagementPage.vue";
import SyncPage from "../views/SyncPage.vue";

const routes = [
  {
    path: "/",
    name: "Auth",
    component: AuthPage,
    meta: { requiresAuth: false },
  },
  {
    path: "/app",
    name: "AppLayout",
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "home",
        name: "Home",
        component: HomePage,
        meta: { requiresAuth: true },
      },
      {
        path: "sales",
        name: "Sales",
        component: SalesPage,
        meta: { requiresAuth: true },
      },
      {
        path: "receipts", // El nombre de la ruta sigue siendo 'receipts'
        name: "Receipts",
        component: RecibosPage, // <-- Usamos el componente con el nombre de tu archivo
        meta: { requiresAuth: true },
      },
      {
        path: "inventory",
        name: "Inventory",
        component: InventoryPage,
        meta: { requiresAuth: true },
      },
      {
        path: "clients",
        name: "Clients",
        component: ClientsPage,
        meta: { requiresAuth: true },
      },
      {
        path: "closures",
        name: "Closures",
        component: ClosuresPage,
        meta: { requiresAuth: true },
      },
      {
        path: "debtors", // El nombre de la ruta sigue siendo 'debtors'
        name: "Debtors",
        component: DeudoresPage, // <-- Usamos el componente con el nombre de tu archivo
        meta: { requiresAuth: true },
      },
      {
        path: "data-management",
        name: "DataManagement",
        component: DataManagementPage,
        meta: { requiresAuth: true },
      },
      {
        path: "sync",
        name: "Sync",
        component: SyncPage,
        meta: { requiresAuth: true },
      },
    ],
  },
  // Redirección para cualquier otra ruta no definida a la autenticación
  {
    path: "/:catchAll(.*)",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guardia de navegación para la autenticación
const auth = getAuth();

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isAuthenticated = await new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(!!user);
    });
  });

  if (requiresAuth && !isAuthenticated) {
    next({ name: "Auth" });
  } else if (!requiresAuth && isAuthenticated && to.name === "Auth") {
    next({ name: "Home" });
  } else {
    next();
  }
});

export default router;
