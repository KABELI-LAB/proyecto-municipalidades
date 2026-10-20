/** Dígito verificador de un RUT chileno (módulo 11). */
export function digitoVerificador(cuerpo: number): string {
  let suma = 0;
  let factor = 2;
  for (let n = cuerpo; n > 0; n = Math.floor(n / 10)) {
    suma += (n % 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  return resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
}

/** «12.345.678-5» o «123456785» → «12345678-5»; null si no es válido. */
export function normalizarRut(texto: string): string | null {
  const limpio = texto.replace(/[.\s-]/g, "").toUpperCase();
  const m = /^(\d{7,8})([\dK])$/.exec(limpio);
  if (!m) return null;
  const cuerpo = Number(m[1]);
  return digitoVerificador(cuerpo) === m[2] ? `${cuerpo}-${m[2]}` : null;
}

