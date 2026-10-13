// Código de seguimiento oficial: TR-NNNN (cuatro dígitos), el mismo formato de
// demo/datos/solicitudes.json. Es único entre todos los tipos de trámite; la
// unicidad la verifica el servidor (src/servidor/codigos.ts).

export const FORMATO_CODIGO = /^TR-\d{4}$/;

/** Por ejemplo «TR-4043». `azar` permite generar códigos reproducibles. */
export function generarCodigo(azar: () => number = Math.random): string {
  return `TR-${String(Math.floor(azar() * 10_000)).padStart(4, "0")}`;
}
