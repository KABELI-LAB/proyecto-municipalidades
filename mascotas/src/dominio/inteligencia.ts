// Inteligencia territorial: pérdidas por mes y alerta preventiva
// (docs/concepto.md, secciones 11 y 15). Todo se calcula desde los registros.

/** Meses en que aumentan las pérdidas (fuegos artificiales): enero y septiembre. */
export const MESES_DE_RIESGO = [1, 9] as const;
/** La alerta se propone con esta anticipación al inicio del mes de riesgo. */
export const DIAS_ANTICIPACION = 30;

const DIA = 86_400_000;
const NOMBRE_MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «2026-09» → «septiembre de 2026». */
export const nombreMes = (mes: string) => `${NOMBRE_MES[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`;

const sumarDias = (dia: string, n: number) => {
  const d = new Date(`${dia}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Los últimos 12 meses hasta el de `hoy`, del más antiguo al más reciente («2025-11» … «2026-10»). */
export function ultimos12Meses(hoy: string): string[] {
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(anio, mes - 1 - (11 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

/** Cuenta registros por mes («YYYY-MM») en los últimos 12 meses, con ceros donde no hubo. */
export function porMes(hoy: string, meses: string[]): { mes: string; cantidad: number }[] {
  const conteo = new Map<string, number>();
  for (const m of meses) conteo.set(m, (conteo.get(m) ?? 0) + 1);
  return ultimos12Meses(hoy).map((mes) => ({ mes, cantidad: conteo.get(mes) ?? 0 }));
}

export type PerdidaSector = { mes: string; sectorId: string; sector: string };

export type AlertaPreventiva = {
  /** Mes de riesgo que viene («2027-01»). */
  mesObjetivo: string;
  /** Mismo mes del año anterior, que se usa como referencia («2026-01»). */
  mesReferencia: string;
  /** Día desde el que se propone el aviso (30 días antes del mes de riesgo). */
  activaDesde: string;
  activa: boolean;
  diasParaActivar: number;
  totalReferencia: number;
  /** Sectores propuestos: los que, de mayor a menor, suman al menos la mitad de las pérdidas de referencia. */
  sectores: { sectorId: string; sector: string; perdidas: number }[];
  /** Todos los sectores con pérdidas en el mes de referencia, para mostrar las cifras. */
  detalle: { sectorId: string; sector: string; perdidas: number }[];
};

/**
 * Próximo mes de riesgo (enero o septiembre) desde `hoy` y la propuesta de
 * aviso: dirigida a los sectores con más pérdidas ese mes el año anterior.
 */
export function alertaPreventiva(hoy: string, perdidas: PerdidaSector[]): AlertaPreventiva {
  const anio = Number(hoy.slice(0, 4));
  const candidatos = [anio, anio + 1].flatMap((a) => MESES_DE_RIESGO.map((m) => `${a}-${String(m).padStart(2, "0")}`));
  // El próximo mes de riesgo que aún no empieza (si hoy ya está dentro de uno, se pasa al siguiente).
  const mesObjetivo = candidatos.find((m) => `${m}-01` > hoy)!;
  const mesReferencia = `${Number(mesObjetivo.slice(0, 4)) - 1}${mesObjetivo.slice(4)}`;
  const activaDesde = sumarDias(`${mesObjetivo}-01`, -DIAS_ANTICIPACION);

  const porSector = new Map<string, { sectorId: string; sector: string; perdidas: number }>();
  for (const p of perdidas.filter((x) => x.mes === mesReferencia)) {
    const s = porSector.get(p.sectorId) ?? { sectorId: p.sectorId, sector: p.sector, perdidas: 0 };
    s.perdidas++;
    porSector.set(p.sectorId, s);
  }
  const detalle = [...porSector.values()].sort((a, b) => b.perdidas - a.perdidas || a.sector.localeCompare(b.sector));
  const total = detalle.reduce((t, s) => t + s.perdidas, 0);

  const sectores: typeof detalle = [];
  let acumulado = 0;
  for (const s of detalle) {
    if (acumulado * 2 >= total) break;
    sectores.push(s);
    acumulado += s.perdidas;
  }

  const diasParaActivar = Math.round((Date.parse(`${activaDesde}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / DIA);
  return { mesObjetivo, mesReferencia, activaDesde, activa: diasParaActivar <= 0, diasParaActivar: Math.max(0, diasParaActivar), totalReferencia: total, sectores, detalle };
}

/** Último día del mes («2027-01» → «2027-01-31»). */
export function finDeMes(mes: string): string {
  const d = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0));
  return d.toISOString().slice(0, 10);
}

/**
 * Borrador del aviso preventivo, en el estilo de los avisos de campaña. Lo
 * revisa y publica Comunicaciones; vigente desde que se activa la alerta (o
 * desde hoy, si ya pasó esa fecha) hasta el fin del mes de riesgo.
 */
export function avisoPreventivo(a: Pick<AlertaPreventiva, "mesObjetivo" | "activaDesde">, hoy: string) {
  const mes = NOMBRE_MES[Number(a.mesObjetivo.slice(5, 7)) - 1];
  return {
    titulo: `Antes de ${mes}, identifique a su mascota`,
    texto: `En ${mes} suelen aumentar las mascotas perdidas. Le recomendamos usar collar con placa y mantenerla en un lugar seguro durante las celebraciones con fuegos artificiales.`,
    desde: a.activaDesde > hoy ? a.activaDesde : hoy,
    hasta: finDeMes(a.mesObjetivo),
  };
}
