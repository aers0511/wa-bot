import { waitUntil } from "@vercel/functions";
import { procesarPayload } from "../lib/procesar.js";
import { firmaValida } from "../lib/whatsapp.js";

/** Verificación del webhook por parte de Meta. */
export function GET(request) {
  const params = new URL(request.url).searchParams;
  const valido = params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === process.env.VERIFY_TOKEN;
  return valido ? new Response(params.get("hub.challenge")) : new Response("Forbidden", { status: 403 });
}

/** Mensajes entrantes: se valida la firma, se responde 200 de inmediato y se procesa en segundo plano. */
export async function POST(request) {
  const raw = await request.text();
  if (!firmaValida(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Firma inválida", { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Solicitud inválida", { status: 400 });
  }

  waitUntil(procesarPayload(payload).catch((error) => console.error("Error en el webhook:", error.message)));
  return new Response("OK");
}
