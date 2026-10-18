/**
 * SERVICIO BACKEND DE INTEGRACIÓN DE MENSAJERÍA WHATSAPP
 * Hotel Casino Noir - Módulo de Notificaciones de Reserva
 * 
 * Este módulo procesa las solicitudes de reserva y despacha el mensaje automatizado
 * de confirmación directamente a WhatsApp del huésped utilizando como número emisor oficial:
 * 04242083041 (+58 424-2083041).
 */

// Dependencias recomendadas para Node.js:
// npm install twilio dotenv axios

// Configuración del número telefónico emisor del sistema
const SENDER_RAW_NUMBER = "04242083041";
const SENDER_WHATSAPP_E164 = "+584242083041"; // Formato internacional estándar para Venezuela

/**
 * --------------------------------------------------------------------------
 * OPCIÓN A: INTEGRACIÓN MEDIANTE TWILIO WHATSAPP API
 * --------------------------------------------------------------------------
 */
const twilio = require("twilio");

// Credenciales de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID || "AC_MOCK_ACCOUNT_SID";
const authToken = process.env.TWILIO_AUTH_TOKEN || "AUTH_TOKEN_MOCK";
const twilioClient = twilio(accountSid, authToken);

/**
 * Envía un mensaje automatizado de confirmación directamente a WhatsApp a través de Twilio
 * @param {Object} reservation Datos de la reserva del cliente
 * @returns {Promise<Object>} Resultado del envío
 */
async function sendBookingConfirmationViaTwilio(reservation) {
  const { fullName, clientPhone, checkIn, checkOut, roomType } = reservation;

  // Redacción exacta requerida para la confirmación de Hotel Casino Noir
  const messageBody = `¡Hola ${fullName}! Gracias por solicitar tu reserva en nuestro hotel para las fechas ${checkIn} a ${checkOut}. Hemos recibido tus datos correctamente y nuestro equipo está procesando la confirmación de tu habitación ${roomType}.`;

  // Asegura el prefijo de WhatsApp en formato E.164
  const recipientWhatsApp = clientPhone.startsWith("whatsapp:")
    ? clientPhone
    : `whatsapp:${clientPhone.replace(/\s+/g, "")}`;

  try {
    const response = await twilioClient.messages.create({
      body: messageBody,
      from: `whatsapp:${SENDER_WHATSAPP_E164}`, // Número emisor oficial configurado: 04242083041
      to: recipientWhatsApp // Teléfono WhatsApp del cliente
    });

    console.log(`[Twilio WhatsApp] Confirmación enviada exitosamente desde ${SENDER_RAW_NUMBER}. SID: ${response.sid}`);
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error("[Twilio WhatsApp Error] Fallo al despachar mensaje:", error.message);
    throw error;
  }
}

/**
 * --------------------------------------------------------------------------
 * OPCIÓN B: INTEGRACIÓN NATIVA MEDIANTE META WHATSAPP CLOUD API
 * --------------------------------------------------------------------------
 */
const axios = require("axios");

const META_WHATSAPP_TOKEN = process.env.WHATSAPP_CLOUD_API_TOKEN || "EAAG_MOCK_TOKEN";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "04242083041";

/**
 * Despacha el mensaje de confirmación utilizando el Cloud API oficial de Meta para WhatsApp
 * @param {Object} reservation Datos de la reserva
 * @returns {Promise<Object>} Resultado del despacho
 */
async function sendBookingConfirmationViaMetaCloudApi(reservation) {
  const { fullName, clientPhone, checkIn, checkOut, roomType } = reservation;
  
  // Normalización del número telefónico de destino (solo dígitos numéricos)
  const cleanPhone = clientPhone.replace(/\D/g, "");

  const endpointUrl = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "text",
    text: {
      preview_url: false,
      body: `¡Hola ${fullName}! Gracias por solicitar tu reserva en nuestro hotel para las fechas ${checkIn} a ${checkOut}. Hemos recibido tus datos correctamente y nuestro equipo está procesando la confirmación de tu habitación ${roomType}.`
    }
  };

  try {
    const response = await axios.post(endpointUrl, payload, {
      headers: {
        Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log(`[Meta Cloud API] Mensaje entregado a WhatsApp desde ${SENDER_RAW_NUMBER}. ID:`, response.data.messages[0].id);
    return { success: true, metaId: response.data.messages[0].id };
  } catch (error) {
    console.error("[Meta Cloud API Error] Error en la petición:", error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = {
  SENDER_RAW_NUMBER,
  SENDER_WHATSAPP_E164,
  sendBookingConfirmationViaTwilio,
  sendBookingConfirmationViaMetaCloudApi
};
