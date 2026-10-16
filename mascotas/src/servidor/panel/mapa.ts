// Datos del mapa del panel (docs/concepto.md, sección 11): por sector y por
// mes de los últimos 12, para recorrerlos con la línea de tiempo sin volver
// a consultar. Los reportes van como puntos solo para calcular el calor.
import "server-only";
import { diasEntre, mesCorto } from "@/dominio/formato";
import { nombreMes, ultimos12Meses } from "@/dominio/inteligencia";
import { punto, type Punto } from "@/dominio/geo";
import { SOLICITUD_PENDIENTE } from "@/dominio/solicitudes";
import { municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { diaISO, hoyISO, ventana } from "@/servidor/formato";
import { factoresPorSector, prioridades } from "@/servidor/panel/indicadores";

export type CapaTemporal = "reportes" | "perdidas" | "atenciones" | "adopciones" | "operativos";

export type DatosMapa = {
  meses: { mes: string; etiqueta: string; nombre: string }[];
  localidades: { nombre: string; lat: number; lng: number }[];
  sectores: {
    clave: string;
    nombre: string;
    centro: Punto | null;
    nivel: "ALTA" | "MEDIA" | "BAJA";
    puntaje: number;
    pendientes: number;
    pendientesPorServicio: { nombre: string; cantidad: number }[];
    diasSinIntervencion: number | null;
    /** Cantidad por mes (12 valores) de cada capa con línea de tiempo. */
    porMes: Record<CapaTemporal, number[]>;
    /** Publicaciones resueltas (reencuentros) por mes, para el % de la capa de pérdidas. */
    resueltasPorMes: number[];
  }[];
  /** Reportes: posición aproximada y mes (índice 0–11), solo para el calor. */
  reportes: { lat: number; lng: number; m: number }[];
};

export async function datosMapa(hoy = hoyISO()): Promise<DatosMapa> {
  const m = municipioActivo();
  const meses = ultimos12Meses(hoy);
  const v = ventana(diasEntre(`${meses[0]}-01`, hoy) + 1, hoy);
  const rango = { gte: v.desde, lt: v.hasta };
  const enMunicipio = { sector: { municipioId: m.id } };
  const indice = (f: Date) => meses.indexOf(diaISO(f).slice(0, 7));

  const [sectores, factores, ranking, pendientes, reportes, publicaciones, atenciones, adopciones, operativos] = await Promise.all([
    db.sector.findMany({ where: { municipioId: m.id }, orderBy: { orden: "asc" }, include: { localidades: { select: { nombre: true, lat: true, lng: true } } } }),
    factoresPorSector(hoy),
    prioridades(hoy),
    db.solicitudServicio.groupBy({ by: ["sectorId"], where: { estado: { in: [...SOLICITUD_PENDIENTE] }, ...enMunicipio }, _count: { _all: true } }),
    db.reporteCiudadano.findMany({ where: { creadoEn: rango, ...enMunicipio }, select: { sectorId: true, creadoEn: true, lat: true, lng: true } }),
    db.publicacionMascota.findMany({ where: { fechaEvento: rango, ...enMunicipio }, select: { sectorId: true, fechaEvento: true, estado: true } }),
    db.atencion.findMany({ where: { resultado: "REALIZADA", realizadaEn: rango, ...enMunicipio }, select: { sectorId: true, realizadaEn: true } }),
    db.fichaAdopcion.findMany({ where: { estado: "ADOPTADO", adoptadaEn: rango, sectorAdoptante: { municipioId: m.id } }, select: { sectorAdoptanteId: true, adoptadaEn: true } }),
    db.operativo.findMany({ where: { estado: "CERRADO", fecha: rango, ...enMunicipio }, select: { sectorId: true, fecha: true } }),
  ]);

  const serie = <T,>(registros: T[], sector: (r: T) => string | null, fecha: (r: T) => Date | null, sectorId: string) => {
    const valores = Array<number>(12).fill(0);
    for (const r of registros) {
      const f = fecha(r);
      if (sector(r) !== sectorId || !f) continue;
      const i = indice(f);
      if (i >= 0) valores[i]++;
    }
    return valores;
  };

  return {
    meses: meses.map((mes) => ({ mes, etiqueta: mesCorto(new Date(`${mes}-15T12:00:00Z`), m.zonaHoraria), nombre: nombreMes(mes) })),
    localidades: sectores.flatMap((s) => s.localidades.flatMap((l) => (l.lat != null && l.lng != null ? [{ nombre: l.nombre, lat: l.lat, lng: l.lng }] : []))),
    sectores: sectores.map((s) => {
      const f = factores.find((x) => x.sectorId === s.id)!;
      const p = ranking.find((x) => x.sectorId === s.id)!;
      return {
        clave: s.clave,
        nombre: s.nombre,
        centro: punto(s.centroLat, s.centroLng),
        nivel: p.nivel,
        puntaje: p.puntaje,
        pendientes: pendientes.find((x) => x.sectorId === s.id)?._count._all ?? 0,
        pendientesPorServicio: f.demandaPorServicio,
        diasSinIntervencion: f.diasSinIntervencion,
        porMes: {
          reportes: serie(reportes, (r) => r.sectorId, (r) => r.creadoEn, s.id),
          perdidas: serie(publicaciones, (r) => r.sectorId, (r) => r.fechaEvento, s.id),
          atenciones: serie(atenciones, (r) => r.sectorId, (r) => r.realizadaEn, s.id),
          adopciones: serie(adopciones, (r) => r.sectorAdoptanteId, (r) => r.adoptadaEn, s.id),
          operativos: serie(operativos, (r) => r.sectorId, (r) => r.fecha, s.id),
        },
        resueltasPorMes: serie(publicaciones.filter((p) => p.estado === "REENCONTRADA"), (r) => r.sectorId, (r) => r.fechaEvento, s.id),
      };
    }),
    reportes: reportes.flatMap((r) => (r.lat != null && r.lng != null ? [{ lat: r.lat, lng: r.lng, m: indice(r.creadoEn) }] : [])).filter((r) => r.m >= 0),
  };
}
