/** Celulares chilenos en E.164 `+569XXXXXXXX`. */

/** Acepta `9 1234 5678`, `+56 9 1234 5678`, `56912345678`… Devuelve null si no es un celular. */
export function normalizarCelular(valor: string): string | null {
  let digitos = valor.replace(/\D/g, '')
  if (digitos.startsWith('56')) digitos = digitos.slice(2)
  if (!/^9[0-9]{8}$/.test(digitos)) return null
  return `+56${digitos}`
}

/** `+56912345678` → `+56 9 1234 5678`. */
export function formatearCelular(e164: string): string {
  const m = /^\+56(9)(\d{4})(\d{4})$/.exec(e164)
  return m ? `+56 ${m[1]} ${m[2]} ${m[3]}` : e164
}
