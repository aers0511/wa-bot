import { decrypt } from "./crypto.js";
import { getCliente, guardarEntrante, guardarRespuesta, historial, respuestasDelMes } from "./db.js";
import { responder } from "./gemini.js";
import { enviarTexto } from "./whatsapp.js";

const SOLO_TEXTO = "Por ahora solo puedo leer mensajes de texto. ¿Me escribes tu consulta?";

async function procesarMensaje(cliente, mensaje) {
  const token = decrypt(cliente.token_cifrado);
  const envio = { phoneNumberId: cliente.phone_number_id, token, to: mensaje.from };

  if (mensaje.type !== "text" || !mensaje.text?.body) {
    await enviarTexto({ ...envio, texto: SOLO_TEXTO });
    return;
  }

  const nuevo = await guardarEntrante(cliente.id, mensaje.from, mensaje.id, mensaje.text.body);
  if (!nuevo) return; // reintento de Meta: ya se procesó

  if ((await respuestasDelMes(cliente.id)) >= cliente.limite_mensual) {
    console.warn(`Límite mensual alcanzado: ${cliente.nombre}`);
    return;
  }

  const mensajes = await historial(cliente.id, mensaje.from);
  const texto = await responder({ prompt: cliente.prompt, mensajes, modelo: cliente.modelo });
  if (!texto) return;

  await enviarTexto({ ...envio, texto });
  await guardarRespuesta(cliente.id, mensaje.from, texto);
}

/** Recorre el payload de Meta y atiende cada mensaje con la configuración de su cliente. */
export async function procesarPayload(payload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) continue; // estados de entrega, etc.

      const cliente = await getCliente(value.metadata?.phone_number_id);
      if (!cliente) {
        console.warn("Mensaje para un número sin cliente activo");
        continue;
      }
      for (const mensaje of value.messages) {
        await procesarMensaje(cliente, mensaje).catch((error) =>
          console.error(`Error con ${cliente.nombre}:`, error.message),
        );
      }
    }
  }
}
