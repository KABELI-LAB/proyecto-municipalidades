// Ciclo de un operativo (docs/concepto.md, sección 5).
//
//   Borrador → Publicado → Inscripciones cerradas → En curso → Cerrado
//   Antes de «En curso» puede pasar a Cancelado.

export type EstadoOperativo = "BORRADOR" | "PUBLICADO" | "INSCRIPCIONES_CERRADAS" | "EN_CURSO" | "CERRADO" | "CANCELADO";

export type Transicion = "publicar" | "cerrarInscripciones" | "reabrirInscripciones" | "iniciar" | "cerrar" | "cancelar";

const DESTINO: Record<Transicion, { desde: EstadoOperativo[]; hacia: EstadoOperativo }> = {
  publicar: { desde: ["BORRADOR"], hacia: "PUBLICADO" },
  cerrarInscripciones: { desde: ["PUBLICADO"], hacia: "INSCRIPCIONES_CERRADAS" },
  reabrirInscripciones: { desde: ["INSCRIPCIONES_CERRADAS"], hacia: "PUBLICADO" },
  iniciar: { desde: ["PUBLICADO", "INSCRIPCIONES_CERRADAS"], hacia: "EN_CURSO" },
  cerrar: { desde: ["EN_CURSO"], hacia: "CERRADO" },
  cancelar: { desde: ["BORRADOR", "PUBLICADO", "INSCRIPCIONES_CERRADAS"], hacia: "CANCELADO" },
};

export function puedeTransitar(estado: EstadoOperativo, t: Transicion): boolean {
  return DESTINO[t].desde.includes(estado);
}

export function destinoDe(t: Transicion): EstadoOperativo {
  return DESTINO[t].hacia;
}

export function transicionesPosibles(estado: EstadoOperativo): Transicion[] {
  return (Object.keys(DESTINO) as Transicion[]).filter((t) => puedeTransitar(estado, t));
}

/** Solo un borrador se edita libremente; después, los cambios se comunican con un aviso. */
export const esEditable = (estado: EstadoOperativo) => estado === "BORRADOR";

/** Durante la ejecución se registran asistencia y atenciones. */
export const enEjecucion = (estado: EstadoOperativo) => estado === "EN_CURSO";

/**
 * Cupos sugeridos para un servicio según la demanda pendiente del sector:
 * pendientes × 1,5 (margen para inscripciones nuevas), redondeado hacia arriba
 * a múltiplos de 5, con un mínimo de 10.
 */
export function capacidadSugerida(pendientes: number): number {
  return Math.max(10, Math.ceil((pendientes * 1.5) / 5) * 5);
}

export type CupoParaCierre = { servicio: string; estado: string };
export type AtencionParaCierre = { servicio: string; resultado: string };

export type Resultado = {
  inscritos: number;
  asistentes: number;
  atenciones: number;
  porServicio: Record<string, number>;
  demandaNoCubierta: number;
};

/**
 * Resultado de un operativo al cerrarlo. Los inscritos que no se marcaron
 * como presentes cuentan como inasistencias; quienes siguen en lista de
 * espera son la demanda no cubierta.
 */
export function calcularResultado(cupos: CupoParaCierre[], atenciones: AtencionParaCierre[]): Resultado {
  const inscritos = cupos.filter((c) => ["INVITADO", "CONFIRMADO", "ASISTIO", "NO_ASISTIO"].includes(c.estado)).length;
  const asistentes = cupos.filter((c) => c.estado === "ASISTIO").length;
  const realizadas = atenciones.filter((a) => a.resultado === "REALIZADA");
  const porServicio: Record<string, number> = {};
  for (const a of realizadas) porServicio[a.servicio] = (porServicio[a.servicio] ?? 0) + 1;
  return {
    inscritos,
    asistentes,
    atenciones: realizadas.length,
    porServicio,
    demandaNoCubierta: cupos.filter((c) => c.estado === "EN_LISTA_ESPERA").length,
  };
}
