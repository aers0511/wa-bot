import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key() {
  const buffer = Buffer.from(process.env.ENCRYPTION_KEY || "", "base64");
  if (buffer.length !== 32) throw new Error("ENCRYPTION_KEY debe ser de 32 bytes en base64");
  return buffer;
}

/** AES-256-GCM. Resultado en base64: iv (12) + etiqueta (16) + datos. */
export function encrypt(text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}

export function decrypt(payload) {
  const buffer = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buffer.subarray(0, 12));
  decipher.setAuthTag(buffer.subarray(12, 28));
  return Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString("utf8");
}
