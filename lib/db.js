import { createClient } from "@supabase/supabase-js";

let client;
const db = () =>
  (client ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  }));

/** Cliente activo asociado al número que recibió el mensaje. */
export async function getCliente(phoneNumberId) {
  const { data, error } = await db()
    .from("clientes")
    .select("*")
    .eq("phone_number_id", phoneNumberId)
    .eq("activo", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Guarda el mensaje entrante. Devuelve false si ya existía (reintento de Meta). */
export async function guardarEntrante(clienteId, waId, waMessageId, contenido) {
  const { error } = await db()
    .from("mensajes")
    .insert({ cliente_id: clienteId, wa_id: waId, wa_message_id: waMessageId, rol: "user", contenido });
  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

export async function guardarRespuesta(clienteId, waId, contenido) {
  const { error } = await db().from("mensajes").insert({ cliente_id: clienteId, wa_id: waId, rol: "model", contenido });
  if (error) throw error;
}

/** Últimos mensajes de la conversación, del más antiguo al más reciente. */
export async function historial(clienteId, waId, limite = 12) {
  const { data, error } = await db()
    .from("mensajes")
    .select("rol, contenido")
    .eq("cliente_id", clienteId)
    .eq("wa_id", waId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limite);
  if (error) throw error;
  const mensajes = data.reverse();
  while (mensajes.length && mensajes[0].rol !== "user") mensajes.shift();
  return mensajes;
}

/** Respuestas del bot en el mes actual (UTC), para aplicar el límite del cliente. */
export async function respuestasDelMes(clienteId) {
  const now = new Date();
  const inicio = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const { count, error } = await db()
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId)
    .eq("rol", "model")
    .gte("created_at", inicio);
  if (error) throw error;
  return count ?? 0;
}
