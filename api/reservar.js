/**
 * FUNCIÓN SERVERLESS DE RESERVAS Y DESPACHO AUTOMÁTICO DE WHATSAPP (VERCEL)
 * Ruta de la API: POST /api/reservar
 * 
 * Gestiona el registro de la reserva, genera el código oficial NOIR-XXXXXX y despacha
 * automáticamente el mensaje de confirmación a WhatsApp desde el número emisor oficial.
 */

const axios = require("axios");

// Número emisor por defecto para la mensajería del hotel
const DEFAULT_SENDER_E164 = "+584242083041";

module.exports = async function handler(req, res) {
  // Encabezados de CORS para permitir peticiones desde el cliente web
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Solo se acepta POST." });
  }

  try {
    const { fullName, clientEmail, fullPhone, roomType, checkIn, checkOut, guests } = req.body;

    // Validación de campos requeridos
    if (!fullName || !clientEmail || !fullPhone || !roomType || !checkIn || !checkOut) {
      return res.status(400).json({ error: "Todos los campos de la reserva son obligatorios." });
    }

    // Generación de código único formal de reserva (Ej: NOIR-429214)
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const bookingId = `NOIR-${randomCode}`;

    // Estructura oficial del mensaje de confirmación del hotel
    const confirmationMessage = `¡Hola ${fullName}! Gracias por solicitar tu reserva en nuestro hotel para las fechas ${checkIn} a ${checkOut}. Tu código de reserva es ${bookingId}. Hemos recibido tus datos correctamente y nuestro equipo está procesando la confirmación de tu habitación ${roomType}.`;

    let dispatchResult = { success: false, mode: "simulation", note: "Sin credenciales configuradas en el servidor" };

    const cleanRecipientPhone = fullPhone.replace(/[\s-]/g, "");

    // 1. Despacho prioritario vía Twilio WhatsApp (si existen credenciales en el entorno de Vercel)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require("twilio");
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const senderTwilio = process.env.TWILIO_WHATSAPP_FROM || `whatsapp:${DEFAULT_SENDER_E164}`;
        const formattedTo = cleanRecipientPhone.startsWith("whatsapp:")
          ? cleanRecipientPhone
          : `whatsapp:${cleanRecipientPhone}`;

        const twilioResponse = await twilioClient.messages.create({
          body: confirmationMessage,
          from: senderTwilio,
          to: formattedTo
        });

        dispatchResult = { success: true, mode: "twilio", messageId: twilioResponse.sid };
      } catch (twilioError) {
        console.error("[Twilio Error]:", twilioError.message);
        dispatchResult = { success: false, mode: "twilio_error", error: twilioError.message };
      }
    } 
    // 2. Despacho alternativo vía Meta WhatsApp Cloud API (si se configuran tokens de Meta)
    else if (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const endpointUrl = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const pureDigits = cleanRecipientPhone.replace(/\D/g, "");

        const metaResponse = await axios.post(
          endpointUrl,
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: pureDigits,
            type: "text",
            text: { preview_url: false, body: confirmationMessage }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );

        dispatchResult = { success: true, mode: "meta_cloud_api", messageId: metaResponse.data.messages[0].id };
      } catch (metaError) {
        console.error("[Meta Error]:", metaError.response ? metaError.response.data : metaError.message);
        dispatchResult = { success: false, mode: "meta_error", error: metaError.message };
      }
    }

    // Respuesta formal de éxito con los datos consolidados
    return res.status(200).json({
      success: true,
      bookingId,
      message: confirmationMessage,
      dispatchResult,
      details: {
        fullName,
        clientEmail,
        fullPhone,
        roomType,
        checkIn,
        checkOut,
        guests
      }
    });
  } catch (error) {
    console.error("[Error del Servidor]:", error);
    return res.status(500).json({ error: "Ocurrió un error al procesar la reserva en el servidor." });
  }
};
