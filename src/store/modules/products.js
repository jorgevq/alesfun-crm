// src/store/modules/products.js
import db from "@/utils/db"; // Importa la instancia de Dexie
import { auth, db as firestoreDb } from "@/firebase/config"; // Importa Firebase auth y db
import { collection, getDocs, query } from "firebase/firestore";

const productsModule = {
  namespaced: true,
  state: () => ({
    allProducts: [],
    loading: false,
    error: null,
  }),
  mutations: {
    SET_PRODUCTS(state, products) {
      state.allProducts = products;
    },
    ADD_PRODUCT(state, product) {
      state.allProducts.push(product);
    },
    UPDATE_PRODUCT(state, updatedProduct) {
      const index = state.allProducts.findIndex(
        (p) => p.firestoreId === updatedProduct.firestoreId,
      );
      if (index !== -1) {
        state.allProducts.splice(index, 1, updatedProduct);
      }
    },
    // MUTACIÓN CLAVE: Para actualizar el stock de un producto directamente en el estado de Vuex
    UPDATE_PRODUCT_STOCK(state, { firestoreId, newStock }) {
      const product = state.allProducts.find(
        (p) => p.firestoreId === firestoreId,
      );
      if (product) {
        product.stock = newStock;
      }
    },
    REMOVE_PRODUCT(state, productId) {
      state.allProducts = state.allProducts.filter(
        (product) => product.firestoreId !== productId,
      );
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },
  actions: {
    async fetchProducts({ commit }) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
          console.warn(
            "No user authenticated. Cannot fetch products from Firestore.",
          );
          const localProducts = await db.products.toArray();
          commit("SET_PRODUCTS", localProducts);
          commit("SET_LOADING", false);
          return;
        }

        const productsFromFirestore = [];
        const q = query(
          collection(
            firestoreDb,
            `artifacts/alesfun-crm/users/${userId}/products`,
          ),
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const productForIndexedDB = {
            firestoreId: doc.id,
            codigo: data.codigo || "",
            nombre: data.nombre || "",
            precio:
              typeof data.precio === "number" && !isNaN(data.precio)
                ? data.precio
                : 0,
            stock:
              typeof data.stock === "number" && !isNaN(data.stock)
                ? data.stock
                : 0,
            createdAt:
              data.createdAt && typeof data.createdAt.toDate === "function"
                ? data.createdAt.toDate().getTime()
                : data.createdAt || Date.now(),
            updatedAt:
              data.updatedAt && typeof data.updatedAt.toDate === "function"
                ? data.updatedAt.toDate().getTime()
                : data.updatedAt || Date.now(),
            syncStatus: "synced",
          };
          productsFromFirestore.push(productForIndexedDB);
        });

        console.log(
          "[Products Module] Intentando bulkPut (actualizar/añadir) productos:",
          productsFromFirestore,
        );
        await db.products.bulkPut(productsFromFirestore);

        const updatedLocalProducts = await db.products.toArray();
        commit("SET_PRODUCTS", updatedLocalProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        commit("SET_ERROR", error);
        const localProducts = await db.products.toArray();
        commit("SET_PRODUCTS", localProducts);
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
  getters: {
    getProducts: (state) => state.allProducts,
    getProductById: (state) => (firestoreId) => {
      return state.allProducts.find(
        (product) => product.firestoreId === firestoreId,
      );
    },
  },
};

export default productsModule;
