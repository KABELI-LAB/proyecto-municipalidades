// Hallazgos de la minuta y del correo semanal: tres reglas fijas y
// explicables, calculadas con los registros. Si los datos no alcanzan para una
// regla, el hallazgo no se muestra (nunca se inventa una cifra).

export type DemandaSectorServicio = { sector: string; servicio: string; cantidad: number };

/** El sector que concentra la mayor parte de la demanda pendiente del servicio más pedido. */
export function concentracionDemanda(demanda: DemandaSectorServicio[]) {
  const porServicio = new Map<string, number>();
  for (const d of demanda) porServicio.set(d.servicio, (porServicio.get(d.servicio) ?? 0) + d.cantidad);
  const [servicio, total] = [...porServicio.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!servicio || !total) return null;
  const mayor = demanda.filter((d) => d.servicio === servicio).sort((a, b) => b.cantidad - a.cantidad)[0];
  return { servicio, sector: mayor.sector, cantidad: mayor.cantidad, total, fraccion: mayor.cantidad / total };
}

/** El sector con más días sin operativo, frente al que tiene menos. */
export function brechaIntervencion(sectores: { sector: string; dias: number | null }[]) {
  const con = sectores.filter((s): s is { sector: string; dias: number } => s.dias !== null).sort((a, b) => b.dias - a.dias);
  if (con.length < 2) return null;
  return { mayor: con[0], menor: con[con.length - 1] };
}

/** El mes con más pérdidas, frente al promedio de los demás meses de la serie. */
export function mesPico(meses: { mes: string; cantidad: number }[]) {
  if (meses.length < 2) return null;
  const pico = [...meses].sort((a, b) => b.cantidad - a.cantidad)[0];
  const resto = meses.filter((m) => m !== pico);
  const promedioResto = resto.reduce((t, m) => t + m.cantidad, 0) / resto.length;
  if (pico.cantidad === 0 || promedioResto === 0) return null;
  return { mes: pico.mes, cantidad: pico.cantidad, promedioResto, veces: pico.cantidad / promedioResto };
}
