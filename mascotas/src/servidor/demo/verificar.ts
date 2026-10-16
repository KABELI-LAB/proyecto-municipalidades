// Comprueba que lo cargado reproduce demo/datos/resumen.json y los factores de
// prioridad.json. Las ventanas se cuentan en días calendario respecto de `hoy`,
// como lo hace demo/generar.py (por ejemplo, «30 días» = hoy y los 29 anteriores).
import type { PrismaClient } from "@/generated/prisma/client";
import { diaISO, medianocheEn } from "@/dominio/formato";
import { SOLICITUD_PENDIENTE } from "@/dominio/solicitudes";
import type { Municipio } from "@/lib/municipio";
import { leerDemo } from "@/servidor/demo/cargar";

type Resumen = {
  situacion_actual: { solicitudes_pendientes: number; reportes_recientes_30_dias: number; atenciones_realizadas_12_meses: number; adopciones_12_meses: number };
  retrato_comuna: { animales_en_plataforma: number; perros: number; gatos: number; esterilizados: number; con_microchip: number; reencuentros_12_meses: number; perros_comunitarios: number; comunitarios_que_necesitan_atencion: number };
  perdidas_por_mes: Record<string, number>;
};
type Prioridad = { sector_id: string; factores: { demanda_pendiente: number; reportes_90_dias: number; dias_sin_intervencion: number; demanda_no_cubierta: number } };

export type Fila = { cifra: string; esperado: number | string; obtenido: number | string };

const DIA = 86_400_000;

export async function verificarDemo(db: PrismaClient, municipio: Municipio, hoy: string, carpeta?: string) {
  const zona = municipio.zonaHoraria;
  const lote = await db.loteDemo.findFirst({ orderBy: { creadoEn: "desc" } });
  if (!lote) throw new Error("No hay datos de demostración cargados.");
  const loteDemoId = lote.id;
  const inicio = (diasAtras: number) => new Date(medianocheEn(hoy, zona).getTime() - diasAtras * DIA);
  const finDeHoy = new Date(medianocheEn(hoy, zona).getTime() + DIA);
  const resumen = leerDemo<Resumen>("resumen", carpeta);
  const prioridad = leerDemo<Prioridad[]>("prioridad", carpeta);

  const filas: Fila[] = [];
  const comparar = (cifra: string, esperado: number | string, obtenido: number | string) => filas.push({ cifra, esperado, obtenido });

  // Situación actual
  const s = resumen.situacion_actual;
  comparar("Solicitudes pendientes", s.solicitudes_pendientes, await db.solicitudServicio.count({ where: { loteDemoId, estado: { in: [...SOLICITUD_PENDIENTE] } } }));
  comparar("Reportes (30 días)", s.reportes_recientes_30_dias, await db.reporteCiudadano.count({ where: { loteDemoId, creadoEn: { gte: inicio(29), lt: finDeHoy } } }));
  comparar("Atenciones (12 meses)", s.atenciones_realizadas_12_meses, await db.atencion.count({ where: { loteDemoId, resultado: "REALIZADA", realizadaEn: { gte: inicio(364), lt: finDeHoy } } }));
  comparar("Adopciones (12 meses)", s.adopciones_12_meses, await db.fichaAdopcion.count({ where: { loteDemoId, estado: "ADOPTADO", adoptadaEn: { gte: inicio(364), lt: finDeHoy } } }));

  // Retrato de la comuna
  const r = resumen.retrato_comuna;
  const animales = { loteDemoId };
  comparar("Animales registrados", r.animales_en_plataforma, await db.animal.count({ where: animales }));
  comparar("Perros", r.perros, await db.animal.count({ where: { ...animales, especie: "PERRO" } }));
  comparar("Gatos", r.gatos, await db.animal.count({ where: { ...animales, especie: "GATO" } }));
  comparar("Esterilizados", r.esterilizados, await db.animal.count({ where: { ...animales, esterilizado: true } }));
  comparar("Con microchip", r.con_microchip, await db.animal.count({ where: { ...animales, microchip: true } }));
  comparar("Reencuentros", r.reencuentros_12_meses, await db.publicacionMascota.count({ where: { loteDemoId, tipo: "PERDIDA", estado: "REENCONTRADA" } }));
  comparar("Perros comunitarios", r.perros_comunitarios, await db.perroComunitario.count({ where: { loteDemoId } }));
  comparar("Comunitarios por atender", r.comunitarios_que_necesitan_atencion, await db.perroComunitario.count({ where: { loteDemoId, necesitaAtencion: true } }));

  // Pérdidas por mes: se cuentan con la fecha original (sin el traslado) para comparar meses.
  const perdidas = await db.publicacionMascota.findMany({ where: { loteDemoId, tipo: "PERDIDA" }, select: { fechaEvento: true } });
  const porMes: Record<string, number> = {};
  for (const p of perdidas) {
    const mes = diaISO(new Date(p.fechaEvento.getTime() - lote.desfaseDias * DIA), zona).slice(0, 7);
    porMes[mes] = (porMes[mes] ?? 0) + 1;
  }
  comparar("Pérdidas por mes", JSON.stringify(resumen.perdidas_por_mes), JSON.stringify(Object.fromEntries(Object.entries(porMes).sort())));

  // Factores de prioridad por sector
  for (const p of prioridad) {
    const sector = await db.sector.findUnique({ where: { municipioId_clave: { municipioId: municipio.id, clave: p.sector_id } } });
    if (!sector) {
      comparar(`${p.sector_id}: sector`, "existe", "no existe");
      continue;
    }
    const D = await db.solicitudServicio.count({ where: { loteDemoId, sectorId: sector.id, estado: { in: [...SOLICITUD_PENDIENTE] } } });
    const R = await db.reporteCiudadano.count({ where: { loteDemoId, sectorId: sector.id, creadoEn: { gte: inicio(90), lt: finDeHoy } } });
    const cerrados = await db.operativo.findMany({ where: { loteDemoId, sectorId: sector.id, estado: "CERRADO" }, include: { resultado: true }, orderBy: { fecha: "desc" } });
    const T = cerrados[0] ? Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${diaISO(cerrados[0].fecha, zona)}T00:00:00Z`)) / DIA) : "sin operativos";
    const E = cerrados.reduce((t, o) => t + (o.resultado?.demandaNoCubierta ?? 0), 0);
    const f = p.factores;
    comparar(`${p.sector_id}: pendientes`, f.demanda_pendiente, D);
    comparar(`${p.sector_id}: reportes 90 días`, f.reportes_90_dias, R);
    comparar(`${p.sector_id}: días sin operativo`, f.dias_sin_intervencion, T);
    comparar(`${p.sector_id}: sin cupo`, f.demanda_no_cubierta, E);
  }

  return { filas, ok: filas.every((f) => f.esperado === f.obtenido) };
}
