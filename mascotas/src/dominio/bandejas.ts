// Reglas de las bandejas de revisión (docs/concepto.md, secciones 6, 7 y 9):
// qué cambio de estado se permite desde cada estado.

/** Estados desde los que se puede hacer cada acción. */
export const TRANSICION_REPORTE = {
  revisar: ["ABIERTO"],
  cerrar: ["ABIERTO", "EN_REVISION"],
  reabrir: ["CERRADO"],
} as const;

export const TRANSICION_POSTULACION = {
  evaluar: ["RECIBIDA"],
  aprobar: ["RECIBIDA", "EN_EVALUACION"],
  noSeleccionar: ["RECIBIDA", "EN_EVALUACION", "APROBADA"],
} as const;

export const TRANSICION_COINCIDENCIA = {
  validar: ["SUGERIDA"],
  descartar: ["SUGERIDA", "VALIDADA"],
  registrarReencuentro: ["SUGERIDA", "VALIDADA"],
} as const;

export function permite<T extends Record<string, readonly string[]>>(reglas: T, accion: keyof T, estado: string): boolean {
  return (reglas[accion] as readonly string[]).includes(estado);
}

/**
 * Compromisos de una adopción (sección 7, paso 5): si al animal le falta
 * esterilización o microchip, se genera una solicitud a nombre de quien adopta.
 * Devuelve las claves de servicio del catálogo.
 */
export function compromisosDeAdopcion(animal: { esterilizado: boolean | null; microchip: boolean | null }): ("esterilizacion" | "microchip")[] {
  return [...(animal.esterilizado ? [] : (["esterilizacion"] as const)), ...(animal.microchip ? [] : (["microchip"] as const))];
}
