// Contraseñas con scrypt (incluido en Node, sin dependencias). Sin "server-only"
// para poder usarlo también desde los scripts de datos.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;

export async function cifrarContrasena(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scrypt(clave, sal, 64);
  return `scrypt$${sal.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verificarContrasena(clave: string, guardada: string): Promise<boolean> {
  const [algoritmo, sal, hash] = guardada.split("$");
  if (algoritmo !== "scrypt" || !sal || !hash) return false;
  const esperado = Buffer.from(hash, "base64url");
  const calculado = await scrypt(clave, Buffer.from(sal, "base64url"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}
