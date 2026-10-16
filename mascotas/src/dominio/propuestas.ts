// «Dar en adopción» (docs/concepto.md, sección 7, paso 0): reglas de las
// propuestas de vecinos que no dependen de la base de datos.

export const mesesDeEdad = (valor: string) => (/^\d+$/.test(valor) ? Number(valor) : null);

/** Edad máxima que se acepta al escribirla (25 años). */
export const MESES_MAXIMOS = 300;

/** Edad tal como la escribió la persona: «8 meses», «2 años», «1 año y 6 meses»; null: «No se sabe». */
export function edadEscrita(meses: number | null) {
  if (meses === null) return "No se sabe";
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const m = (n: number) => `${n} ${n === 1 ? "mes" : "meses"}`;
  if (anos === 0) return m(resto);
  const a = `${anos} ${anos === 1 ? "año" : "años"}`;
  return resto ? `${a} y ${m(resto)}` : a;
}

/** «Sí / No / No sé» a un dato que puede quedar sin informar. */
export const siNoNoSe = (v: string): boolean | null => (v === "SI" ? true : v === "NO" ? false : null);
export const aSiNoNoSe = (v: boolean | null | undefined) => (v === true ? "SI" : v === false ? "NO" : "NO_SE");

/** Máximo de fotos por propuesta. */
export const MAXIMO_FOTOS = 3;

/** Cambios de revisión que puede hacer el equipo municipal, desde qué revisión. */
export const TRANSICION_REVISION = {
  aprobar: ["PENDIENTE"],
  pedirCorrecciones: ["PENDIENTE"],
  rechazar: ["PENDIENTE", "CORRECCIONES"],
  ocultar: ["APROBADA"],
  volverAPublicar: ["OCULTA"],
} as const;

/** Revisiones en que una propuesta sigue «abierta»: cuenta para evitar duplicados. */
export const REVISION_ABIERTA = ["PENDIENTE", "CORRECCIONES", "APROBADA"] as const;

/** Para comparar nombres al buscar duplicados: sin tildes, mayúsculas ni espacios de más. */
export const normalizarNombre = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
