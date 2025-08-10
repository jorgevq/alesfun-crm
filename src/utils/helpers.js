// src/utils/helpers.js

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Formatea un valor numérico a formato de moneda boliviana (Bs).
 * @param {number} value - El valor numérico a formatear.
 * @returns {string} El valor formateado como moneda.
 */
export const formatCurrency = (value) => {
  if (typeof value !== "number" || isNaN(value)) {
    return "Bs 0,00"; // Valor por defecto si no es un número válido
  }
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB", // Moneda de Bolivia
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatea una fecha a un formato legible (DD/MM/YYYY).
 * @param {number|Date|string} dateInput - La fecha a formatear.
 * @param {boolean} includeTime - Si se debe incluir la hora en el formato.
 * @returns {string} La fecha formateada.
 */
export const formatDate = (dateInput, includeTime = false) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.second = "2-digit";
    options.hour12 = true;
  }

  return date.toLocaleString("es-BO", options);
};

/**
 * Formatea una cadena de texto a MAYÚSCULAS y elimina tildes.
 * Útil para campos como CI, Nombre, Dirección.
 * @param {string} data - La cadena de texto a formatear.
 * @returns {string} La cadena formateada.
 */
export const formatInputData = (data) => {
  if (typeof data !== "string") {
    return "";
  }
  return data
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

/**
 * Genera un enlace de WhatsApp para enviar un mensaje predefinido.
 * @param {string} phoneNumber - El número de teléfono del destinatario.
 * @param {string} message - El mensaje a enviar.
 * @returns {string} El enlace de WhatsApp.
 */
export const generateWhatsAppLink = (phoneNumber, message) => {
  // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
  // Codificar el mensaje para la URL
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhoneNumber}?text=${encodedMessage}`;
};

/**
 * Genera el texto plano de un recibo de venta o pago.
 * @param {object} receiptData - Datos para generar el recibo.
 * @param {string} receiptData.clientName - Nombre del cliente.
 * @param {string} receiptData.clientCi - CI del cliente.
 * @param {string} receiptData.type - Tipo de movimiento ('Venta' o 'P. a/c').
 * @param {number} receiptData.amountPaid - Monto pagado.
 * @param {number} receiptData.prevBalance - Saldo anterior del cliente.
 * @param {number} receiptData.newBalance - Nuevo saldo del cliente.
 * @param {Array} [receiptData.items=[]] - Array de productos vendidos (solo para ventas).
 * @param {number} [receiptData.totalSale=0] - Total de la venta (solo para ventas).
 * @param {number} [receiptData.change=0] - Cambio a devolver (solo para ventas al contado).
 * @param {Array} [receiptData.last3Movements=[]] - Array de los últimos 5 movimientos del cliente.
 * @returns {string} El texto plano del recibo.
 */
export const generateReceiptText = (receiptData) => {
  const {
    clientName,
    clientCi,
    type, // 'Venta' o 'P. a/c'
    amountPaid,
    prevBalance,
    newBalance,
    items = [],
    totalSale = 0,
    // change = 0, // 'change' ya no se usa directamente desde receiptData para el resumen principal
    last3Movements = [],
  } = receiptData;

  const date = new Date().toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  let receipt = `--- RECIBO ALESFUN ---\n`;
  receipt += `Fecha: ${date}\n`;
  receipt += `Cliente: ${clientName} (CI: ${clientCi})\n`;
  receipt += `---------------------\n`;

  // Determinar el encabezado del tipo de transacción
  let transactionTypeHeader = "";
  if (type === "Venta") {
    transactionTypeHeader = "Venta";
    if ((prevBalance || 0) > 0) {
      // Si hay saldo anterior, es "Venta y Cobro de Saldo"
      transactionTypeHeader += " y Cobro de Saldo";
    }
  } else if (type === "P. a/c") {
    transactionTypeHeader = "Pago a Cuenta";
  }
  receipt += `Tipo: ${transactionTypeHeader}\n`;

  // Sección de Detalle de Venta (solo para ventas)
  if (type === "Venta" && items.length > 0) {
    receipt += `\nDetalle de Venta:\n`; // Etiqueta cambiada
    items.forEach((item) => {
      receipt += `  ${item.productNombre || "Producto Desconocido"} x${item.cantidad || 0} - ${formatCurrency(
        item.subtotal || 0,
      )}\n`;
    });
    receipt += `Total Venta Actual: ${formatCurrency(totalSale)}\n`; // Etiqueta cambiada
  }

  receipt += `---------------------\n`;

  // Sección de Resumen de Pago
  const totalAPagar = totalSale + prevBalance; // Calcular aquí
  const calculatedChangeForSummary = amountPaid - totalAPagar; // RECALCULADO AQUÍ PARA CONSISTENCIA

  receipt += `Resumen de Pago:\n`;
  receipt += `  Saldo Pendiente Anterior: ${formatCurrency(prevBalance)}\n`; // Etiqueta cambiada
  receipt += `  Total a Pagar (Venta + Saldo): ${formatCurrency(totalAPagar)}\n`; // Etiqueta y cálculo
  receipt += `  Monto Recibido: ${formatCurrency(amountPaid)}\n`;
  receipt += `  Su Cambio: ${formatCurrency(calculatedChangeForSummary > 0 ? calculatedChangeForSummary : 0)}\n`; // USAMOS EL CAMBIO RECALCULADO
  receipt += `---------------------\n`;
  receipt += `Nuevo Saldo Pendiente: ${formatCurrency(newBalance)}\n`; // Etiqueta cambiada
  receipt += `---------------------\n`;

  // Sección de Últimos 3 Movimientos
  if (last3Movements.length > 0) {
    receipt += `--- Últimos 3 Movimientos ---\n`;
    last3Movements.forEach((mov) => {
      const movDate = formatDate(mov.fecha);
      const movTypeChar = mov.type === "venta" ? "V" : "P"; // 'V' para Venta, 'P' para Pago

      // Asegurar valores por defecto para evitar errores si las propiedades no existen
      const movMonto = mov.monto || 0;
      const movMontoPago = mov.montoPago || 0;
      const movNewBalance = mov.newBalance || 0;

      const displayAmount = mov.type === "venta" ? movMonto : movMontoPago;

      let movDetail = "";
      if (mov.type === "venta" && mov.ventaItems && mov.ventaItems.length > 0) {
        movDetail = `D: ${mov.ventaItems.map((item) => `${item.productNombre || "Prod."} x${item.cantidad || 0}`).join(", ")}`;
      } else if (mov.type === "pago") {
        movDetail = `D: Pago a cuenta`; // Formato más coherente
      }

      let additionalInfo = "";
      if ((mov.cambio || 0) > 0) {
        // Usamos mov.cambio directamente
        additionalInfo = `| C: ${formatCurrency(mov.cambio)}`;
      } else if (movNewBalance === 0 && mov.type === "venta") {
        additionalInfo = " (Pago Total)";
      } else if (movNewBalance > 0 && mov.type === "venta") {
        additionalInfo = `| Saldo: ${formatCurrency(movNewBalance)}`;
      }

      receipt += `${movDate} | ${movTypeChar}: ${formatCurrency(displayAmount)} | ${movDetail}${additionalInfo}\n`;
    });
    receipt += `---------------------\n`;
  }

  receipt += `¡Gracias por tu preferencia!\n`;
  receipt += `ALESFUN\n`;
  receipt += `Soldadura de alta calidad\n`;
  receipt += `Para uniones resistentes y confiables.\n`;

  return receipt;
};

/**
 * Exporta una lista de objetos a un archivo Excel (.xlsx).
 * @param {Array<Object>} data - Array de objetos a exportar.
 * @param {string} fileName - Nombre del archivo sin extensión (ej. "Clientes").
 * @param {Array<Object>} headers - Opcional. Array de objetos { key: 'propiedad', title: 'Título Columna' } para definir columnas y sus títulos.
 */
export const exportToExcel = (data, fileName, headers = null) => {
  if (!data || data.length === 0) {
    console.warn("No hay datos para exportar.");
    // Eliminado alert() para evitar problemas en el entorno de desarrollo
    return;
  }

  let worksheetData = data;
  if (headers) {
    worksheetData = data.map((item) => {
      const row = {};
      headers.forEach((header) => {
        row[header.title] = item[header.key];
      });
      return row;
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  if (headers) {
    const wsCols = headers.map((header) => ({ wch: header.title.length + 5 }));
    worksheet["!cols"] = wsCols;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, fileName);

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });
  saveAs(dataBlob, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
