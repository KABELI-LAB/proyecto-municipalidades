// Cifras que usa el portal (retrato de la comuna e impacto del programa).
// Todo se calcula desde los registros.
import "server-only";
import { municipioActivo } from "@/lib/municipio";
import { COMUNITARIO_PUBLICO } from "@/servidor/conFoto";
import { db } from "@/servidor/db";
import { hoyISO, ventana } from "@/servidor/formato";

const municipioId = () => municipioActivo().id;

/**
 * Retrato de la comuna (portal, inicio): cifras sobre los animales registrados
 * en la plataforma, no sobre la población total de la comuna.
 */
export async function retratoComuna(hoy = hoyISO()) {
  const v12 = ventana(365, hoy);
  const [animales, perros, gatos, esterilizados, conMicrochip, reencuentros, comunitarios] = await Promise.all([
    db.animal.count(),
    db.animal.count({ where: { especie: "PERRO" } }),
    db.animal.count({ where: { especie: "GATO" } }),
    db.animal.count({ where: { esterilizado: true } }),
    db.animal.count({ where: { microchip: true } }),
    db.publicacionMascota.count({ where: { tipo: "PERDIDA", estado: "REENCONTRADA", resueltaEn: { gte: v12.desde, lt: v12.hasta } } }),
    // Los perros comunitarios se cuentan como se muestran: con foto y sin ocultar.
    db.perroComunitario.count({ where: { sector: { municipioId: municipioId() }, ...COMUNITARIO_PUBLICO } }),
  ]);
  return { animales, perros, gatos, esterilizados, conMicrochip, reencuentros, comunitarios };
}

/**
 * Lo que hizo el programa en los últimos 12 meses (portal, retrato de la
 * comuna): operativos realizados, atenciones por servicio, adopciones y
 * mascotas que volvieron a casa. Cifras agregadas de toda la comuna.
 */
export async function impactoDelPrograma(hoy = hoyISO()) {
  const v12 = ventana(365, hoy);
  const enAnio = { gte: v12.desde, lt: v12.hasta };
  const enMunicipio = { sector: { municipioId: municipioId() } };
  const [operativos, porServicio, servicios, adopciones, reencuentros] = await Promise.all([
    db.operativo.count({ where: { estado: "CERRADO", fecha: enAnio, ...enMunicipio } }),
    db.atencion.groupBy({ by: ["servicioId"], where: { resultado: "REALIZADA", realizadaEn: enAnio, ...enMunicipio }, _count: { _all: true } }),
    db.servicio.findMany({ where: { municipioId: municipioId() }, orderBy: { nombre: "asc" } }),
    db.fichaAdopcion.count({ where: { estado: "ADOPTADO", adoptadaEn: enAnio } }),
    db.publicacionMascota.count({ where: { tipo: "PERDIDA", estado: "REENCONTRADA", resueltaEn: enAnio, ...enMunicipio } }),
  ]);
  const atenciones = servicios
    .map((s) => ({ servicio: s.nombre, cantidad: porServicio.find((x) => x.servicioId === s.id)?._count._all ?? 0 }))
    .filter((x) => x.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad);
  return { operativos, atenciones: atenciones.reduce((t, x) => t + x.cantidad, 0), atencionesPorServicio: atenciones, adopciones, reencuentros };
}

