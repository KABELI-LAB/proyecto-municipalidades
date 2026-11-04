// Cifras que usa el portal en el retrato de la comuna (impacto del programa).
// Todo se calcula desde los registros.
import "server-only";
import { municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { hoyISO, ventana } from "@/servidor/formato";

const municipioId = async () => (await municipioActivo()).id;

/**
 * Lo que hizo el programa en los últimos 12 meses (portal, retrato de la
 * comuna): operativos realizados, atenciones por servicio, adopciones y
 * mascotas que volvieron a casa. Cifras agregadas de toda la comuna.
 */
export async function impactoDelPrograma(hoy = hoyISO()) {
  const v12 = ventana(365, hoy);
  const enAnio = { gte: v12.desde, lt: v12.hasta };
  const enMunicipio = { sector: { municipioId: (await municipioId()) } };
  const [operativos, porServicio, servicios, adopciones, reencuentros] = await Promise.all([
    db.operativo.count({ where: { estado: "CERRADO", fecha: enAnio, ...enMunicipio } }),
    db.atencion.groupBy({ by: ["servicioId"], where: { resultado: "REALIZADA", realizadaEn: enAnio, ...enMunicipio }, _count: { _all: true } }),
    db.servicio.findMany({ where: { municipioId: (await municipioId()) }, orderBy: { nombre: "asc" } }),
    db.fichaAdopcion.count({ where: { estado: "ADOPTADO", adoptadaEn: enAnio, municipioId: (await municipioId()) } }),
    db.publicacionMascota.count({ where: { tipo: "PERDIDA", estado: "REENCONTRADA", resueltaEn: enAnio, ...enMunicipio } }),
  ]);
  const atenciones = servicios
    .map((s) => ({ servicio: s.nombre, cantidad: porServicio.find((x) => x.servicioId === s.id)?._count._all ?? 0 }))
    .filter((x) => x.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad);
  return { operativos, atenciones: atenciones.reduce((t, x) => t + x.cantidad, 0), atencionesPorServicio: atenciones, adopciones, reencuentros };
}

