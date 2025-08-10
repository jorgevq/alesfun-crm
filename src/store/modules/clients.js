// src/store/modules/clients.js
import db from "@/utils/db"; // Importa la instancia de Dexie
import { auth, db as firestoreDb } from "@/firebase/config"; // Importa Firebase auth y db
import { collection, getDocs, query } from "firebase/firestore";

const clientsModule = {
  namespaced: true,
  state: () => ({
    allClients: [],
    loading: false,
    error: null,
  }),
  mutations: {
    SET_CLIENTS(state, clients) {
      state.allClients = clients;
    },
    // ADD_CLIENT(state, client) { // Esta mutación podría ser útil si añades clientes directamente al store
    //   state.allClients.push(client);
    // },
    UPDATE_CLIENT(state, updatedClient) {
      // Buscar cliente por firestoreId para asegurar consistencia
      const index = state.allClients.findIndex(
        (c) => c.firestoreId === updatedClient.firestoreId,
      );
      if (index !== -1) {
        state.allClients.splice(index, 1, updatedClient);
      }
    },
    REMOVE_CLIENT(state, clientId) {
      // Filtrar clientes por firestoreId para asegurar consistencia
      state.allClients = state.allClients.filter(
        (client) => client.firestoreId !== clientId,
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
    async fetchClients({ commit }) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
          console.warn(
            "No user authenticated. Cannot fetch clients from Firestore.",
          );
          const localClients = await db.clients.toArray();
          commit("SET_CLIENTS", localClients);
          commit("SET_LOADING", false);
          return;
        }

        const clientsFromFirestore = [];
        const q = query(
          collection(
            firestoreDb,
            `artifacts/alesfun-crm/users/${userId}/clients`,
          ),
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const clientForIndexedDB = {
            firestoreId: doc.id,
            ci: data.ci || "",
            nombre: data.nombre || "",
            celular: data.celular || "",
            direccion: data.direccion || "",
            saldoActual:
              typeof data.saldoActual === "number" && !isNaN(data.saldoActual)
                ? data.saldoActual
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
          clientsFromFirestore.push(clientForIndexedDB);
        });

        // Usar bulkPut en lugar de clear() y bulkAdd() para actualizar/insertar
        console.log(
          "[Clients Module] Intentando bulkPut (actualizar/añadir) clientes:",
          clientsFromFirestore,
        );
        await db.clients.bulkPut(clientsFromFirestore);

        const updatedLocalClients = await db.clients.toArray();
        commit("SET_CLIENTS", updatedLocalClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        commit("SET_ERROR", error);
        const localClients = await db.clients.toArray();
        commit("SET_CLIENTS", localClients);
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
  getters: {
    getClients: (state) => state.allClients,
    getDebtors: (state) => {
      console.log("[Clients Getter] allClients:", state.allClients);

      const debtors = state.allClients
        .filter((client) => {
          console.log(
            `[Clients Getter] Cliente: ${client.nombre}, SaldoActual: ${
              client.saldoActual
            }, EsDeudor: ${client.saldoActual > 0}`,
          );
          return client.saldoActual > 0;
        })
        .sort((a, b) => b.saldoActual - a.saldoActual);

      console.log("[Clients Getter] Deudores encontrados:", debtors);
      return debtors;
    },
  },
};

export default clientsModule;
