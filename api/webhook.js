/**
 * WEBHOOK DE RESPUESTA AUTOMÁTICA DE WHATSAPP (VERCEL SERVERLESS)
 * Ruta: POST /api/webhook
 * 
 * Recibe el mensaje entrante del cliente y responde AUTOMÁTICAMENTE
 * e instantáneamente con TwiML sin costo y sin requerir plantillas previas.
 */

const querystring = require("querystring");

/**
 * Parsea el cuerpo de la petición ya sea x-www-form-urlencoded o JSON
 */
function parseRequestBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") {
      return resolve(req.body);
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        if (req.headers["content-type"] && req.headers["content-type"].includes("json")) {
          resolve(JSON.parse(body));
        } else {
          resolve(querystring.parse(body));
        }
      } catch (err) {
        resolve({});
      }
    });
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  // Si es una verificación GET
  if (req.method === "GET") {
    return res.status(200).send("<Response><Message>Webhook de Hotel Casino Noir activo.</Message></Response>");
  }

  const payload = await parseRequestBody(req);
  const incomingMessage = (payload.Body || "").trim();
  const senderPhone = payload.From || "";

  console.log(`[Webhook Recibido] De: ${senderPhone} | Mensaje: "${incomingMessage}"`);

  // Extraer el código de reserva si está en el mensaje (ej: NOIR-429214)
  const codeMatch = incomingMessage.match(/NOIR-\d{6}/i);
  const bookingCode = codeMatch ? codeMatch[0].toUpperCase() : "";

  // Redacción de la respuesta automática oficial del Concierge
  let replyText = `¡Hola! ♠ Gracias por comunicarte con la Conserjería Oficial de Hotel Casino Noir Las Vegas.\n\n`;

  if (bookingCode) {
    replyText += `Hemos registrado exitosamente tu solicitud para el código *${bookingCode}*.\n\n`;
    replyText += `Nuestro equipo está validando tu habitación y programando tu llave digital inteligente en la aplicación Noir.\n\n`;
  } else {
    replyText += `Hemos recibido tu solicitud de reserva en nuestro sistema.\n\n`;
    replyText += `Un anfitrión de nuestro equipo validará tus fechas y te confirmará en breves minutos.\n\n`;
  }

  replyText += `Si requieres coordinar tu traslado desde el Aeropuerto Harry Reid o solicitar amenidades especiales, responde directamente a este mensaje. ¡Te esperamos!`;

  // Respuesta oficial en formato TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyText}</Message>
</Response>`;

  return res.status(200).send(twiml);
};
