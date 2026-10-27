/**
 * Código familiar `FAM-XXXX-XX` (brief 8.2): 6 caracteres de un alfabeto sin
 * 0, 1, I ni O, generados con fuente criptográfica. Es permanente y el QR
 * contiene solo este código, nunca datos personales.
 */

export const ALFABETO_CODIGO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const PATRON = /^FAM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$/

/** Genera un código nuevo. La unicidad la garantiza la base (reintentar si choca). */
export function generarCodigoFamiliar(random: (n: number) => Uint8Array = bytesAleatorios): string {
  // 32 símbolos = 256 / 8: el módulo no introduce sesgo.
  const bytes = random(6)
  let s = ''
  for (const b of bytes) s += ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]
  return `FAM-${s.slice(0, 4)}-${s.slice(4)}`
}

function bytesAleatorios(n: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(n))
}

/**
 * Normaliza lo que alguien escribe o escanea: insensible a mayúsculas, guiones
 * y espacios, con o sin el prefijo FAM. Devuelve null si no puede ser un código.
 */
export function normalizarCodigo(valor: string): string | null {
  let limpio = valor.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (limpio.startsWith('FAM')) limpio = limpio.slice(3)
  if (limpio.length !== 6) return null
  const codigo = `FAM-${limpio.slice(0, 4)}-${limpio.slice(4)}`
  return PATRON.test(codigo) ? codigo : null
}

export function esCodigoValido(valor: string): boolean {
  return PATRON.test(valor)
}
