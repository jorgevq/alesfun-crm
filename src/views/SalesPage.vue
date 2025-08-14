<template>
  <div class="page-container">
    <h1 class="page-title">Gestión de Ventas y Pagos</h1>

    <!-- Selección de Cliente -->
    <div class="client-selection-section card">
      <h2 class="section-title">Seleccionar Cliente</h2>
      <div class="input-group">
        <label for="client-search">Buscar Cliente (Nombre o CI):</label>
        <input
          type="text"
          id="client-search"
          v-model="clientSearchTerm"
          @input="searchClients"
          placeholder="Escribe para buscar..."
          class="input-field"
          :disabled="transactionProcessing"
        />
        <ul
          v-if="clientSuggestions.length && clientSearchTerm.length > 2"
          class="suggestions-list"
        >
          <li
            v-for="client in clientSuggestions"
            :key="client.firestoreId"
            @click="selectClient(client)"
          >
            {{ client.nombre }} (CI: {{ client.ci }})
          </li>
        </ul>
      </div>

      <div v-if="selectedClient" class="selected-client-info">
        <h3>Cliente Seleccionado:</h3>
        <p><strong>Nombre:</strong> {{ selectedClient.nombre }}</p>
        <p><strong>CI:</strong> {{ selectedClient.ci }}</p>
        <p><strong>Celular:</strong> {{ selectedClient.celular || "N/A" }}</p>
        <p>
          <strong>Saldo Actual:</strong>
          <span
            :class="{
              'saldo-positivo': selectedClient.saldoActual <= 0,
              'saldo-negativo': selectedClient.saldoActual > 0,
            }"
          >
            {{ formatCurrency(selectedClient.saldoActual) }}
          </span>
        </p>
        <div class="button-group">
          <button
            class="btn secondary small"
            @click="clearClientSelection"
            :disabled="transactionProcessing"
          >
            Cambiar Cliente
          </button>
          <!-- El botón "Ver Último Recibo" se mantiene, pero solo visible si hay un recibo y no hay transacción en curso -->
          <button
            v-if="lastReceiptText && !transactionProcessing"
            class="btn info-btn small"
            @click="toggleReceiptVisibility"
          >
            {{ showLastReceipt ? "Ocultar Recibo" : "Ver Último Recibo" }}
          </button>
        </div>
      </div>
      <p v-else class="no-data-message">
        Por favor, selecciona un cliente para continuar.
      </p>
    </div>

    <div v-if="selectedClient">
      <!-- Modo "Solo Pago a Cuenta" -->
      <div class="payment-mode-toggle card">
        <label class="toggle-switch">
          <input
            type="checkbox"
            v-model="isPaymentOnlyMode"
            :disabled="transactionProcessing"
          />
          <span class="slider round"></span>
        </label>
        <span>Modo "Solo Pago a Cuenta"</span>
      </div>

      <!-- Sección de Productos (visible solo si NO es modo "Solo Pago a Cuenta") -->
      <div v-if="!isPaymentOnlyMode" class="product-section card">
        <h2 class="section-title">Añadir Productos a la Venta</h2>
        <div class="input-group">
          <label for="product-search">Buscar Producto (Nombre o Código):</label>
          <input
            type="text"
            id="product-search"
            v-model="productSearchTerm"
            @input="searchProducts"
            @focus="handleProductInputFocus"
            @blur="handleProductInputBlur"
            placeholder="Escribe para buscar..."
            class="input-field"
            :disabled="transactionProcessing"
          />
          <ul
            v-if="
              (productSuggestions.length && productSearchTerm.length >= 0) ||
              productInputFocused
            "
            class="suggestions-list"
          >
            <li
              v-for="product in productSuggestions"
              :key="product.firestoreId"
              @click="addProductToCart(product)"
            >
              {{ product.nombre }} (Stock: {{ product.stock }}, Precio:
              {{ formatCurrency(product.precio) }})
            </li>
          </ul>
        </div>

        <div v-if="cartItems.length" class="cart-items-container">
          <h3>Productos en el Carrito:</h3>
          <!-- Tabla de carrito optimizada para móvil -->
          <div class="responsive-table">
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>P. Unit.</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in cartItems"
                  :key="item.product.firestoreId"
                >
                  <td>{{ item.product.nombre }}</td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.cantidad"
                      min="1"
                      @change="updateCartItem(index)"
                      class="quantity-input"
                      :disabled="transactionProcessing"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.precioUnitario"
                      min="0.01"
                      step="0.01"
                      @change="updateCartItem(index)"
                      class="price-input"
                      :disabled="transactionProcessing"
                    />
                  </td>
                  <td>{{ formatCurrency(item.subtotal) }}</td>
                  <td>
                    <button
                      class="btn small delete-btn"
                      @click="removeProductFromCart(index)"
                      :disabled="transactionProcessing"
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
                        class="feather feather-x"
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
        <p v-else class="no-data-message">No hay productos en el carrito.</p>
      </div>

      <!-- Resumen de Pago y Registro -->
      <div class="payment-summary-section card">
        <h2 class="section-title">Resumen de Pago</h2>
        <p v-if="!isPaymentOnlyMode">
          <strong>Total Venta:</strong> {{ formatCurrency(totalSale) }}
        </p>
        <p>
          <strong
            >Saldo Pendiente del Cliente (antes de esta transacción):</strong
          >
          {{ formatCurrency(selectedClient.saldoActual) }}
        </p>
        <p>
          <strong>Total a Pagar (Venta + Saldo Ant.):</strong>
          <span class="text-lime-400 font-bold">{{
            formatCurrency(totalAmountOwed)
          }}</span>
        </p>

        <div class="input-group">
          <label for="amount-paid">Monto de Pago (Bs):</label>
          <input
            type="number"
            id="amount-paid"
            v-model.number="amountPaid"
            min="0"
            step="0.01"
            required
            class="input-field"
            :disabled="transactionProcessing"
          />
        </div>

        <p v-if="changeAmount > 0">
          <strong>Cambio a Devolver:</strong>
          <span class="text-blue-400 font-bold">{{
            formatCurrency(changeAmount)
          }}</span>
        </p>
        <p>
          <strong>Nuevo Saldo del Cliente:</strong>
          <span
            :class="{
              'saldo-positivo': newClientBalance <= 0,
              'saldo-negativo': newClientBalance > 0,
            }"
            class="font-bold"
          >
            {{ formatCurrency(newClientBalance) }}
          </span>
        </p>

        <div class="button-group">
          <button
            class="btn primary"
            @click="registerTransaction"
            :disabled="
              !canRegisterTransaction || transactionProcessing || saleIsFinished
            "
          >
            Registrar {{ isPaymentOnlyMode ? "Pago" : "Venta y Pago" }}
          </button>
          <!-- El botón "Limpiar Transacción" se elimina, ya que la limpieza es automática -->
        </div>

        <!-- INDICADOR DE CARGA AGREGADO AQUÍ -->
        <div v-if="transactionProcessing" class="loading-indicator">
          <div class="spinner"></div>
          <span>Procesando transacción...</span>
        </div>

        <!-- Mensaje de estado de la transacción -->
        <div v-if="transactionMessage" :class="transactionMessageType">
          {{ transactionMessage }}
        </div>
      </div>

      <!-- Último Recibo Generado (ahora controlado por showLastReceipt) -->
      <div
        class="last-receipt-section card"
        v-if="lastReceiptText && showLastReceipt"
      >
        <h2 class="section-title">Último Recibo Generado</h2>
        <pre class="receipt-preview">{{ lastReceiptText }}</pre>
        <div class="button-group">
          <button class="btn primary small" @click="copyReceiptToClipboard">
            Copiar Recibo
          </button>
          <button class="btn secondary small" @click="sendReceiptViaWhatsApp">
            Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import db from "@/utils/db";
import {
  formatCurrency,
  generateWhatsAppLink,
  generateReceiptText,
} from "@/utils/helpers";
import { forceSync } from "@/utils/syncService";

const store = useStore();
const router = useRouter();

// --- Client ---
const clientSearchTerm = ref("");
const clientSuggestions = ref([]);
const selectedClient = ref(null);

// --- Products (for normal Sale mode) ---
const productSearchTerm = ref("");
const productSuggestions = ref([]);
const cartItems = ref([]); // { product: {}, cantidad: N, precioUnitario: N, subtotal: N }
const productInputFocused = ref(false); // New: to control input focus for product search

// --- Transaction ---
const isPaymentOnlyMode = ref(false);
const amountPaid = ref(0);
const lastReceiptText = ref(""); // To store the last generated receipt
const saleIsFinished = ref(false);

// Nuevos estados para el feedback visual
const transactionProcessing = ref(false); // Para deshabilitar el botón y mostrar que se está procesando
const transactionMessage = ref(null); // Mensaje a mostrar al usuario
const transactionMessageType = ref(null); // Clase CSS para el tipo de mensaje (éxito/error)
const showLastReceipt = ref(false); // Nuevo estado para controlar la visibilidad del recibo

// --- Computed Properties ---
const allClients = computed(() => store.getters["clients/getClients"]);
const allProducts = computed(() => store.getters["products/getProducts"]);

const totalSale = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.subtotal, 0);
});

const totalAmountOwed = computed(() => {
  if (!selectedClient.value) return 0;
  if (isPaymentOnlyMode.value) {
    return selectedClient.value.saldoActual;
  } else {
    return selectedClient.value.saldoActual + totalSale.value;
  }
});

const changeAmount = computed(() => {
  const diff = amountPaid.value - totalAmountOwed.value;
  return diff > 0 ? diff : 0;
});

const newClientBalance = computed(() => {
  if (!selectedClient.value) return 0;
  let calculatedBalance = totalAmountOwed.value - amountPaid.value;
  return calculatedBalance > 0 ? calculatedBalance : 0;
});

const canRegisterTransaction = computed(() => {
  if (!selectedClient.value) return false;
  if (isPaymentOnlyMode.value) {
    return amountPaid.value > 0;
  } else {
    // Permite la venta con stock 0, solo requiere que haya items en el carrito y un monto pagado válido
    return cartItems.value.length > 0 && amountPaid.value >= 0;
  }
});

// --- Watchers ---
watch(isPaymentOnlyMode, (newValue) => {
  if (newValue) {
    cartItems.value = []; // Clear cart if switching to payment only mode
  }
});

// --- Métodos de Cliente ---
const searchClients = () => {
  if (clientSearchTerm.value.length < 3) {
    clientSuggestions.value = [];
    return;
  }
  const lowerCaseSearchTerm = clientSearchTerm.value.toLowerCase();
  clientSuggestions.value = allClients.value
    .filter(
      (client) =>
        client.firestoreId &&
        (client.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
          client.ci.toLowerCase().includes(lowerCaseSearchTerm)),
    )
    .slice(0, 3);
};

const selectClient = (client) => {
  selectedClient.value = client;
  clientSearchTerm.value = client.nombre;
  clientSuggestions.value = [];
};

const clearClientSelection = () => {
  selectedClient.value = null;
  clientSearchTerm.value = "";
  clearTransaction(true); // <--- Aquí se llama con 'true' para borrar el recibo
};

// --- Product Search and Add ---
const searchProducts = () => {
  const lowerCaseSearchTerm = productSearchTerm.value.toLowerCase();
  if (lowerCaseSearchTerm.length === 0) {
    // Muestra todos los productos si el campo está vacío
    productSuggestions.value = allProducts.value.slice(0, 10); // Limita a 10 para evitar saturación
    return;
  }
  productSuggestions.value = allProducts.value
    .filter(
      (product) =>
        product.firestoreId &&
        (product.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
          product.codigo.toLowerCase().includes(lowerCaseSearchTerm)),
    )
    .slice(0, 10); // Limita sugerencias de búsqueda
};

const handleProductInputFocus = () => {
  productInputFocused.value = true;
  // Si el campo está vacío al enfocar, muestra los primeros productos
  if (productSearchTerm.value.length === 0) {
    searchProducts();
  }
};

const handleProductInputBlur = () => {
  // Retraso para permitir que se registre un clic en una sugerencia antes de ocultar la lista
  setTimeout(() => {
    productInputFocused.value = false;
  }, 150);
};

const addProductToCart = (product) => {
  const plainProduct = JSON.parse(JSON.stringify(product));

  const existingItem = cartItems.value.find(
    (item) => item.product.firestoreId === plainProduct.firestoreId,
  );
  if (existingItem) {
    existingItem.cantidad++;
    existingItem.subtotal = existingItem.cantidad * existingItem.precioUnitario;
  } else {
    cartItems.value.push({
      product: plainProduct,
      cantidad: 1,
      precioUnitario: plainProduct.precio,
      subtotal: plainProduct.precio,
    });
  }
  productSearchTerm.value = "";
  productSuggestions.value = []; // Limpiar sugerencias después de añadir al carrito
};

const updateCartItem = (index) => {
  const item = cartItems.value[index];
  if (item.cantidad <= 0 || isNaN(item.cantidad)) {
    // Asegurar cantidad válida
    removeProductFromCart(index);
  } else {
    item.subtotal = item.cantidad * item.precioUnitario;
  }
};

const removeProductFromCart = (index) => {
  cartItems.value.splice(index, 1);
};

// --- Transaction Registration ---
const registerTransaction = async () => {
  // Verificación para evitar múltiples ejecuciones si ya se está procesando
  if (transactionProcessing.value) {
    console.warn("Transacción ya en curso. Ignorando clic adicional.");
    return;
  }

  // Deshabilitar el botón de inmediato para prevenir múltiples clics.
  transactionProcessing.value = true;
  transactionMessage.value = null; // Limpiar cualquier mensaje previo.
  transactionMessageType.value = null;

  if (!selectedClient.value) {
    // Usar el sistema de mensajes de la UI en lugar de alert()
    transactionMessage.value = "Por favor, selecciona un cliente primero.";
    transactionMessageType.value = "error-message";
    transactionProcessing.value = false; // Habilitar el botón si la validación falla instantáneamente.
    return;
  }
  if (!canRegisterTransaction.value) {
    // Usar el sistema de mensajes de la UI en lugar de alert()
    transactionMessage.value =
      "Verifica que el monto de pago sea válido y que haya productos en el carrito si es una venta.";
    transactionMessageType.value = "error-message";
    transactionProcessing.value = false; // Habilitar el botón si la validación falla instantáneamente.
    return;
  }

  try {
    let movement = {
      firestoreId: null,
      fecha: Date.now(),
      clienteId: selectedClient.value.id, // Usar el ID local de Dexie para el movimiento
      clienteFirestoreId: selectedClient.value.firestoreId,
      clienteNombre: selectedClient.value.nombre,
      clienteCi: selectedClient.value.ci,
      type: isPaymentOnlyMode.value ? "pago" : "venta",
      monto: isPaymentOnlyMode.value ? amountPaid.value : totalSale.value, // Monto de la venta o del pago
      montoPago: amountPaid.value, // Monto que realmente pagó el cliente
      saldoAnterior: selectedClient.value.saldoActual,
      newBalance: newClientBalance.value,
      cambio: changeAmount.value,
      ventaItems: isPaymentOnlyMode.value
        ? []
        : cartItems.value.map((item) => ({
            productId: item.product.firestoreId,
            productNombre: item.product.nombre, // Aseguramos que el nombre esté aquí
            codigo: item.product.codigo,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
          })),
      syncStatus: "pending",
    };

    // 1. Add movement to IndexedDB
    const localMovementId = await db.movements.add(movement);
    console.log("Movimiento añadido a IndexedDB con ID:", localMovementId);

    // 2. Update client balance in IndexedDB and UI immediately
    const updatedClientData = {
      ...selectedClient.value,
      saldoActual: newClientBalance.value,
      updatedAt: Date.now(), // Actualizar timestamp
      syncStatus: "pending",
    };
    await db.clients.update(
      selectedClient.value.id, // Usar el ID local de Dexie para actualizar
      updatedClientData,
    );
    // Actualizar el ref selectedClient para que la UI se actualice inmediatamente
    selectedClient.value.saldoActual = newClientBalance.value;
    console.log(
      "Cliente actualizado en IndexedDB:",
      selectedClient.value.id,
      "Nuevo Saldo:",
      newClientBalance.value,
    );

    // 3. Update product stock in IndexedDB (if it's a sale) and UI immediately
    if (!isPaymentOnlyMode.value) {
      for (const item of cartItems.value) {
        const productInDb = await db.products.get(item.product.id); // Obtener el producto por su ID local de Dexie
        if (productInDb) {
          const newStock = productInDb.stock - item.cantidad;
          const updatedProductData = {
            ...productInDb,
            stock: newStock,
            updatedAt: Date.now(), // Actualizar timestamp
            syncStatus: "pending",
          };
          await db.products.update(
            productInDb.id, // Usar el ID local de Dexie para actualizar
            updatedProductData,
          );
          console.log(
            `Stock de ${item.product.nombre} actualizado a ${newStock}`,
          );

          // Disparar la mutación para actualizar el estado de Vuex inmediatamente
          store.commit("products/UPDATE_PRODUCT_STOCK", {
            firestoreId: productInDb.firestoreId,
            newStock: newStock,
          });

          // Add product update to sync queue
          await db.syncQueue.add({
            collectionName: "products",
            operation: "update",
            data: { ...updatedProductData, id: productInDb.firestoreId }, // Usar firestoreId para la data de Firestore
            localId: productInDb.id, // ID local de Dexie
            firestoreId: productInDb.firestoreId,
            timestamp: Date.now(),
          });
        }
      }
    }

    // 4. Add to sync queue for movements and client
    await db.syncQueue.add({
      collectionName: "movements",
      operation: "add",
      data: { ...movement, id: undefined }, // Firebase no necesita 'id' autoincremental de Dexie
      localId: localMovementId,
      firestoreId: null, // Será null hasta que Firebase lo asigne
      timestamp: Date.now(),
    });

    await db.syncQueue.add({
      collectionName: "clients",
      operation: "update",
      data: { ...updatedClientData, id: selectedClient.value.firestoreId }, // Usar firestoreId para la data de Firestore
      localId: selectedClient.value.id, // ID local de Dexie
      firestoreId: selectedClient.value.firestoreId,
      timestamp: Date.now(),
    });

    // 5. Generate and display receipt
    // Es crucial que fetchMovements se haya completado para que last3Movements esté actualizado
    await store.dispatch("sales/fetchMovements"); // Asegurarse de tener los últimos movimientos antes de generar el recibo

    const receiptData = {
      clientName: selectedClient.value.nombre,
      clientCi: selectedClient.value.ci,
      type: movement.type === "venta" ? "Venta" : "P. a/c",
      amountPaid: movement.montoPago,
      totalSale: totalSale.value, // Aseguramos que totalSale se pase
      change: changeAmount.value, // Aseguramos que changeAmount se pase
      prevBalance: movement.saldoAnterior,
      newBalance: movement.newBalance,
      items: movement.ventaItems,
      last3Movements: store.getters["sales/getLast3MovementsByClient"](
        selectedClient.value.firestoreId,
      ),
    };
    lastReceiptText.value = generateReceiptText(receiptData);

    // Mostrar mensaje de éxito temporal
    transactionMessage.value =
      "Transacción registrada exitosamente. Sincronizando...";
    transactionMessageType.value = "success-message";
    showLastReceipt.value = true; // Mostrar el recibo automáticamente al finalizar

    // Iniciar animación de sincronización
    store.dispatch("startSyncAnimation");

    // Ejecutar sincronización y esperar a que termine para actualizar el mensaje
    try {
      await forceSync(); // Espera a que la sincronización termine
      transactionMessage.value =
        "Transacción registrada y sincronizada con éxito.";
      transactionMessageType.value = "success-message";
    } catch (syncError) {
      console.error("Error durante la sincronización:", syncError);
      transactionMessage.value =
        "Transacción registrada, pero la sincronización falló. Intenta de nuevo.";
      transactionMessageType.value = "error-message";
    }
  } catch (error) {
    console.error("Error al registrar transacción:", error);
    transactionMessage.value =
      "Error al registrar transacción. Revisa la consola.";
    transactionMessageType.value = "error-message";
  } finally {
    saleIsFinished.value = true; //  NUEVA LÍNEA
    transactionProcessing.value = false;
    // Ocultar mensaje después de un tiempo y luego limpiar la transacción automáticamente
    if (transactionMessageType.value !== "error-message") {
      setTimeout(() => {
        transactionMessage.value = null;
        clearTransaction(false);
      }, 5000); // Mensaje visible por 5 segundos
    }
  }
};

const clearTransaction = (clearReceipt = false) => {
  // <--- Valor por defecto cambiado a 'false'
  cartItems.value = [];
  amountPaid.value = 0;
  isPaymentOnlyMode.value = false;
  if (clearReceipt) {
    lastReceiptText.value = "";
    showLastReceipt.value = false; // Resetear visibilidad al limpiar transacción
  }
  // --- AÑADIR ESTA LÍNEA ---
  saleIsFinished.value = false;
  // -------------------------
  // Asegurarse de re-cargar clientes y productos para reflejar los últimos saldos/stocks
  store.dispatch("clients/fetchClients");
  store.dispatch("products/fetchProducts");
  store.dispatch("sales/fetchMovements"); // Recargar movimientos para que el getter tenga los datos más recientes
};

// --- Receipt Actions ---
const toggleReceiptVisibility = () => {
  showLastReceipt.value = !showLastReceipt.value;
};

const copyReceiptToClipboard = () => {
  const textarea = document.createElement("textarea");
  textarea.value = lastReceiptText.value;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    // Usar la variable de mensaje de la UI en lugar de alert()
    transactionMessage.value = "Recibo copiado al portapapeles.";
    transactionMessageType.value = "success-message";
    setTimeout(() => {
      transactionMessage.value = null;
    }, 3000);
  } catch (err) {
    console.error("Error al copiar al portapapeles:", err);
    // Usar la variable de mensaje de la UI en lugar de alert()
    transactionMessage.value =
      "No se pudo copiar el recibo. Por favor, cópialo manualmente.";
    transactionMessageType.value = "error-message";
  } finally {
    document.body.removeChild(textarea);
  }
};

const sendReceiptViaWhatsApp = () => {
  if (!selectedClient.value || !selectedClient.value.celular) {
    // Usar la variable de mensaje de la UI en lugar de alert()
    transactionMessage.value =
      "Por favor, selecciona un cliente con un número de celular para enviar el recibo.";
    transactionMessageType.value = "error-message";
    return;
  }
  if (!lastReceiptText.value) {
    // Usar la variable de mensaje de la UI en lugar de alert()
    transactionMessage.value = "No hay un recibo generado para enviar.";
    transactionMessageType.value = "error-message";
    return;
  }
  const whatsappLink = generateWhatsAppLink(
    selectedClient.value.celular,
    lastReceiptText.value,
  );
  window.open(whatsappLink, "_blank");
};

// --- Component Lifecycle ---
onMounted(async () => {
  await store.dispatch("clients/fetchClients");
  await store.dispatch("products/fetchProducts");
  await store.dispatch("sales/fetchMovements"); // Asegurarse de cargar movimientos al inicio

  // Check for client ID in route query (e.g., from DebtorsPage)
  if (router.currentRoute.value.query.clientId) {
    const clientId = router.currentRoute.value.query.clientId;
    const client = allClients.value.find((c) => c.firestoreId === clientId);
    if (client) {
      selectClient(client);
    }
  }
});
</script>

<style scoped>
/* Fuentes (ya deberían estar en global.css, pero se mantienen aquí para este componente) */
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

/* Estilos generales de la página */
.page-container {
  padding: 20px;
  max-width: 900px;
  margin: 20px auto;
  background-color: rgba(0, 0, 0, 0.6); /* Fondo más oscuro y translúcido */
  border-radius: 20px; /* Más redondeado */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7); /* Sombra más pronunciada */
  border: 2px solid rgba(0, 191, 255, 0.4); /* Borde más visible */
  overflow-y: auto; /* Permite el scroll vertical si el contenido excede la altura */
  max-height: calc(
    100vh - 120px
  ); /* Ajusta la altura máxima para no desbordar */
}

.page-title {
  font-family: "Orbitron", sans-serif;
  color: #00bfff; /* Azul neón */
  font-size: 2.8em; /* Más grande */
  text-align: center;
  margin-bottom: 40px;
  text-shadow:
    0 0 15px #00bfff,
    0 0 25px rgba(0, 191, 255, 0.6); /* Glow más intenso */
  letter-spacing: 1.5px;
}

.card {
  background-color: rgba(
    10,
    10,
    20,
    0.8
  ); /* Fondo de tarjeta más oscuro y opaco */
  border-radius: 15px; /* Más redondeado */
  padding: 30px; /* Más padding */
  margin-bottom: 30px; /* Más margen inferior */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); /* Sombra más profunda */
  border: 1px solid rgba(0, 191, 255, 0.3); /* Borde más sutil */
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
  color: #87ceeb; /* Azul cielo claro */
  font-size: 1.8em; /* Más grande */
  margin-bottom: 25px;
  text-align: center;
  text-shadow:
    0 0 8px #87ceeb,
    0 0 15px rgba(135, 206, 235, 0.4); /* Glow azul claro */
}

.input-group {
  margin-bottom: 20px;
  position: relative;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #add8e6; /* Azul claro */
  font-size: 1em; /* Más grande */
  letter-spacing: 0.5px;
}

.input-field {
  width: 100%;
  padding: 12px 15px; /* Más padding */
  border: 2px solid #4682b4; /* Borde más grueso */
  border-radius: 8px; /* Más redondeado */
  background-color: #1a2a3a; /* Fondo oscuro */
  color: #e0e0e0; /* Texto claro */
  font-size: 1.1em; /* Más grande */
  box-sizing: border-box;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.input-field:focus {
  border-color: #00bfff; /* Azul neón al enfocar */
  box-shadow: 0 0 12px rgba(0, 191, 255, 0.6); /* Glow azul al enfocar */
  outline: none;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #1a2a3a;
  border: 1px solid #00bfff; /* Borde azul neón */
  border-radius: 8px;
  list-style: none;
  padding: 0;
  margin-top: 5px;
  max-height: 200px;
  overflow-y: auto; /* Mantener scroll vertical para sugerencias */
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
  background-color: rgba(
    0,
    191,
    255,
    0.3
  ); /* Fondo azul más intenso al pasar el ratón */
  color: white;
}

.selected-client-info {
  background-color: rgba(0, 191, 255, 0.15); /* Fondo azul más visible */
  border: 1px solid rgba(0, 191, 255, 0.5); /* Borde azul más fuerte */
  border-radius: 12px;
  padding: 20px;
  margin-top: 25px;
  text-align: left;
  box-shadow: 0 2px 10px rgba(0, 191, 255, 0.2);
}

.selected-client-info h3 {
  color: #a7f3d0; /* Verde lima para el título del cliente */
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.3em;
  text-shadow: 0 0 5px rgba(167, 243, 208, 0.3);
}

.selected-client-info p {
  margin-bottom: 8px;
  font-size: 1em;
  color: #c0c0c0; /* Gris claro */
}

.selected-client-info p strong {
  color: #e0e0e0; /* Un blanco más puro para las etiquetas */
}

.no-data-message {
  text-align: center;
  margin-top: 25px;
  font-size: 1.1em;
  color: #b0bec5;
  font-style: italic;
}

/* Toggle Switch for Payment Only Mode */
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
  background-color: #4682b4; /* Azul oscuro */
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
  background-color: #00bfff; /* Azul neón cuando está activo */
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

/* Cart Table */
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
  overflow-x: auto; /* Allows horizontal scrolling for the table on small screens */
  -webkit-overflow-scrolling: touch;
  border-radius: 15px;
  border: 1px solid rgba(0, 191, 255, 0.3);
  margin-top: 25px;
  background-color: rgba(10, 10, 20, 0.8);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  overflow-y: hidden; /* Prevents double scroll if table content is tall */
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px; /* Minimum width for the table on mobile */
}

.cart-table th,
.cart-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 191, 255, 0.15);
  color: #e0e0e0;
}

.cart-table th {
  background-color: rgba(0, 191, 255, 0.1);
  color: #a7f3d0;
  font-family: "Orbitron", sans-serif;
  font-weight: 500;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.cart-table tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.1);
}

.cart-table tbody tr:hover {
  background-color: rgba(0, 191, 255, 0.08);
}

.cart-table td {
  font-size: 0.95em;
}

.quantity-input,
.price-input {
  width: 70px; /* Smaller width for quantity/price inputs in table */
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

/* Payment Summary */
.payment-summary-section p {
  margin-bottom: 10px;
  font-size: 1.1em;
  color: #c0c0c0;
}

.payment-summary-section p strong {
  color: #e0e0e0;
}

.saldo-positivo {
  color: #00e676; /* Green neon */
  font-weight: bold;
}

.saldo-negativo {
  color: #ff5252; /* Vibrant red */
  font-weight: bold;
}

.text-lime-400 {
  color: #a7f3d0; /* Tailwind's lime-400 equivalent */
}

.text-blue-400 {
  color: #60a5fa; /* Tailwind's blue-400 equivalent */
}

/* Last Receipt Section */
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

/* Buttons */
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
  padding: 8px 12px; /* Adjusted for icons */
  font-size: 0.85em;
  min-width: unset;
  display: flex;
  justify-content: center;
  align-items: center;
}

.delete-btn {
  background: linear-gradient(45deg, #ff5252, #e04040); /* Red */
  color: white;
  box-shadow: 0 2px 8px rgba(255, 82, 82, 0.3);
}
.delete-btn:hover {
  background: linear-gradient(45deg, #e04040, #ff5252);
  transform: translateY(-1px);
}

.info-btn {
  background: linear-gradient(45deg, #4682b4, #5f9ea0); /* Un azul más suave */
  color: white;
  box-shadow: 0 2px 8px rgba(70, 130, 180, 0.3);
}

.info-btn:hover {
  background: linear-gradient(45deg, #5f9ea0, #4682b4);
  transform: translateY(-1px);
}

/* Estilos para Mensajes de Transacción */
.success-message {
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(0, 230, 118, 0.2); /* Verde claro */
  color: #00e676; /* Texto verde */
  border: 1px solid #00e676;
  border-radius: 10px;
  text-align: center;
  font-weight: bold;
  animation: fadeInOut 5s forwards; /* Animación de fade */
}

.error-message {
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(255, 82, 82, 0.2); /* Rojo claro */
  color: #ff5252; /* Texto rojo */
  border: 1px solid #ff5252;
  border-radius: 10px;
  text-align: center;
  font-weight: bold;
  animation: fadeInOut 5s forwards;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* Media Queries para responsividad */
@media (max-width: 768px) {
  .page-container {
    padding: 15px;
    margin: 10px auto;
    border-radius: 15px;
    max-height: calc(100vh - 100px); /* Ajuste para móviles */
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
    overflow-x: auto; /* Asegura scroll horizontal para la tabla en móviles */
  }
  .cart-table {
    min-width: 400px; /* Asegura que la tabla no se colapse demasiado */
  }
  .cart-table th,
  .cart-table td {
    padding: 10px 12px;
    font-size: 0.85em;
  }
  .quantity-input,
  .price-input {
    width: 60px;
    padding: 5px;
    font-size: 0.8em;
  }
  .receipt-preview {
    padding: 15px;
    font-size: 0.85em;
    max-height: 250px;
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
  .cart-table {
    min-width: 300px;
  }
  .cart-table th,
  .cart-table td {
    padding: 8px 10px;
    font-size: 0.75em;
  }
  .receipt-preview {
    font-size: 0.8em;
  }
}
</style>
