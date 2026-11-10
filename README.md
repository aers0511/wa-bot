# wa-bot

Backend multi-tenant: WhatsApp Cloud API → webhook en Vercel → Gemini → respuesta.
Un solo webhook atiende a todos los clientes; la configuración de cada uno vive en Supabase.

## Puesta en marcha
1. **Supabase:** crea un proyecto y ejecuta `supabase/schema.sql`.
2. **Variables:** copia `.env.example`, complétalo y cárgalo en Vercel (Settings → Environment Variables).
3. **Deploy:** `npm i && vercel --prod`.
4. **Meta:** en tu app → WhatsApp → Configuration, webhook `https://<tu-proyecto>.vercel.app/api/webhook`, con tu `VERIFY_TOKEN`; suscríbete al campo `messages`.
5. **Alta de cliente:** cifra su token y agrega una fila en `clientes`:
   ```bash
   ENCRYPTION_KEY=... npm run encrypt -- "<token-del-cliente>"
   ```
   ```sql
   insert into clientes (nombre, phone_number_id, token_cifrado, prompt)
   values ('Cliente X', '<phone_number_id>', '<salida del script>', 'Eres el asistente de ...');
   ```

## Estructura
- `api/webhook.js`: GET (verificación) y POST (mensajes).
- `lib/procesar.js`: flujo por mensaje (cliente → historial → Gemini → envío).
- `lib/db.js`, `lib/gemini.js`, `lib/whatsapp.js`, `lib/crypto.js`.

## Notas
- El modelo de Gemini es una columna por cliente (`modelo`); confirma el vigente en la documentación de Google.
- El límite `limite_mensual` cuenta respuestas del bot por mes (UTC); al alcanzarlo, el bot deja de responder.
- Verifica en la documentación de Meta la versión de Graph API (`GRAPH_VERSION`) y los costos antes de cotizar.
