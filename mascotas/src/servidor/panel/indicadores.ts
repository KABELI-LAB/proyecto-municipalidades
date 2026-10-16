// Cifras del panel municipal. Todo se calcula desde los registros: las cifras
// del escenario de demostración no están escritas en ningún lugar.
//
// Las ventanas se cuentan en días de calendario respecto de `hoy` (por defecto,
// hoy en la zona del municipio), como en demo/generar.py. Así las cifras
// coinciden con demo/datos/resumen.json y prioridad.json, y las pruebas pueden
// fijar la fecha de corte.
import "server-only";
import { CUPO_OCUPA } from "@/dominio/cupos";
import { diasEntre, mesCorto } from "@/dominio/formato";
import { calcularPrioridad, type FactoresSector, type Prioridad } from "@/dominio/prioridad";
import { SOLICITUD_PENDIENTE } from "@/dominio/solicitudes";
import { ultimos12Meses } from "@/dominio/inteligencia";
import { municipioActivo } from "@/lib/municipio";
import { FICHA_CON_FOTO, PUBLICACION_CON_FOTO } from "@/servidor/conFoto";
import { db } from "@/servidor/db";
import { diaISO, hoyISO, inicioDeHoy, ventana } from "@/servidor/formato";

const municipioId = () => municipioActivo().id;

export type Periodo = 30 | 90 | 365;
/** Factor R de la prioridad: reportes de los últimos 90 días (incluye el día 90). */
const DIAS_REPORTES_PRIORIDAD = 91;

export type Especie = "PERRO" | "GATO" | "OTRA";

// ───────────── Prioridad por sector ─────────────

export async function factoresPorSector(hoy = hoyISO()): Promise<FactoresSector[]> {
  const sectores = await db.sector.findMany({ where: { municipioId: municipioId() }, orderBy: { orden: "asc" } });
  const servicios = await db.servicio.findMany({ where: { municipioId: municipioId() }, orderBy: { nombre: "asc" } });
  const v90 = ventana(DIAS_REPORTES_PRIORIDAD, hoy);

  const pendientes = await db.solicitudServicio.groupBy({
    by: ["sectorId", "servicioId"],
    where: { estado: { in: [...SOLICITUD_PENDIENTE] }, sector: { municipioId: municipioId() } },
    _count: { _all: true },
  });
  const reportes = await db.reporteCiudadano.groupBy({
    by: ["sectorId"],
    where: { creadoEn: { gte: v90.desde, lt: v90.hasta }, sector: { municipioId: municipioId() } },
    _count: { _all: true },
  });
  const cerrados = await db.operativo.findMany({
    where: { estado: "CERRADO", sector: { municipioId: municipioId() } },
    orderBy: { fecha: "desc" },
    include: { resultado: true },
  });

  return sectores.map((s) => {
    const ultimo = cerrados.find((o) => o.sectorId === s.id);
    return {
      sectorId: s.id,
      nombre: s.nombre,
      demandaPorServicio: servicios.map((sv) => ({
        nombre: sv.nombre,
        cantidad: pendientes.find((p) => p.sectorId === s.id && p.servicioId === sv.id)?._count._all ?? 0,
      })),
      reportes90: reportes.find((r) => r.sectorId === s.id)?._count._all ?? 0,
      // Días de calendario; nunca negativo, aunque un operativo se cierre antes de su fecha.
      diasSinIntervencion: ultimo ? Math.max(0, diasEntre(diaISO(ultimo.fecha), hoy)) : null,
      noCubierta: ultimo?.resultado?.demandaNoCubierta ?? 0,
    };
  });
}

export async function pesosPrioridad() {
  const m = await db.municipio.findUniqueOrThrow({ where: { id: municipioId() } });
  return { demanda: m.pesoDemanda, reportes: m.pesoReportes, tiempo: m.pesoTiempo, noCubierta: m.pesoNoCubierta };
}

export async function prioridades(hoy = hoyISO()): Promise<(Prioridad & { clave: string })[]> {
  const claves = new Map((await db.sector.findMany({ where: { municipioId: municipioId() } })).map((s) => [s.id, s.clave]));
  return calcularPrioridad(await factoresPorSector(hoy), await pesosPrioridad()).map((p) => ({ ...p, clave: claves.get(p.sectorId)! }));
}

// ───────────── Resumen ─────────────

/** Bandeja de pendientes de revisión. */
export async function pendientesDeRevision() {
  const [reportes, publicaciones, coincidencias, postulaciones, propuestas] = await Promise.all([
    db.reporteCiudadano.count({ where: { estado: "ABIERTO", sector: { municipioId: municipioId() } } }),
    // Las bandejas muestran solo animales con foto y cuentan lo mismo que muestran.
    db.publicacionMascota.count({ where: { moderacion: "PENDIENTE", estado: "ABIERTA", ...PUBLICACION_CON_FOTO } }),
    db.coincidencia.count({ where: { estado: "SUGERIDA", perdida: { estado: "ABIERTA", ...PUBLICACION_CON_FOTO }, encontrada: { estado: "ABIERTA", ...PUBLICACION_CON_FOTO } } }),
    // Postulaciones que esperan respuesta: recibidas y en evaluación.
    // Solo fichas del municipio: las de vecinos las responde quien las propuso.
    db.postulacionAdopcion.count({ where: { estado: { in: ["RECIBIDA", "EN_EVALUACION"] }, ficha: { ...FICHA_CON_FOTO, proponenteId: null } } }),
    // Propuestas de «Dar en adopción» que esperan revisión.
    db.fichaAdopcion.count({ where: { revision: "PENDIENTE", proponente: { municipioId: municipioId() }, ...FICHA_CON_FOTO } }),
  ]);
  return { reportes, publicaciones, coincidencias, postulaciones, propuestas };
}

/** Operativos próximos (borradores incluidos) con ocupación de cupos por servicio. */
export async function proximosOperativos(filtro: { sectorId?: string } = {}) {
  const operativos = await db.operativo.findMany({
    where: {
      estado: { in: ["BORRADOR", "PUBLICADO", "INSCRIPCIONES_CERRADAS", "EN_CURSO"] },
      fecha: { gte: inicioDeHoy() },
      sector: { municipioId: municipioId() },
      ...(filtro.sectorId ? { sectorId: filtro.sectorId } : {}),
    },
    include: { sector: true, lugar: true, capacidades: { include: { servicio: true } } },
    orderBy: { fecha: "asc" },
  });
  return conOcupacion(operativos);
}

export async function conOcupacion<T extends { id: string; capacidades: { servicioId: string; cupos: number; servicio: { nombre: string; clave: string } }[] }>(operativos: T[]) {
  const conteo = await db.cupo.groupBy({
    by: ["operativoId", "servicioId", "estado"],
    where: { operativoId: { in: operativos.map((o) => o.id) } },
    _count: { _all: true },
  });
  const contar = (op: string, sv: string, estados: readonly string[]) =>
    conteo.filter((c) => c.operativoId === op && c.servicioId === sv && estados.includes(c.estado)).reduce((t, c) => t + c._count._all, 0);
  // Invitaciones prioritarias abiertas: retienen cupo sin ocuparlo.
  const invitaciones = await db.invitacionOperativo.groupBy({
    by: ["operativoId", "servicioId"],
    where: { operativoId: { in: operativos.map((o) => o.id) }, estado: { in: ["ENVIADA", "INTERESADA"] } },
    _count: { _all: true },
  });
  const retenidos = (op: string, sv: string) => invitaciones.find((i) => i.operativoId === op && i.servicioId === sv)?._count._all ?? 0;
  return operativos.map((o) => ({
    ...o,
    ocupacion: o.capacidades.map((c) => ({
      servicioId: c.servicioId,
      clave: c.servicio.clave,
      nombre: c.servicio.nombre,
      capacidad: c.cupos,
      ocupados: contar(o.id, c.servicioId, CUPO_OCUPA),
      invitados: contar(o.id, c.servicioId, ["INVITADO"]),
      espera: contar(o.id, c.servicioId, ["EN_LISTA_ESPERA"]),
      retenidos: retenidos(o.id, c.servicioId),
    })),
  }));
}

/** Solicitudes recibidas y atenciones realizadas por mes, últimos 12 meses. */
export async function tendencia(especie?: Especie, hoy = hoyISO()) {
  const zona = municipioActivo().zonaHoraria;
  const meses = ultimos12Meses(hoy);
  const v = ventana(diasEntre(`${meses[0]}-01`, hoy) + 1, hoy);
  const animal = especie ? { animal: { especie } } : {};
  const [solicitudes, atenciones] = await Promise.all([
    db.solicitudServicio.findMany({ where: { creadaEn: { gte: v.desde, lt: v.hasta }, sector: { municipioId: municipioId() }, ...animal }, select: { creadaEn: true } }),
    db.atencion.findMany({ where: { resultado: "REALIZADA", realizadaEn: { gte: v.desde, lt: v.hasta }, sector: { municipioId: municipioId() }, ...(especie ? { especie } : {}) }, select: { realizadaEn: true } }),
  ]);
  // Se cuenta en una sola pasada: el mes de cada registro se calcula una vez.
  const contar = (fechas: Date[]) => {
    const conteo = new Map<string, number>();
    for (const f of fechas) {
      const m = diaISO(f).slice(0, 7);
      conteo.set(m, (conteo.get(m) ?? 0) + 1);
    }
    return conteo;
  };
  const porMesSolicitudes = contar(solicitudes.map((s) => s.creadaEn));
  const porMesAtenciones = contar(atenciones.map((a) => a.realizadaEn));
  return meses.map((m) => ({
    mes: m,
    etiqueta: mesCorto(new Date(`${m}-15T12:00:00Z`), zona),
    solicitudes: porMesSolicitudes.get(m) ?? 0,
    atenciones: porMesAtenciones.get(m) ?? 0,
  }));
}

// ───────────── Ficha de sector ─────────────

