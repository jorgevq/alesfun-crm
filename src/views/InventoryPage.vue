<template>
  <div class="page-container">
    <h1 class="page-title">Gestión de Inventario</h1>

    <!-- Sección para Añadir Nuevo Producto -->
    <div class="add-product-section card">
      <h2 class="section-title">Añadir Nuevo Producto</h2>
      <form @submit.prevent="addProduct">
        <div class="input-group">
          <label for="codigo">Código:</label>
          <input
            type="text"
            id="codigo"
            v-model="newProduct.codigo"
            placeholder="Ej. PROD001"
            required
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="nombre">Nombre del Producto:</label>
          <input
            type="text"
            id="nombre"
            v-model="newProduct.nombre"
            placeholder="Ej. Azúcar Fina 1Kg"
            required
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="precio">Precio (Bs):</label>
          <input
            type="number"
            id="precio"
            v-model.number="newProduct.precio"
            step="0.01"
            required
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="stock">Stock Inicial:</label>
          <input
            type="number"
            id="stock"
            v-model.number="newProduct.stock"
            step="1"
            required
            class="input-field"
          />
        </div>
        <div class="button-group">
          <button type="submit" class="btn primary">Agregar Producto</button>
        </div>
      </form>
    </div>

    <!-- Sección de Productos Registrados -->
    <div class="registered-products-section card">
      <h2 class="section-title">Productos Registrados</h2>
      <div class="input-group">
        <label for="filter-products">Filtrar Productos:</label>
        <input
          type="text"
          id="filter-products"
          v-model="filterTerm"
          placeholder="Buscar por nombre o código..."
          class="input-field"
        />
      </div>

      <div v-if="loading" class="loading-message">Cargando productos...</div>
      <div v-else-if="error" class="error-message">
        Error al cargar productos: {{ error.message }}
      </div>
      <div v-else-if="filteredProducts.length === 0" class="no-data-message">
        No hay productos registrados o no se encontraron resultados.
      </div>
      <div v-else class="responsive-table">
        <table class="products-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Precio (Bs)</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.firestoreId">
              <td>{{ product.codigo }}</td>
              <td>{{ product.nombre }}</td>
              <td>{{ formatCurrency(product.precio) }}</td>
              <td>{{ product.stock }}</td>
              <td>
                <button
                  class="btn small secondary"
                  @click="editProduct(product)"
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
                  class="btn small delete-btn"
                  @click="confirmDeleteProduct(product)"
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

    <!-- Modal de Edición de Producto -->
    <div
      v-if="showEditModal"
      class="modal-overlay"
      @click.self="closeEditModal"
    >
      <div class="modal-content">
        <h3>Editar Producto</h3>
        <div class="input-group">
          <label for="edit-codigo">Código:</label>
          <input
            type="text"
            id="edit-codigo"
            v-model="editingProduct.codigo"
            required
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="edit-nombre">Nombre del Producto:</label>
          <input
            type="text"
            id="edit-nombre"
            v-model="editingProduct.nombre"
            required
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="edit-precio">Precio (Bs):</label>
          <input
            type="number"
            id="edit-precio"
            v-model.number="editingProduct.precio"
            step="0.01"
            required
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label for="edit-stock">Stock:</label>
          <input
            type="number"
            id="edit-stock"
            v-model.number="editingProduct.stock"
            step="1"
            required
            class="input-field"
          />
        </div>
        <div class="button-group">
          <button class="btn primary" @click="saveEditedProduct">
            Guardar
          </button>
          <button class="btn secondary" @click="closeEditModal">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación de Producto -->
    <div
      v-if="showDeleteConfirmModal"
      class="modal-overlay"
      @click.self="cancelDeleteProduct"
    >
      <div class="modal-content">
        <h3>Confirmar Eliminación</h3>
        <p>
          Para confirmar la eliminación de "{{ productToDelete?.nombre }}",
          escribe "YES" en el campo de abajo:
        </p>
        <div class="input-group">
          <input
            type="text"
            v-model="deleteConfirmationInput"
            placeholder="Escribe YES para confirmar"
            class="input-field"
            @keyup.enter="deleteProduct"
          />
        </div>
        <div class="button-group">
          <button
            class="btn delete-btn"
            @click="deleteProduct"
            :disabled="deleteConfirmationInput.toLowerCase() !== 'yes'"
          >
            Eliminar
          </button>
          <button class="btn secondary" @click="cancelDeleteProduct">
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

const newProduct = ref({
  codigo: "",
  nombre: "",
  precio: 0,
  stock: 0,
});

const filterTerm = ref("");
const showEditModal = ref(false);
const editingProduct = ref(null);
const showDeleteConfirmModal = ref(false);
const productToDelete = ref(null);
const deleteConfirmationInput = ref(""); // Para la confirmación de eliminación

// Computed properties desde Vuex
const allProducts = computed(() => store.getters["products/getProducts"]);
const loading = computed(() => store.getters["products/getLoading"]);
const error = computed(() => store.getters["products/getError"]);

const filteredProducts = computed(() => {
  if (!filterTerm.value) {
    return allProducts.value;
  }
  const lowerCaseFilter = filterTerm.value.toLowerCase();
  return allProducts.value.filter(
    (product) =>
      product.nombre.toLowerCase().includes(lowerCaseFilter) ||
      product.codigo.toLowerCase().includes(lowerCaseFilter),
  );
});

// --- Métodos de Producto ---
const addProduct = async () => {
  // Validación: Campos requeridos
  if (!newProduct.value.codigo.trim() || !newProduct.value.nombre.trim()) {
    alert("El código y el nombre del producto son obligatorios.");
    return;
  }
  if (
    typeof newProduct.value.precio !== "number" ||
    isNaN(newProduct.value.precio) ||
    newProduct.value.precio < 0
  ) {
    alert("El precio debe ser un número positivo.");
    return;
  }
  if (
    typeof newProduct.value.stock !== "number" ||
    isNaN(newProduct.value.stock) ||
    newProduct.value.stock < 0
  ) {
    alert("El stock debe ser un número entero no negativo.");
    return;
  }

  // Validación: No permitir Código o Nombre duplicado
  const existingProductByCode = allProducts.value.find(
    (product) =>
      product.codigo.trim().toLowerCase() ===
      newProduct.value.codigo.trim().toLowerCase(),
  );
  if (existingProductByCode) {
    alert("Ya existe un producto con este código. Por favor, verifica.");
    return;
  }

  const existingProductByName = allProducts.value.find(
    (product) =>
      product.nombre.trim().toLowerCase() ===
      newProduct.value.nombre.trim().toLowerCase(),
  );
  if (existingProductByName) {
    alert(
      "Ya existe un producto con este nombre. Por favor, usa un nombre único o verifica si ya está registrado.",
    );
    return;
  }

  try {
    const productData = {
      ...newProduct.value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: "pending", // Marcar como pendiente para sincronizar
      firestoreId: null, // Se llenará cuando se suba a Firestore
    };

    // Añadir a IndexedDB
    const localProductId = await db.products.add(productData);
    console.log("Producto añadido a IndexedDB con ID local:", localProductId);

    // Añadir a la cola de sincronización
    await db.syncQueue.add({
      collectionName: "products",
      operation: "add",
      data: { ...productData, id: undefined }, // Firebase no necesita 'id' autoincremental de Dexie
      localId: localProductId, // ID autoincremental de Dexie para referencia local
      firestoreId: null, // Se llenará una vez subido a Firestore
      timestamp: Date.now(),
    });
    console.log("Producto añadido a syncQueue. localId:", localProductId);

    alert("Producto registrado exitosamente. Se sincronizará pronto.");

    // Limpiar formulario
    newProduct.value = {
      codigo: "",
      nombre: "",
      precio: 0,
      stock: 0,
    };

    // Forzar sincronización para que se suba a Firestore
    store.dispatch("startSyncAnimation");
    setTimeout(() => {
      forceSync();
    }, 500);
  } catch (error) {
    console.error("Error al añadir producto:", error);
    alert("Error al registrar producto. Revisa la consola.");
  }
};

const editProduct = (product) => {
  editingProduct.value = { ...product }; // Copia profunda
  showEditModal.value = true;
};

const saveEditedProduct = async () => {
  if (
    !editingProduct.value.codigo.trim() ||
    !editingProduct.value.nombre.trim()
  ) {
    alert("El código y el nombre del producto son obligatorios.");
    return;
  }
  if (
    typeof editingProduct.value.precio !== "number" ||
    isNaN(editingProduct.value.precio) ||
    editingProduct.value.precio < 0
  ) {
    alert("El precio debe ser un número positivo.");
    return;
  }
  if (
    typeof editingProduct.value.stock !== "number" ||
    isNaN(editingProduct.value.stock) ||
    editingProduct.value.stock < 0
  ) {
    alert("El stock debe ser un número entero no negativo.");
    return;
  }

  // Validación: No permitir Código o Nombre duplicado (excluyendo el producto que se está editando)
  const existingProductByCode = allProducts.value.find(
    (product) =>
      product.firestoreId !== editingProduct.value.firestoreId && // Excluir el producto actual
      product.codigo.trim().toLowerCase() ===
        editingProduct.value.codigo.trim().toLowerCase(),
  );
  if (existingProductByCode) {
    alert("Ya existe otro producto con este código. Por favor, verifica.");
    return;
  }

  const existingProductByName = allProducts.value.find(
    (product) =>
      product.firestoreId !== editingProduct.value.firestoreId && // Excluir el producto actual
      product.nombre.trim().toLowerCase() ===
        editingProduct.value.nombre.trim().toLowerCase(),
  );
  if (existingProductByName) {
    alert(
      "Ya existe otro producto con este nombre. Por favor, usa un nombre único o verifica si ya está registrado.",
    );
    return;
  }

  try {
    const updatedData = {
      ...editingProduct.value,
      updatedAt: Date.now(),
      syncStatus: "pending", // Marcar como pendiente para sincronizar
    };

    // Actualizar en IndexedDB
    await db.products.update(editingProduct.value.id, updatedData);
    console.log(
      "Producto actualizado en IndexedDB (local ID):",
      editingProduct.value.id,
    );

    // Añadir a la cola de sincronización para Firestore
    await db.syncQueue.add({
      collectionName: "products",
      operation: "update",
      data: { ...updatedData, id: editingProduct.value.firestoreId },
      localId: editingProduct.value.id,
      firestoreId: editingProduct.value.firestoreId,
      timestamp: Date.now(),
    });
    console.log(
      "Actualización de producto añadida a syncQueue. Producto firestoreId:",
      editingProduct.value.firestoreId,
    );

    alert("Producto actualizado exitosamente. Se sincronizará pronto.");
    closeEditModal();

    store.dispatch("startSyncAnimation");
    setTimeout(() => {
      forceSync();
    }, 500);
  } catch (error) {
    console.error("Error al guardar producto editado:", error);
    alert("Error al guardar producto editado. Revisa la consola.");
  }
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingProduct.value = null;
};

const confirmDeleteProduct = (product) => {
  productToDelete.value = product;
  deleteConfirmationInput.value = ""; // Limpiar el input de confirmación
  showDeleteConfirmModal.value = true;
};

const deleteProduct = async () => {
  if (!productToDelete.value) return;

  // Validar la confirmación de texto
  if (deleteConfirmationInput.value.toLowerCase() !== "yes") {
    alert("Por favor, escribe 'YES' para confirmar la eliminación.");
    return;
  }

  try {
    // Eliminar de IndexedDB
    await db.products.delete(productToDelete.value.id);
    console.log("Producto eliminado de IndexedDB:", productToDelete.value.id);

    // Añadir a la cola de sincronización para eliminar de Firestore
    await db.syncQueue.add({
      collectionName: "products",
      operation: "delete",
      data: null, // No se necesita data para la eliminación
      localId: productToDelete.value.id,
      firestoreId: productToDelete.value.firestoreId, // Necesario para eliminar de Firestore
      timestamp: Date.now(),
    });
    console.log(
      "Eliminación de producto añadida a syncQueue. Producto firestoreId:",
      productToDelete.value.firestoreId,
    );

    alert("Producto eliminado exitosamente. Se sincronizará pronto.");
    cancelDeleteProduct();

    // Forzar sincronización y luego actualizar la lista de productos
    store.dispatch("startSyncAnimation");
    await forceSync(); // Esperar a que la sincronización termine
    await store.dispatch("products/fetchProducts"); // Volver a cargar productos después de la sincronización
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    alert("Error al eliminar producto. Revisa la consola.");
  }
};

const cancelDeleteProduct = () => {
  showDeleteConfirmModal.value = false;
  productToDelete.value = null;
  deleteConfirmationInput.value = ""; // Limpiar el input de confirmación
};

// --- Lifecycle Hook ---
onMounted(() => {
  store.dispatch("products/fetchProducts"); // Cargar productos al montar el componente
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

.products-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.products-table th,
.products-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 191, 255, 0.15);
  color: #e0e0e0;
}

.products-table th {
  background-color: rgba(0, 191, 255, 0.1);
  color: #a7f3d0;
  font-family: "Orbitron", sans-serif;
  font-weight: 500;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.products-table tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.1);
}

.products-table tbody tr:hover {
  background-color: rgba(0, 191, 255, 0.08);
}

.products-table td {
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
  .products-table {
    min-width: 400px;
  }
  .products-table th,
  .products-table td {
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
  .products-table {
    min-width: 300px;
  }
  .products-table th,
  .products-table td {
    padding: 8px 10px;
    font-size: 0.75em;
  }
  .receipt-preview {
    font-size: 0.8em;
  }
}
</style>
