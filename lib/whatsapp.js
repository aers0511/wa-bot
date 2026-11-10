import { createHmac, timingSafeEqual } from "node:crypto";

/** Valida X-Hub-Signature-256 con el cuerpo crudo de la petición. */
export function firmaValida(rawBody, header) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const esperada = createHmac("sha256", secret).update(rawBody).digest();
  const recibida = Buffer.from(header.slice(7), "hex");
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}

export async function enviarTexto({ phoneNumberId, token, to, texto }) {
  const version = process.env.GRAPH_VERSION || "v21.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: texto.slice(0, 4096) },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`WhatsApp ${response.status}: ${await response.text()}`);
}
