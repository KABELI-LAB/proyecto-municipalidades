// Índice de prioridad territorial (docs/concepto.md, sección 12).
//
//   P(sector) = pD·D + pR·R + pT·T + pE·E
//
// D = solicitudes de servicio pendientes; R = reportes de los últimos 90 días;
// T = días desde el último operativo cerrado; E = personas que quedaron sin
// cupo en el último operativo. Cada factor se normaliza entre 0 y 1 con
// mínimo y máximo entre sectores: (valor − mínimo) / (máximo − mínimo).
// El índice orienta: el funcionario decide.
import { numero } from "./formato";

export type Pesos = { demanda: number; reportes: number; tiempo: number; noCubierta: number };

export type FactoresSector = {
  sectorId: string;
  nombre: string;
  /** Pendientes por servicio, con su nombre para explicar la recomendación. */
  demandaPorServicio: { nombre: string; cantidad: number }[];
  reportes90: number;
  /** null si el sector nunca ha tenido un operativo cerrado. */
  diasSinIntervencion: number | null;
  noCubierta: number;
};

export type Nivel = "ALTA" | "MEDIA" | "BAJA";
export type Confianza = "baja" | "media" | "alta";

export type Prioridad = {
  sectorId: string;
  nombre: string;
  puntaje: number;
  nivel: Nivel;
  factores: { D: number; R: number; T: number; E: number };
  demanda: number;
  motivos: string[];
  recomendacion: string;
  registros: number;
  confianza: Confianza;
};

export const UMBRAL_ALTA = 0.66;
export const UMBRAL_MEDIA = 0.33;

export function nivelDe(puntaje: number): Nivel {
  return puntaje >= UMBRAL_ALTA ? "ALTA" : puntaje >= UMBRAL_MEDIA ? "MEDIA" : "BAJA";
}

/** Con pocos datos, el índice se presenta con cautela. */
export function confianzaDe(registros: number): Confianza {
  return registros < 10 ? "baja" : registros < 30 ? "media" : "alta";
}

/**
 * Recomendación según el nivel (sección 12). Nunca «debe»: el funcionario decide.
 * Alta: evaluar un operativo con énfasis en el servicio con más demanda pendiente.
 */
export function recomendacionDe(nivel: Nivel, servicioPrincipal: string | null): string {
  if (nivel === "ALTA") {
    return servicioPrincipal
      ? `Se recomienda evaluar un operativo territorial con énfasis en ${servicioPrincipal.toLowerCase()}.`
      : "Se recomienda evaluar un operativo territorial.";
  }
  return nivel === "MEDIA" ? "Se recomienda mantener seguimiento." : "Sin acción recomendada por ahora.";
}

const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`;

/** Calcula el índice para todos los sectores y los ordena de mayor a menor prioridad. */
export function calcularPrioridad(sectores: FactoresSector[], pesos: Pesos): Prioridad[] {
  const demanda = (s: FactoresSector) => s.demandaPorServicio.reduce((t, d) => t + d.cantidad, 0);
  const maxDias = Math.max(0, ...sectores.map((s) => s.diasSinIntervencion ?? 0));
  // Un sector sin operativos registrados cuenta como el que más tiempo lleva sin intervención.
  const dias = (s: FactoresSector) => s.diasSinIntervencion ?? maxDias;

  /** Normaliza con mínimo y máximo entre sectores; si todos son iguales, 0. */
  const normalizador = (valores: number[]) => {
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    return (v: number) => (max > min ? (v - min) / (max - min) : 0);
  };
  const nD = normalizador(sectores.map(demanda));
  const nR = normalizador(sectores.map((s) => s.reportes90));
  const nT = normalizador(sectores.map(dias));
  const nE = normalizador(sectores.map((s) => s.noCubierta));

  return sectores
    .map((s): Prioridad => {
      const factores = { D: nD(demanda(s)), R: nR(s.reportes90), T: nT(dias(s)), E: nE(s.noCubierta) };
      const puntaje =
        Math.round(
          (pesos.demanda * factores.D + pesos.reportes * factores.R + pesos.tiempo * factores.T + pesos.noCubierta * factores.E) * 100,
        ) / 100;

      const principal = [...s.demandaPorServicio].sort((a, b) => b.cantidad - a.cantidad)[0];
      const total = demanda(s);
      const motivos: string[] = [];
      if (total > 0) {
        motivos.push(
          principal && principal.cantidad < total
            ? `${plural(total, "solicitud pendiente", "solicitudes pendientes")} (${numero(principal.cantidad)} de ${principal.nombre.toLowerCase()})`
            : `${plural(total, "solicitud pendiente", "solicitudes pendientes")} de ${principal.nombre.toLowerCase()}`,
        );
      }
      if (s.reportes90 > 0) motivos.push(`${plural(s.reportes90, "reporte", "reportes")} en los últimos 90 días`);
      motivos.push(
        s.diasSinIntervencion === null
          ? "Sin operativos registrados"
          : `${plural(s.diasSinIntervencion, "día", "días")} desde el último operativo`,
      );
      if (s.noCubierta > 0) {
        motivos.push(`${plural(s.noCubierta, "persona quedó", "personas quedaron")} sin cupo en el último operativo`);
      }

      const nivel = nivelDe(puntaje);
      const recomendacion = recomendacionDe(nivel, principal?.cantidad ? principal.nombre : null);

      const registros = total + s.reportes90;
      return {
        sectorId: s.sectorId,
        nombre: s.nombre,
        puntaje,
        nivel,
        factores,
        demanda: total,
        motivos,
        recomendacion,
        registros,
        confianza: confianzaDe(registros),
      };
    })
    .sort((a, b) => b.puntaje - a.puntaje);
}

/** Pesos en puntos porcentuales enteros (lo que muestra el simulador) → fracciones. */
export const pesosDesdePorcentajes = (p: Pesos): Pesos => ({ demanda: p.demanda / 100, reportes: p.reportes / 100, tiempo: p.tiempo / 100, noCubierta: p.noCubierta / 100 });

/** Cada peso entre 0 y 100, enteros, y la suma exactamente 100 (sección 12). */
export function pesosValidos(porcentajes: Pesos): boolean {
  const v = Object.values(porcentajes);
  return v.every((x) => Number.isInteger(x) && x >= 0 && x <= 100) && v.reduce((t, x) => t + x, 0) === 100;
}
