// «Lo que piden los vecinos»: un resumen simple de lo que la ciudadanía hace en
// el portal (solicitudes, avisos, reportes, adopciones, operativos y perros
// comunitarios). Cifras directas, sin índices.
import "server-only";
import { CUPO_OCUPA } from "@/dominio/cupos";
import { SOLICITUD_PENDIENTE } from "@/dominio/solicitudes";
import { municipioActivo } from "@/lib/municipio";
import { COMUNITARIO_PUBLICO, FICHA_PUBLICA, PUBLICACION_CON_FOTO } from "@/servidor/conFoto";
import { db } from "@/servidor/db";

const DIA = 86_400_000;

export async function loQuePidenLosVecinos() {
  const municipioId = municipioActivo().id;
  const enMunicipio = { sector: { municipioId } };
  const hace30 = new Date(Date.now() - 30 * DIA);
  const [servicios, sectores, solicitudes, avisos, reportes, tiposReporte, postulaciones, fichas, inscritos, comunitarios] = await Promise.all([
    db.servicio.findMany({ where: { municipioId }, select: { id: true, nombre: true } }),
    db.sector.findMany({ where: { municipioId }, select: { id: true, nombre: true }, orderBy: { orden: "asc" } }),
    db.solicitudServicio.groupBy({ by: ["servicioId", "sectorId"], where: { estado: { in: [...SOLICITUD_PENDIENTE] }, ...enMunicipio }, _count: { _all: true } }),
    db.publicacionMascota.groupBy({ by: ["tipo", "sectorId"], where: { estado: "ABIERTA", moderacion: "APROBADA", ...PUBLICACION_CON_FOTO, ...enMunicipio }, _count: { _all: true } }),
    db.reporteCiudadano.groupBy({ by: ["tipoId", "sectorId"], where: { creadoEn: { gte: hace30 }, ...enMunicipio }, _count: { _all: true } }),
    db.tipoReporte.findMany({ where: { municipioId }, select: { id: true, nombre: true } }),
    db.postulacionAdopcion.count({ where: { estado: { in: ["RECIBIDA", "EN_EVALUACION"] } } }),
    db.fichaAdopcion.count({ where: FICHA_PUBLICA }),
    db.cupo.count({ where: { estado: { in: [...CUPO_OCUPA] }, operativo: { estado: { in: ["PUBLICADO", "INSCRIPCIONES_CERRADAS"] }, ...enMunicipio } } }),
    db.perroComunitario.count({ where: { ...COMUNITARIO_PUBLICO, ...enMunicipio } }),
  ]);
  const suma = <T extends { _count: { _all: number } }>(xs: T[]) => xs.reduce((t, x) => t + x._count._all, 0);

  // Qué servicios piden, de más a menos.
  const porServicio = servicios
    .map((s) => ({ nombre: s.nombre, cantidad: suma(solicitudes.filter((x) => x.servicioId === s.id)) }))
    .filter((x) => x.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad);
  // Qué pasa en cada sector.
  const porSector = sectores
    .map((s) => ({
      nombre: s.nombre,
      solicitudes: suma(solicitudes.filter((x) => x.sectorId === s.id)),
      avisos: suma(avisos.filter((x) => x.sectorId === s.id)),
      reportes: suma(reportes.filter((x) => x.sectorId === s.id)),
    }))
    .filter((x) => x.solicitudes + x.avisos + x.reportes > 0)
    .sort((a, b) => b.solicitudes + b.reportes + b.avisos - (a.solicitudes + a.reportes + a.avisos));
  // Qué reportan por SOS en 30 días.
  const porTipo = tiposReporte
    .map((t) => ({ nombre: t.nombre, cantidad: suma(reportes.filter((x) => x.tipoId === t.id)) }))
    .filter((x) => x.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad);

  return {
    cifras: {
      solicitudes: suma(solicitudes),
      perdidas: suma(avisos.filter((x) => x.tipo === "PERDIDA")),
      avistadas: suma(avisos.filter((x) => x.tipo === "ENCONTRADA")),
      reportes: suma(reportes),
      postulaciones,
      fichas,
      inscritos,
      comunitarios,
    },
    porServicio,
    porSector,
    porTipo,
  };
}
