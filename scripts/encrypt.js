// Cifra el token de acceso de un cliente para guardarlo en clientes.token_cifrado.
// Uso: ENCRYPTION_KEY=... node scripts/encrypt.js "<token>"
import { encrypt } from "../lib/crypto.js";

const token = process.argv[2];
if (!token) {
  console.error('Uso: ENCRYPTION_KEY=... node scripts/encrypt.js "<token>"');
  process.exit(1);
}
console.log(encrypt(token));
