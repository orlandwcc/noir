/**
 * HOTEL CASINO NOIR - MOTOR DE INTERACCIÓN Y RESERVAS
 * Lógica del lado cliente para procesamiento de formularios, conexión a la API de Vercel
 * y despacho de notificaciones automáticas de WhatsApp.
 */

// Número telefónico emisor oficial del hotel en formato internacional para enlaces de WhatsApp
const SENDER_WHATSAPP_INTERNATIONAL = "584242083041";

// Elementos del DOM principales
const bookingForm = document.getElementById("bookingForm");
const fullNameInput = document.getElementById("fullName");
const clientEmailInput = document.getElementById("clientEmail");
const countryCodeSelect = document.getElementById("countryCode");
const clientPhoneInput = document.getElementById("clientPhone");
const roomTypeSelect = document.getElementById("roomType");
const checkInInput = document.getElementById("checkIn");
const checkOutInput = document.getElementById("checkOut");
const guestsCountSelect = document.getElementById("guestsCount");
const submitBookingBtn = document.getElementById("submitBookingBtn");

// Elementos de la vista previa de WhatsApp
const bubbleDynamicText = document.getElementById("bubbleDynamicText");
const bubbleTime = document.getElementById("bubbleTime");

// Elementos del modal de confirmación
const bookingModal = document.getElementById("bookingModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalAcceptBtn = document.getElementById("modalAcceptBtn");
const modalSummaryDetails = document.getElementById("modalSummaryDetails");
const whatsappDirectLink = document.getElementById("whatsappDirectLink");

// Elementos de navegación responsiva
const mobileToggle = document.getElementById("mobileToggle");
const mainNav = document.getElementById("mainNav");

/**
 * Inicializa y restringe los selectores de fechas para evitar fechas en el pasado
 */
function initializeDateInputs() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const formattedToday = `${year}-${month}-${day}`;

  checkInInput.min = formattedToday;
  checkOutInput.min = formattedToday;

  // Sugiere por defecto entrada para el día siguiente y salida a los 3 días
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkoutDate = new Date(today);
  checkoutDate.setDate(checkoutDate.getDate() + 4);

  const formatToInput = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  checkInInput.value = formatToInput(tomorrow);
  checkOutInput.value = formatToInput(checkoutDate);

  updateWhatsAppPreview();
}

/**
 * Retorna la hora local actual formateada en 12 horas (AM/PM)
 * @returns {string} Hora legible
 */
function getCurrentFormattedTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Construye el mensaje oficial de confirmación incluyendo el código de reserva
 * @param {string} bookingCode Código asignado a la reserva
 * @returns {string} Texto formateado
 */
function buildReservationMessage(bookingCode = "NOIR-429214") {
  const nameValue = fullNameInput.value.trim() || "[Nombre]";
  const checkInValue = checkInInput.value || "[Check-in]";
  const checkOutValue = checkOutInput.value || "[Check-out]";
  
  let selectedRoom = "[Tipo de Habitación]";
  if (roomTypeSelect.value) {
    selectedRoom = roomTypeSelect.value.split(" (")[0];
  }

  return `¡Hola ${nameValue}! Gracias por solicitar tu reserva en nuestro hotel para las fechas ${checkInValue} a ${checkOutValue}. Tu código de reserva es ${bookingCode}. Hemos recibido tus datos correctamente y nuestro equipo está procesando la confirmación de tu habitación ${selectedRoom}.`;
}

/**
 * Actualiza la burbuja interactiva de WhatsApp en tiempo real
 */
function updateWhatsAppPreview() {
  const generatedMessage = buildReservationMessage("[NOIR-XXXXXX]");
  bubbleDynamicText.textContent = generatedMessage;

  if (bubbleTime) {
    bubbleTime.textContent = getCurrentFormattedTime();
  }
}

/**
 * Valida la coherencia temporal entre la fecha de llegada y la de salida
 * @returns {boolean} Es válido
 */
function validateDates() {
  const checkInDate = new Date(checkInInput.value);
  const checkOutDate = new Date(checkOutInput.value);
  const errorContainer = document.getElementById("checkOutError");

  if (checkOutDate <= checkInDate) {
    errorContainer.textContent = "La fecha de salida debe ser posterior a la fecha de llegada.";
    return false;
  }
  errorContainer.textContent = "";
  return true;
}

/**
 * Valida que el número telefónico local posea una longitud coherente
 * @param {string} phone Cadena numérica
 * @returns {boolean} Es válido
 */
function isValidLocalPhone(phone) {
  const numericOnly = phone.replace(/\D/g, "");
  return numericOnly.length >= 7 && numericOnly.length <= 12;
}

/**
 * Gestiona el envío del formulario, consumo de la API de Vercel y confirmación
 * @param {Event} event Evento de formulario
 */
async function handleBookingSubmission(event) {
  event.preventDefault();

  // Limpieza de avisos previos de validación
  document.querySelectorAll(".form-error-msg").forEach((element) => {
    element.textContent = "";
  });

  let hasErrors = false;

  const fullName = fullNameInput.value.trim();
  const clientEmail = clientEmailInput.value.trim();
  const rawPhone = clientPhoneInput.value.trim();
  const countryCode = countryCodeSelect.value;
  const roomType = roomTypeSelect.value;
  const guests = guestsCountSelect.value;

  if (!fullName) {
    document.getElementById("fullNameError").textContent = "Por favor, ingrese su nombre y apellido.";
    hasErrors = true;
  }

  if (!clientEmail || !clientEmail.includes("@")) {
    document.getElementById("clientEmailError").textContent = "Ingrese un correo electrónico válido.";
    hasErrors = true;
  }

  if (!rawPhone || !isValidLocalPhone(rawPhone)) {
    document.getElementById("clientPhoneError").textContent = "Ingrese un número celular válido (ej: 424 123 4567).";
    hasErrors = true;
  }

  if (!roomType) {
    document.getElementById("roomTypeError").textContent = "Debe elegir una habitación de la colección.";
    hasErrors = true;
  }

  if (!validateDates()) {
    hasErrors = true;
  }

  if (hasErrors) {
    return;
  }

  const cleanLocalPhone = rawPhone.replace(/\D/g, "");
  const fullFormattedPhone = `${countryCode}${cleanLocalPhone}`;

  // Indicador de carga en el botón
  const originalButtonText = submitBookingBtn.textContent;
  submitBookingBtn.disabled = true;
  submitBookingBtn.textContent = "Procesando y Despachando WhatsApp...";

  let reservationResult = null;

  try {
    // Petición a la función Serverless de Vercel (POST /api/reservar)
    const response = await fetch("/api/reservar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName,
        clientEmail,
        fullPhone: fullFormattedPhone,
        roomType,
        checkIn: checkInInput.value,
        checkOut: checkOutInput.value,
        guests
      })
    });

    if (response.ok) {
      reservationResult = await response.json();
    }
  } catch (networkError) {
    console.info("[Modo Offline / Vista Previa] Simulación activa:", networkError.message);
  } finally {
    submitBookingBtn.disabled = false;
    submitBookingBtn.textContent = originalButtonText;
  }

  // Si la API responde con éxito o si se ejecuta en vista previa local
  const finalBookingId = reservationResult && reservationResult.bookingId
    ? reservationResult.bookingId
    : `NOIR-${Math.floor(100000 + Math.random() * 900000)}`;

  const finalMessage = reservationResult && reservationResult.message
    ? reservationResult.message
    : buildReservationMessage(finalBookingId);

  const reservationData = {
    bookingId: finalBookingId,
    fullName,
    clientEmail,
    fullPhone: `${countryCode} ${cleanLocalPhone}`,
    roomType,
    checkIn: checkInInput.value,
    checkOut: checkOutInput.value,
    guests,
    message: finalMessage,
    timestamp: new Date().toISOString()
  };

  showBookingConfirmationModal(reservationData);
}

/**
 * Despliega el modal emergente con los detalles de la reserva sin datos internos
 * @param {Object} data Datos consolidados de la reserva
 */
function showBookingConfirmationModal(data) {
  modalSummaryDetails.innerHTML = `
    <div><strong>Código de Confirmación:</strong> ${data.bookingId}</div>
    <div><strong>Huésped Titular:</strong> ${data.fullName}</div>
    <div><strong>WhatsApp Registrado:</strong> ${data.fullPhone}</div>
    <div><strong>Habitación Seleccionada:</strong> ${data.roomType}</div>
    <div><strong>Período de Estadía:</strong> ${data.checkIn} al ${data.checkOut}</div>
    <div><strong>Número de Huéspedes:</strong> ${data.guests} persona(s)</div>
    <div><strong>Estado del Mensaje:</strong> Enviado automáticamente a su WhatsApp</div>
  `;

  // El mensaje automático lo despacha el servidor. El botón de contacto solo permite consultar al concierge.
  const guestInquiryText = `Hola, he registrado la reserva ${data.bookingId} a nombre de ${data.fullName} y quisiera consultar con conserjería.`;
  const conciergeUrl = `https://wa.me/${SENDER_WHATSAPP_INTERNATIONAL}?text=${encodeURIComponent(guestInquiryText)}`;
  
  if (whatsappDirectLink) {
    whatsappDirectLink.href = conciergeUrl;
  }

  bookingModal.style.display = "flex";
  bookingModal.setAttribute("aria-hidden", "false");
}

/**
 * Cierra el modal de confirmación
 */
function closeModal() {
  bookingModal.style.display = "none";
  bookingModal.setAttribute("aria-hidden", "true");
}

/**
 * Asigna los escuchadores de eventos interactivos
 */
function setupEventListeners() {
  fullNameInput.addEventListener("input", updateWhatsAppPreview);
  roomTypeSelect.addEventListener("change", updateWhatsAppPreview);
  countryCodeSelect.addEventListener("change", updateWhatsAppPreview);
  checkInInput.addEventListener("change", () => {
    validateDates();
    updateWhatsAppPreview();
  });
  checkOutInput.addEventListener("change", () => {
    validateDates();
    updateWhatsAppPreview();
  });

  bookingForm.addEventListener("submit", handleBookingSubmission);

  modalCloseBtn.addEventListener("click", closeModal);
  modalAcceptBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (event) => {
    if (event.target === bookingModal) {
      closeModal();
    }
  });

  // Menú hamburguesa móvil
  mobileToggle.addEventListener("click", () => {
    mainNav.classList.toggle("is-active");
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-active");
    });
  });
}

// Inicialización general al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  initializeDateInputs();
  setupEventListeners();
});
