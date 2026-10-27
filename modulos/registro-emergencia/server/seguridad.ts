/** Tokens y hashes. Los tokens se guardan solo como hash SHA-256. */

/** Token aleatorio en base64url (por defecto 32 bytes = 256 bits). */
export function generarToken(bytes = 32): string {
  const b = globalThis.crypto.getRandomValues(new Uint8Array(bytes))
  return btoa(String.fromCharCode(...b))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function sha256(texto: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Formato de los tokens que emitimos: evita consultas con basura. */
export function pareceToken(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(valor)
}
