# Hotel Casino Noir - Las Vegas Strip

Sitio web oficial y sistema de reservas con tecnología sin contacto y despacho automatizado de confirmaciones a través de WhatsApp.

## ♠ Características Principales

- **Diseño Editorial & UX/UI de Lujo:** Paleta cromática corporativa (*Negro Noir*, *Rojo Burdeos*, *Morado Gótico* y *Dorado*), tipografías *Cinzel* y *Montserrat*.
- **Piso 1: Noir Wellness Gótico:** Espacio exclusivo de bienestar, spa de piedra volcánica y estética refinada para mujeres.
- **Catálogo de Habitaciones Smart:** 120 habitaciones en 6 tipologías diferenciadas por domótica, control por voz y sostenibilidad.
- **Torre de 8 Niveles:** Diagrama arquitectónico responsivo con casino 24/7 en planta baja, suites y penthouses en terrazas.
- **Despacho Automatizado por WhatsApp:** API Serverless integrada (`/api/reservar`) con soporte para Twilio WhatsApp y Meta Cloud API.

## 🚀 Despliegue en Vercel

1. Importar el repositorio desde [Vercel](https://vercel.com/new).
2. Configurar las **Environment Variables** en el panel de Vercel:

| Variable | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | SID de cuenta en Twilio | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Token de autenticación de Twilio | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_WHATSAPP_FROM` | Número emisor asignado en Twilio | `whatsapp:+17372508034` |
| `SENDER_PHONE_NUMBER` | Número local de referencia | `04242083041` |

3. Desplegar. Al registrar una reserva, el mensaje con el código `NOIR-XXXXXX` se despachará automáticamente a WhatsApp.
