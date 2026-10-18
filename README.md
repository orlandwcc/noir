# Hotel Casino Noir - Las Vegas Strip

Sitio web oficial y sistema de reservas con tecnología sin contacto y webhook de respuesta automática para WhatsApp.

## ♠ Características

- **Diseño Editorial & UX/UI de Lujo:** Paleta corporativa (*Negro Noir*, *Rojo Burdeos*, *Morado Gótico* y *Dorado*), tipografías *Cinzel* y *Montserrat*.
- **Piso 1: Noir Wellness Gótico:** Espacio exclusivo de bienestar femenino con spa de piedra volcánica.
- **Catálogo de Habitaciones Smart:** 120 habitaciones en 6 tipologías con domótica y check-in digital.
- **Torre de 8 Niveles:** Arquitectura responsiva con casino 24/7 en planta baja, suites y penthouses.
- **Webhook de Respuesta Automática:** Endpoint Serverless (`/api/webhook`) que responde automáticamente a los mensajes de WhatsApp en tiempo real sin requerir plantillas ni costos adicionales.

## ⚡ Configuración de la Respuesta Automática en Twilio Sandbox

1. En la consola de Twilio ve a: **Messaging > Settings > WhatsApp Sandbox Settings**.
2. En el campo **"WHEN A MESSAGE COMES IN"**, coloca:
   ```text
   https://hotelcasinonoir.vercel.app/api/webhook
   ```
3. Configura el método como **HTTP POST**.
4. Presiona **Save**.

Cada vez que un huésped envíe su solicitud desde la web a WhatsApp, tu servidor en Vercel le responderá automáticamente e instantáneamente confirmando su reserva y código.
