// Reglas de cupos (docs/concepto.md, sección 9).

/** Estados de cupo que ocupan capacidad del operativo. */
export const CUPO_OCUPA = ["INVITADO", "CONFIRMADO", "ASISTIO"] as const;
/** Estados que cuentan para el límite por hogar (inscripciones vigentes). */
export const CUPO_VIGENTE = ["INVITADO", "CONFIRMADO", "EN_LISTA_ESPERA"] as const;

export function cuposDisponibles(capacidad: number, ocupados: number): number {
  return Math.max(0, capacidad - ocupados);
}

export type DecisionCupo =
  | { estado: "CONFIRMADO" }
  | { estado: "EN_LISTA_ESPERA"; posicion: number };

/** Hay cupo → confirmado. Sin cupo → lista de espera por orden de llegada. */
export function decidirCupo(capacidad: number, ocupados: number, enEspera: number): DecisionCupo {
  return ocupados < capacidad ? { estado: "CONFIRMADO" } : { estado: "EN_LISTA_ESPERA", posicion: enEspera + 1 };
}

/** ¿La persona ya alcanzó el límite de animales inscritos en este operativo? */
export function alcanzaLimiteHogar(inscripcionesVigentes: number, limite: number): boolean {
  return inscripcionesVigentes >= limite;
}
