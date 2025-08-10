<template>
  <div class="page-container">
    <h1 class="page-title">Gestión de Clientes</h1>

    <!-- Sección para Añadir Nuevo Cliente -->
    <div class="add-client-section card">
      <h2 class="section-title">Añadir Nuevo Cliente</h2>
      <form @submit.prevent="addClient">
        <div class="input-group">
          <label for="nombre">Nombre Completo:</label>
          <input
            type="text"
            id="nombre"
            v-model="newClient.nombre"
            placeholder="Ej. Juan Pérez"
            required
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="ci">CI / NIT:</label>
          <input
            type="text"
            id="ci"
            v-model="newClient.ci"
            placeholder="Ej. 12345678"
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="celular">Celular:</label>
          <input
            type="text"
            id="celular"
            v-model="newClient.celular"
            placeholder="Ej. 77712345"
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="direccion">Dirección:</label>
          <input
            type="text"
            id="direccion"
            v-model="newClient.direccion"
            placeholder="Ej. Av. Principal #123"
            class="input-field"
          />
        </div>
        <div class="button-group">
          <button type="submit" class="btn primary">Agregar Cliente</button>
        </div>
      </form>
    </div>

    <!-- Sección de Clientes Registrados -->
    <div class="registered-clients-section card">
      <h2 class="section-title">Clientes Registrados</h2>
      <div class="input-group">
        <label for="filter-clients">Filtrar Clientes:</label>
        <input
          type="text"
          id="filter-clients"
          v-model="filterTerm"
          placeholder="Buscar por nombre o CI..."
          class="input-field"
        />
      </div>

      <div v-if="loading" class="loading-message">Cargando clientes...</div>
      <div v-else-if="error" class="error-message">
        Error al cargar clientes: {{ error.message }}
      </div>
      <div v-else-if="filteredClients.length === 0" class="no-data-message">
        No hay clientes registrados o no se encontraron resultados.
      </div>
      <div v-else class="responsive-table">
        <table class="clients-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>CI</th>
              <th>Celular</th>
              <th>Saldo Actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in filteredClients" :key="client.firestoreId">
              <td>{{ client.nombre }}</td>
              <td>{{ client.ci || "N/A" }}</td>
              <td>{{ client.celular || "N/A" }}</td>
              <td
                :class="{
                  'saldo-positivo': client.saldoActual <= 0,
                  'saldo-negativo': client.saldoActual > 0,
                }"
              >
                {{ formatCurrency(client.saldoActual) }}
              </td>
              <td>
                <button class="btn small secondary" @click="editClient(client)">
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
                    class="feather feather-edit"
                  >
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    ></path>
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    ></path>
                  </svg>
                </button>
                <button
                  class="btn small info-btn"
                  @click="openAdjustBalanceModal(client)"
                >
                  Ajustar Saldo
                </button>
                <button
                  class="btn small delete-btn"
                  @click="confirmDeleteClient(client)"
                >
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
                    class="feather feather-trash-2"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    ></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Edición de Cliente -->
    <div
      v-if="showEditModal"
      class="modal-overlay"
      @click.self="closeEditModal"
    >
      <div class="modal-content">
        <h3>Editar Cliente</h3>
        <div class="input-group">
          <label for="edit-nombre">Nombre Completo:</label>
          <input
            type="text"
            id="edit-nombre"
            v-model="editingClient.nombre"
            required
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="edit-ci">CI / NIT:</label>
          <input
            type="text"
            id="edit-ci"
            v-model="editingClient.ci"
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="edit-celular">Celular:</label>
          <input
            type="text"
            id="edit-celular"
            v-model="editingClient.celular"
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="edit-direccion">Dirección:</label>
          <input
            type="text"
            id="edit-direccion"
            v-model="editingClient.direccion"
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="edit-saldo">Saldo Actual:</label>
          <input
            type="number"
            id="edit-saldo"
            v-model.number="editingClient.saldoActual"
            step="0.01"
            class="input-field"
          />
        </div>
        <div class="button-group">
          <button class="btn primary" @click="saveEditedClient">Guardar</button>
          <button class="btn secondary" @click="closeEditModal">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div
      v-if="showDeleteConfirmModal"
      class="modal-overlay"
      @click.self="cancelDeleteClient"
    >
      <div class="modal-content">
        <h3>Confirmar Eliminación</h3>
        <p>
          Para confirmar la eliminación de "{{ clientToDelete?.nombre }}",
          escribe "YES" en el campo de abajo:
        </p>
        <div class="input-group">
          <input
            type="text"
            v-model="deleteConfirmationInput"
            placeholder="Escribe YES para confirmar"
            class="input-field"
            @keyup.enter="deleteClient"
          />
        </div>
        <div class="button-group">
          <button
            class="btn delete-btn"
            @click="deleteClient"
            :disabled="deleteConfirmationInput.toLowerCase() !== 'yes'"
          >
            Eliminar
          </button>
          <button class="btn secondary" @click="cancelDeleteClient">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Nuevo Modal de Ajuste de Saldo Inicial -->
    <div
      v-if="showAdjustBalanceModal"
      class="modal-overlay"
      @click.self="closeAdjustBalanceModal"
    >
      <div class="modal-content">
        <h3>Ajustar Saldo Inicial para {{ adjustingClient?.nombre }}</h3>
        <p>
          El saldo actual del cliente es:
          <span
            :class="{
              'saldo-positivo': adjustingClient?.saldoActual <= 0,
              'saldo-negativo': adjustingClient?.saldoActual > 0,
            }"
          >
            {{ formatCurrency(adjustingClient?.saldoActual) }}
          </span>
        </p>
        <div class="input-group">
          <label for="adjust-amount">Monto del Ajuste (Bs):</label>
          <input
            type="number"
            id="adjust-amount"
            v-model.number="initialBalanceAdjustmentAmount"
            step="0.01"
            placeholder="Ej. 50.00 (para deuda) o -20.00 (para crédito)"
            class="input-field"
          />
          <p class="help-text">
            Ingresa un valor positivo si el cliente te debe (ej. 50).<br />
            Ingresa un valor negativo si tú le debes al cliente (ej. -20).
          </p>
        </div>
        <div class="button-group">
          <button class="btn primary" @click="adjustClientInitialBalance">
            Registrar Ajuste
          </button>
          <button class="btn secondary" @click="closeAdjustBalanceModal">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import db from "@/utils/db"; // Tu instancia de Dexie
import { forceSync } from "@/utils/syncService"; // Para forzar sincronización
import { formatCurrency } from "@/utils/helpers"; // Para formatear moneda

const store = useStore();

const newClient = ref({
  nombre: "",
  ci: "",
  celular: "",
  direccion: "",
  saldoActual: 0,
});

const filterTerm = ref("");
const showEditModal = ref(false);
const editingClient = ref(null);
const showDeleteConfirmModal = ref(false);
const clientToDelete = ref(null);
const deleteConfirmationInput = ref(""); // Para la confirmación de eliminación

// Nuevo estado para el ajuste de saldo inicial
const showAdjustBalanceModal = ref(false);
const adjustingClient = ref(null);
const initialBalanceAdjustmentAmount = ref(0);

// Computed properties desde Vuex
const allClients = computed(() => store.getters["clients/getClients"]);
const loading = computed(() => store.getters["clients/getLoading"]);
const error = computed(() => store.getters["clients/getError"]);

const filteredClients = computed(() => {
  if (!filterTerm.value) {
    return allClients.value;
  }
  const lowerCaseFilter = filterTerm.value.toLowerCase();
  return allClients.value.filter(
    (client) =>
      client.nombre.toLowerCase().includes(lowerCaseFilter) ||
      client.ci.toLowerCase().includes(lowerCaseFilter),
  );
});

// --- Métodos de Cliente ---
const addClient = async () => {
  // Validación: Campos requeridos
  if (!newClient.value.nombre.trim()) {
    alert("El nombre del cliente es obligatorio.");
    return;
  }

  // Validación: No permitir CI duplicado (si se proporciona)
  if (newClient.value.ci.trim()) {
    const existingClientByCi = allClients.value.find(
      (client) =>
        client.ci.trim().toLowerCase() ===
        newClient.value.ci.trim().toLowerCase(),
    );
    if (existingClientByCi) {
      alert("Ya existe un cliente con este número de CI. Por favor, verifica.");
      return;
    }
  }

  // Validación: No permitir nombre duplicado (considerando mayúsculas/minúsculas y espacios)
  const existingClientByName = allClients.value.find(
    (client) =>
      client.nombre.trim().toLowerCase() ===
      newClient.value.nombre.trim().toLowerCase(),
  );
  if (existingClientByName) {
    alert(
      "Ya existe un cliente con este nombre. Por favor, usa un nombre único o verifica si ya está registrado.",
    );
    return;
  }

  try {
    const clientData = {
      ...newClient.value,
      saldoActual: 0, // Siempre iniciar con saldo 0 para nuevos clientes
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: "pending", // Marcar como pendiente para sincronizar
      firestoreId: null, // Se llenará cuando se suba a Firestore
    };

    // Añadir a IndexedDB
    const localClientId = await db.clients.add(clientData);
    console.log("Cliente añadido a IndexedDB con ID local:", localClientId);

    // Añadir a la cola de sincronización
    await db.syncQueue.add({
      collectionName: "clients",
      operation: "add",
      data: { ...clientData, id: undefined }, // Firebase no necesita 'id' autoincremental de Dexie
      localId: localClientId, // ID autoincremental de Dexie para referencia local
      firestoreId: null, // Se llenará una vez subido a Firestore
      timestamp: Date.now(),
    });
    console.log("Cliente añadido a syncQueue. localId:", localClientId);

    alert("Cliente registrado exitosamente. Se sincronizará pronto.");

    // Limpiar formulario
    newClient.value = {
      nombre: "",
      ci: "",
      celular: "",
      direccion: "",
      saldoActual: 0,
    };

    // Forzar sincronización para que se suba a Firestore
    store.dispatch("startSyncAnimation");
    setTimeout(() => {
      forceSync();
    }, 500);
  } catch (error) {
    console.error("Error al añadir cliente:", error);
    alert("Error al registrar cliente. Revisa la consola.");
  }
};

const editClient = (client) => {
  editingClient.value = { ...client }; // Copia profunda para no modificar el original directamente
  showEditModal.value = true;
};

const saveEditedClient = async () => {
  if (!editingClient.value.nombre.trim()) {
    alert("El nombre del cliente es obligatorio.");
    return;
  }

  // Validación: No permitir CI o nombre duplicado (excluyendo el cliente que se está editando)
  if (editingClient.value.ci.trim()) {
    const existingClientByCi = allClients.value.find(
      (client) =>
        client.firestoreId !== editingClient.value.firestoreId && // Excluir el cliente actual
        client.ci.trim().toLowerCase() ===
          editingClient.value.ci.trim().toLowerCase(),
    );
    if (existingClientByCi) {
      alert(
        "Ya existe otro cliente con este número de CI. Por favor, verifica.",
      );
      return;
    }
  }

  const existingClientByName = allClients.value.find(
    (client) =>
      client.firestoreId !== editingClient.value.firestoreId && // Excluir el cliente actual
      client.nombre.trim().toLowerCase() ===
        editingClient.value.nombre.trim().toLowerCase(),
  );
  if (existingClientByName) {
    alert(
      "Ya existe otro cliente con este nombre. Por favor, usa un nombre único o verifica si ya está registrado.",
    );
    return;
  }

  try {
    const updatedData = {
      ...editingClient.value,
      updatedAt: Date.now(),
      syncStatus: "pending", // Marcar como pendiente para sincronizar
    };

    // Actualizar en IndexedDB
    // Usamos el ID autoincremental de Dexie (editingClient.value.id) para la actualización local
    await db.clients.update(editingClient.value.id, updatedData);
    console.log(
      "Cliente actualizado en IndexedDB (local ID):",
      editingClient.value.id,
    );

    // Añadir a la cola de sincronización para Firestore
    await db.syncQueue.add({
      collectionName: "clients",
      operation: "update",
      data: { ...updatedData, id: editingClient.value.firestoreId }, // Usar firestoreId para la data de Firestore
      localId: editingClient.value.id, // ID local de Dexie
      firestoreId: editingClient.value.firestoreId, // ID de Firestore
      timestamp: Date.now(),
    });
    console.log(
      "Actualización de cliente añadida a syncQueue. Cliente firestoreId:",
      editingClient.value.firestoreId,
    );

    alert("Cliente actualizado exitosamente. Se sincronizará pronto.");
    closeEditModal();

    store.dispatch("startSyncAnimation");
    setTimeout(() => {
      forceSync();
    }, 500);
  } catch (error) {
    console.error("Error al guardar cliente editado:", error);
    alert("Error al guardar cliente editado. Revisa la consola.");
  }
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingClient.value = null;
};

const confirmDeleteClient = (client) => {
  clientToDelete.value = client;
  deleteConfirmationInput.value = ""; // Limpiar el input de confirmación
  showDeleteConfirmModal.value = true;
};

const deleteClient = async () => {
  if (!clientToDelete.value) return;

  // Validar la confirmación de texto
  if (deleteConfirmationInput.value.toLowerCase() !== "yes") {
    alert("Por favor, escribe 'YES' para confirmar la eliminación.");
    return;
  }

  try {
    // Eliminar de IndexedDB
    await db.clients.delete(clientToDelete.value.id);
    console.log("Cliente eliminado de IndexedDB:", clientToDelete.value.id);

    // Añadir a la cola de sincronización para eliminar de Firestore
    await db.syncQueue.add({
      collectionName: "clients",
      operation: "delete",
      data: null, // No se necesita data para la eliminación
      localId: clientToDelete.value.id,
      firestoreId: clientToDelete.value.firestoreId, // Necesario para eliminar de Firestore
      timestamp: Date.now(),
    });
    console.log(
      "Eliminación de cliente añadida a syncQueue. Cliente firestoreId:",
      clientToDelete.value.firestoreId,
    );

    alert("Cliente eliminado exitosamente. Se sincronizará pronto.");
    cancelDeleteClient();

    // Forzar sincronización y luego actualizar la lista de clientes
    store.dispatch("startSyncAnimation");
    await forceSync(); // Esperar a que la sincronización termine
    await store.dispatch("clients/fetchClients"); // Volver a cargar clientes después de la sincronización
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    alert("Error al eliminar cliente. Revisa la consola.");
  }
};

const cancelDeleteClient = () => {
  showDeleteConfirmModal.value = false;
  clientToDelete.value = null;
  deleteConfirmationInput.value = ""; // Limpiar el input de confirmación
};

// --- Métodos para Ajuste de Saldo Inicial ---
const openAdjustBalanceModal = (client) => {
  adjustingClient.value = { ...client };
  initialBalanceAdjustmentAmount.value = 0; // Resetear el monto
  showAdjustBalanceModal.value = true;
};

const closeAdjustBalanceModal = () => {
  showAdjustBalanceModal.value = false;
  adjustingClient.value = null;
  initialBalanceAdjustmentAmount.value = 0;
};

const adjustClientInitialBalance = async () => {
  if (
    !adjustingClient.value ||
    typeof initialBalanceAdjustmentAmount.value !== "number" ||
    isNaN(initialBalanceAdjustmentAmount.value)
  ) {
    alert(
      "Por favor, selecciona un cliente y/o ingresa un monto válido para el ajuste.",
    );
    return;
  }

  try {
    const oldBalance = adjustingClient.value.saldoActual;
    const newCalculatedBalance =
      oldBalance + initialBalanceAdjustmentAmount.value;

    // Crear un movimiento para registrar este ajuste
    const adjustmentMovement = {
      firestoreId: null, // Se llenará al sincronizar
      fecha: Date.now(),
      clienteId: adjustingClient.value.firestoreId,
      clienteFirestoreId: adjustingClient.value.firestoreId,
      clienteNombre: adjustingClient.value.nombre,
      clienteCi: adjustingClient.value.ci,
      type: "ajuste_saldo_inicial", // Nuevo tipo de movimiento
      monto: initialBalanceAdjustmentAmount.value, // El monto del ajuste (puede ser positivo o negativo)
      montoPago: initialBalanceAdjustmentAmount.value, // Para fines de registro, puede ser el mismo
      saldoAnterior: oldBalance,
      newBalance: newCalculatedBalance,
      cambio: 0, // No hay cambio en un ajuste directo
      ventaItems: [], // No hay ítems de venta
      syncStatus: "pending",
      descripcion: `Ajuste de saldo inicial: ${formatCurrency(initialBalanceAdjustmentAmount.value)}`,
    };

    // 1. Añadir el movimiento de ajuste a IndexedDB
    const localMovementId = await db.movements.add(adjustmentMovement);
    console.log(
      "Movimiento de ajuste de saldo añadido a IndexedDB con ID local:",
      localMovementId,
    );

    // 2. Actualizar el saldo del cliente en IndexedDB
    const updatedClientData = {
      // Variable correctamente definida
      ...adjustingClient.value,
      saldoActual: newCalculatedBalance,
      updatedAt: Date.now(),
      syncStatus: "pending",
    };
    await db.clients.update(adjustingClient.value.id, updatedClientData); // Usando updatedClientData
    console.log(
      "Cliente actualizado en IndexedDB (saldo inicial ajustado):",
      adjustingClient.value.id,
      "Nuevo Saldo:",
      newCalculatedBalance,
    );

    // 3. Añadir a la cola de sincronización para el movimiento
    await db.syncQueue.add({
      collectionName: "movements",
      operation: "add",
      data: { ...adjustmentMovement, id: undefined },
      localId: localMovementId,
      firestoreId: null,
      timestamp: Date.now(),
    });
    console.log(
      "Movimiento de ajuste añadido a syncQueue. localId:",
      localMovementId,
    );

    // 4. Añadir a la cola de sincronización para la actualización del cliente
    await db.syncQueue.add({
      collectionName: "clients",
      operation: "update",
      data: { ...updatedClientData, id: adjustingClient.value.firestoreId },
      localId: adjustingClient.value.id,
      firestoreId: adjustingClient.value.firestoreId,
      timestamp: Date.now(),
    });
    console.log(
      "Actualización de cliente (ajuste de saldo) añadida a syncQueue. Cliente firestoreId:",
      adjustingClient.value.firestoreId,
    );

    alert("Saldo inicial ajustado exitosamente. Se sincronizará pronto.");
    closeAdjustBalanceModal();

    // Forzar sincronización y luego actualizar la lista de clientes
    store.dispatch("startSyncAnimation");
    await forceSync();
    await store.dispatch("clients/fetchClients"); // Para reflejar el saldo actualizado en la tabla
  } catch (error) {
    console.error("Error al ajustar saldo inicial:", error);
    alert("Error al ajustar saldo inicial. Revisa la consola.");
  }
};

// --- Lifecycle Hook ---
onMounted(() => {
  store.dispatch("clients/fetchClients"); // Cargar clientes al montar el componente
});
</script>

<style scoped>
/* Tus estilos CSS existentes */
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

.page-container {
  padding: 20px;
  max-width: 900px;
  margin: 20px auto;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(0, 191, 255, 0.4);
  overflow-y: auto;
  max-height: calc(100vh - 120px);
}

.page-title {
  font-family: "Orbitron", sans-serif;
  color: #00bfff;
  font-size: 2.8em;
  text-align: center;
  margin-bottom: 40px;
  text-shadow:
    0 0 15px #00bfff,
    0 0 25px rgba(0, 191, 255, 0.6);
  letter-spacing: 1.5px;
}

.card {
  background-color: rgba(10, 10, 20, 0.8);
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 191, 255, 0.3);
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
  color: #87ceeb;
  font-size: 1.8em;
  margin-bottom: 25px;
  text-align: center;
  text-shadow:
    0 0 8px #87ceeb,
    0 0 15px rgba(135, 206, 235, 0.4);
}

.input-group {
  margin-bottom: 20px;
  position: relative;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #add8e6;
  font-size: 1em;
  letter-spacing: 0.5px;
}

.input-field {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #4682b4;
  border-radius: 8px;
  background-color: #1a2a3a;
  color: #e0e0e0;
  font-size: 1.1em;
  box-sizing: border-box;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.input-field:focus {
  border-color: #00bfff;
  box-shadow: 0 0 12px rgba(0, 191, 255, 0.6);
  outline: none;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #1a2a3a;
  border: 1px solid #00bfff;
  border-radius: 8px;
  list-style: none;
  padding: 0;
  margin-top: 5px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
}

.suggestions-list li {
  padding: 12px 15px;
  cursor: pointer;
  color: #e0e0e0;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.suggestions-list li:hover {
  background-color: rgba(0, 191, 255, 0.3);
  color: white;
}

.selected-client-info {
  background-color: rgba(0, 191, 255, 0.15);
  border: 1px solid rgba(0, 191, 255, 0.5);
  border-radius: 12px;
  padding: 20px;
  margin-top: 25px;
  text-align: left;
  box-shadow: 0 2px 10px rgba(0, 191, 255, 0.2);
}

.selected-client-info h3 {
  color: #a7f3d0;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.3em;
  text-shadow: 0 0 5px rgba(167, 243, 208, 0.3);
}

.selected-client-info p {
  margin-bottom: 8px;
  font-size: 1em;
  color: #c0c0c0;
}

.selected-client-info p strong {
  color: #e0e0e0;
}

.no-data-message {
  text-align: center;
  margin-top: 25px;
  font-size: 1.1em;
  color: #b0bec5;
  font-style: italic;
}

.payment-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  background-color: rgba(10, 10, 20, 0.8);
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 191, 255, 0.3);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4682b4;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #00bfff;
}

input:focus + .slider {
  box-shadow: 0 0 1px #00bfff;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.toggle-switch + span {
  color: #add8e6;
  font-size: 1.1em;
  font-weight: bold;
}

.cart-items-container {
  margin-top: 30px;
}

.cart-items-container h3 {
  font-family: "Orbitron", sans-serif;
  color: #a7f3d0;
  font-size: 1.4em;
  margin-bottom: 20px;
  text-align: center;
  text-shadow: 0 0 5px #a7f3d0;
}

.responsive-table {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 15px;
  border: 1px solid rgba(0, 191, 255, 0.3);
  margin-top: 25px;
  background-color: rgba(10, 10, 20, 0.8);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  overflow-y: hidden;
}

.clients-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.clients-table th,
.clients-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 191, 255, 0.15);
  color: #e0e0e0;
}

.clients-table th {
  background-color: rgba(0, 191, 255, 0.1);
  color: #a7f3d0;
  font-family: "Orbitron", sans-serif;
  font-weight: 500;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.clients-table tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.1);
}

.clients-table tbody tr:hover {
  background-color: rgba(0, 191, 255, 0.08);
}

.clients-table td {
  font-size: 0.95em;
}

.quantity-input,
.price-input {
  width: 70px;
  padding: 6px 8px;
  border: 1px solid #4682b4;
  border-radius: 5px;
  background-color: #1a2a3a;
  color: #e0e0e0;
  font-size: 0.9em;
  box-sizing: border-box;
}

.quantity-input:focus,
.price-input:focus {
  border-color: #00bfff;
  box-shadow: 0 0 5px rgba(0, 191, 255, 0.4);
  outline: none;
}

.payment-summary-section p {
  margin-bottom: 10px;
  font-size: 1.1em;
  color: #c0c0c0;
}

.payment-summary-section p strong {
  color: #e0e0e0;
}

.saldo-positivo {
  color: #00e676;
  font-weight: bold;
}

.saldo-negativo {
  color: #ff5252;
  font-weight: bold;
}

.text-lime-400 {
  color: #a7f3d0;
}

.text-blue-400 {
  color: #60a5fa;
}

.last-receipt-section {
  margin-top: 30px;
}

.receipt-preview {
  background-color: #1a2a3a;
  border: 1px solid #00bfff;
  border-radius: 10px;
  padding: 20px;
  white-space: pre-wrap;
  font-family: "monospace";
  font-size: 0.95em;
  max-height: 350px;
  overflow-y: auto;
  color: #a7f3d0;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

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

.btn.small {
  padding: 8px 12px;
  font-size: 0.85em;
  min-width: unset;
  display: flex;
  justify-content: center;
  align-items: center;
}

.delete-btn {
  background: linear-gradient(45deg, #ff5252, #e04040);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 82, 82, 0.3);
}
.delete-btn:hover {
  background: linear-gradient(45deg, #e04040, #ff5252);
  transform: translateY(-1px);
}

.info-btn {
  background: linear-gradient(45deg, #4682b4, #5f9ea0);
  color: white;
  box-shadow: 0 2px 8px rgba(70, 130, 180, 0.3);
}

.info-btn:hover {
  background: linear-gradient(45deg, #5f9ea0, #4682b4);
  transform: translateY(-1px);
}

/* Estilos para Modales */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: rgba(10, 10, 20, 0.95);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 8px 30px rgba(0, 191, 255, 0.5);
  border: 1px solid #00bfff;
  width: 90%;
  max-width: 500px;
  text-align: center;
  color: #e0e0e0;
}

.modal-content h3 {
  font-family: "Orbitron", sans-serif;
  color: #a7f3d0;
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.6em;
  text-shadow: 0 0 8px rgba(167, 243, 208, 0.4);
}

.modal-content p {
  margin-bottom: 25px;
  font-size: 1.1em;
}

.help-text {
  font-size: 0.9em;
  color: #b0bec5;
  margin-top: 10px;
  line-height: 1.4;
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
  .input-field {
    padding: 10px 12px;
    font-size: 1em;
  }
  label {
    font-size: 0.9em;
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
  .btn.small {
    padding: 8px 15px;
    font-size: 0.9em;
  }
  .responsive-table {
    overflow-x: auto;
  }
  .clients-table {
    min-width: 400px;
  }
  .clients-table th,
  .clients-table td {
    padding: 10px 12px;
    font-size: 0.85em;
  }
  .receipt-preview {
    padding: 15px;
    font-size: 0.85em;
    max-height: 250px;
  }
  .modal-content {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8em;
    margin-bottom: 25px;
  }
  .card {
    padding: 15px;
    margin-bottom: 15px;
  }
  .section-title {
    font-size: 1.3em;
    margin-bottom: 15px;
  }
  .input-field {
    padding: 8px 10px;
    font-size: 0.9em;
  }
  label {
    font-size: 0.85em;
  }
  .clients-table {
    min-width: 300px;
  }
  .clients-table th,
  .clients-table td {
    padding: 8px 10px;
    font-size: 0.75em;
  }
  .receipt-preview {
    font-size: 0.8em;
  }
}
</style>
