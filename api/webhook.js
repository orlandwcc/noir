/**
 * WEBHOOK DE RESPUESTA AUTOMÁTICA DE WHATSAPP (VERCEL SERVERLESS)
 * Ruta: POST /api/webhook
 * 
 * Cuando un cliente envía un mensaje al WhatsApp del Concierge (ej: desde el Sandbox de Twilio
 * o Meta), este webhook se dispara y responde AUTOMÁTICAMENTE de forma instantánea al cliente
 * sin costo adicional y sin requerir plantillas previas (dentro de la sesión de 24 horas).
 */

module.exports = async function handler(req, res) {
  // Configuración de encabezados
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  // Obtención del mensaje entrante o nombre si viene en el payload
  const incomingBody = req.body && req.body.Body ? req.body.Body : "";
  const senderPhone = req.body && req.body.From ? req.body.From : "";

  console.log(`[WhatsApp Inbound] Mensaje recibido de ${senderPhone}: "${incomingBody}"`);

  // Mensaje oficial automático con el que el Concierge responde al huésped
  const autoReplyMessage = `¡Hola! ♠ Gracias por comunicarte con la Conserjería Oficial de Hotel Casino Noir Las Vegas.\n\nHemos recibido los datos de tu solicitud de reserva correctamente. Nuestro equipo está procesando la confirmación de tu habitación y la asignación de tu llave digital.\n\nEn breves momentos un anfitrión confirmará tu estadía. Si necesitas asistencia inmediata, responde directamente a este mensaje.`;

  // Respuesta en formato TwiML para Twilio (estándar de la industria)
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${autoReplyMessage}</Message>
</Response>`;

  return res.status(200).send(twimlResponse);
};
