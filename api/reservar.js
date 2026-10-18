/**
 * FUNCIÓN SERVERLESS DE RESERVAS Y DESPACHO AUTOMÁTICO DE WHATSAPP (VERCEL)
 * Ruta de la API: POST /api/reservar
 * 
 * Gestiona el registro de la reserva, genera el código oficial NOIR-XXXXXX y despacha
 * automáticamente el mensaje de WhatsApp desde el número emisor 04242083041.
 */

const SENDER_RAW_NUMBER = process.env.SENDER_PHONE_NUMBER || "04242083041";
const SENDER_WHATSAPP_E164 = "+584242083041"; // Identificador telefónico para WhatsApp

module.exports = async function handler(req, res) {
  // Configuración de encabezados CORS para peticiones HTTP
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Solo se acepta POST." });
  }

  try {
    const { fullName, clientEmail, fullPhone, roomType, checkIn, checkOut, guests } = req.body;

    // Validación de campos obligatorios
    if (!fullName || !clientEmail || !fullPhone || !roomType || !checkIn || !checkOut) {
      return res.status(400).json({ error: "Todos los campos de la reserva son obligatorios." });
    }

    // Generación de código único de confirmación (Ej: NOIR-429214)
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const bookingId = `NOIR-${randomCode}`;

    // Estructura exacta del mensaje automatizado para el huésped
    const confirmationMessage = `¡Hola ${fullName}! Gracias por solicitar tu reserva en nuestro hotel para las fechas ${checkIn} a ${checkOut}. Tu código de reserva es ${bookingId}. Hemos recibido tus datos correctamente y nuestro equipo está procesando la confirmación de tu habitación ${roomType}.`;

    let dispatchResult = { success: true, mode: "simulation" };

    // Intento de despacho automático a través de Twilio si las credenciales existen en Vercel
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require("twilio");
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const cleanRecipient = fullPhone.replace(/[\s-]/g, "");
        const formattedTo = cleanRecipient.startsWith("whatsapp:")
          ? cleanRecipient
          : `whatsapp:${cleanRecipient}`;

        const twilioResponse = await twilioClient.messages.create({
          body: confirmationMessage,
          from: `whatsapp:${SENDER_WHATSAPP_E164}`, // 04242083041
          to: formattedTo
        });

        dispatchResult = { success: true, mode: "twilio", messageId: twilioResponse.sid };
      } catch (twilioError) {
        console.warn("[Aviso Twilio] No se pudo despachar el SMS/WhatsApp en vivo:", twilioError.message);
        dispatchResult = { success: false, mode: "twilio_failed", error: twilioError.message };
      }
    }

    // Respuesta exitosa al frontend con el código asignado
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
    console.error("[Error Interno de Reserva]:", error);
    return res.status(500).json({ error: "Ocurrió un error al procesar la reserva en el servidor." });
  }
};
