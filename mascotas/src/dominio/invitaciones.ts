// Invitaciones prioritarias a operativos (docs/concepto.md, secciones 5 y 9):
// reglas que no dependen de la base de datos.
import type { Estado } from "@/dominio/etiquetas";
import { distanciaKm, type Punto } from "@/dominio/geo";

/** Horas para responder una invitación. */
export const PLAZO_HORAS = 48;
/** La invitación vence, como tarde, este número de horas antes del día del operativo. */
const HORAS_ANTES_DEL_OPERATIVO = 24;
/** Cobertura: además del sector del operativo, localidades a menos de esta distancia del lugar. */
export const RADIO_COBERTURA_KM = 10;

/** Estados en que una invitación sigue abierta y retiene un cupo. */
export const INVITACION_ABIERTA = ["ENVIADA", "INTERESADA"] as const;

const HORA = 3_600_000;

/**
 * Plazo para responder: 48 horas, pero nunca después del día anterior al
 * operativo. Si el operativo es muy pronto, vence al empezar su día.
 */
export function vencimiento(ahora: Date, inicioDelDiaDelOperativo: Date): Date {
  const plazo = ahora.getTime() + PLAZO_HORAS * HORA;
  const limite = inicioDelDiaDelOperativo.getTime() - HORAS_ANTES_DEL_OPERATIVO * HORA;
  const v = Math.min(plazo, limite);
  return new Date(v > ahora.getTime() ? v : Math.max(ahora.getTime(), inicioDelDiaDelOperativo.getTime()));
}

export type Candidata = { id: string; sectorId: string; localidad: Punto | null; creadaEn: Date };

/**
 * Solicitudes elegibles y su orden de prioridad: primero las del mismo sector,
 * luego las de localidades cercanas al lugar del operativo; dentro de cada
 * grupo, la más antigua primero. Las que quedan fuera de la cobertura se excluyen.
 */
export function ordenarElegibles<T extends Candidata>(solicitudes: T[], sectorId: string, lugar: Punto | null): T[] {
  const grupo = (s: T) => {
    if (s.sectorId === sectorId) return 0;
    if (lugar && s.localidad && distanciaKm(lugar, s.localidad) <= RADIO_COBERTURA_KM) return 1;
    return null;
  };
  return solicitudes
    .flatMap((s) => {
      const g = grupo(s);
      return g === null ? [] : [{ s, g }];
    })
    .sort((a, b) => a.g - b.g || a.s.creadaEn.getTime() - b.s.creadaEn.getTime())
    .map((x) => x.s);
}

/** Estado de una invitación, como lo ve la persona: confirmar interés no es tener el cupo. */
export const ESTADO_INVITACION: Record<string, Estado> = {
  ENVIADA: { texto: "Por responder", tono: "espera" },
  INTERESADA: { texto: "Interés confirmado: esperando cupo", tono: "informacion" },
  ASIGNADA: { texto: "Cupo asignado", tono: "confirmado" },
  RECHAZADA: { texto: "No asistirá", tono: "cerrado" },
  VENCIDA: { texto: "Venció sin respuesta", tono: "cerrado" },
  CANCELADA: { texto: "Cerrada", tono: "cerrado" },
};
