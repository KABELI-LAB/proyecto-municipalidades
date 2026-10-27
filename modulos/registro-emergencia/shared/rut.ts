/**
 * RUT chileno (brief 8.1). Se guarda normalizado `12345678-5` y se muestra
 * `12.345.678-5`. Compartido entre navegador y servidor.
 */

/** Dígito verificador por módulo 11 del cuerpo numérico. */
export function digitoVerificador(cuerpo: string): string {
  let suma = 0
  let factor = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

/** Quita puntos, guiones y espacios; K en mayúscula. No valida. */
export function limpiarRut(valor: string): string {
  return valor.replace(/[^0-9kK]/g, '').toUpperCase()
}

/** `12.345.678-5` → `12345678-5`, o null si no es un RUT válido. */
export function normalizarRut(valor: string): string | null {
  const limpio = limpiarRut(valor)
  if (!/^[0-9]{7,8}[0-9K]$/.test(limpio)) return null
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  if (digitoVerificador(cuerpo) !== dv) return null
  return `${cuerpo}-${dv}`
}

export function esRutValido(valor: string): boolean {
  return normalizarRut(valor) !== null
}

/**
 * Formato de lectura mientras se escribe: agrega puntos y guion a lo que haya.
 * `123456785` → `12.345.678-5`.
 */
export function formatearRut(valor: string): string {
  const limpio = limpiarRut(valor).slice(0, 9)
  if (limpio.length < 2) return limpio
  const cuerpo = limpio.slice(0, -1).replace(/K/g, '')
  const dv = limpio.slice(-1)
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${conPuntos}-${dv}`
}
