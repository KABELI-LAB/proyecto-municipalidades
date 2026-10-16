// Lecturas del portal ciudadano. Solo devuelven información pública
// (docs/concepto.md, sección 14): nunca nombres ni contactos de otras personas.
import "server-only";
import { buscarCoincidencias, DISTANCIA_MAXIMA_KM, MOTIVO_AVISTAMIENTO, VENTANA_DIAS, type PublicacionComparable } from "@/dominio/coincidencias";
import { distanciaKm, punto } from "@/dominio/geo";
import { CUPO_OCUPA, cuposDisponibles } from "@/dominio/cupos";
import { municipioActivo } from "@/lib/municipio";
import { fotoDeAviso } from "@/componentes/portal/fotoAviso";
import { fotoDeComunitario } from "@/componentes/portal/fotoComunitario";
import { INVITACION_ABIERTA } from "@/dominio/invitaciones";
import { fotosDeFicha } from "@/componentes/portal/fotoFicha";
import { COMUNITARIO_PUBLICO, FICHA_PUBLICA, PUBLICACION_CON_FOTO } from "@/servidor/conFoto";
import { db } from "@/servidor/db";
import { inicioDeHoy } from "@/servidor/formato";

const municipioId = () => municipioActivo().id;

export function sectores() {
  return db.sector.findMany({ where: { municipioId: municipioId() }, orderBy: { orden: "asc" }, select: { id: true, clave: true, nombre: true } });
}

/** Sectores con sus localidades, para elegir la localidad de una lista cerrada. */
export function territorio() {
  return db.sector.findMany({
    where: { municipioId: municipioId() },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true, localidades: { orderBy: { orden: "asc" }, select: { id: true, nombre: true } } },
  });
}

/** Colores del catálogo por especie (perros y gatos). */
export async function coloresPorEspecie() {
  const colores = await db.colorCatalogo.findMany({ where: { municipioId: municipioId() }, orderBy: { orden: "asc" } });
  return {
    PERRO: colores.filter((c) => c.especie === "PERRO").map((c) => c.nombre),
    GATO: colores.filter((c) => c.especie === "GATO").map((c) => c.nombre),
  };
}

/** Tipos de reporte del catálogo, en su orden. */
/** Categorías vigentes de SOS Mascotas, en el orden del catálogo. */
export function tiposReporte() {
  return db.tipoReporte.findMany({ where: { municipioId: municipioId(), activo: true }, orderBy: { orden: "asc" }, select: { clave: true, nombre: true } });
}

export function servicios() {
  return db.servicio.findMany({ where: { municipioId: municipioId(), activo: true }, orderBy: { nombre: "asc" }, select: { id: true, clave: true, nombre: true } });
}

// ───────────── Operativos ─────────────

const ESTADOS_PUBLICOS = ["PUBLICADO", "INSCRIPCIONES_CERRADAS", "EN_CURSO", "CERRADO"] as const;

async function conCupos<T extends { id: string; capacidades: { servicioId: string; cupos: number; servicio: { nombre: string; clave: string } }[] }>(operativos: T[]) {
  const ocupacion = await db.cupo.groupBy({
    by: ["operativoId", "servicioId"],
    where: { operativoId: { in: operativos.map((o) => o.id) }, estado: { in: [...CUPO_OCUPA] } },
    _count: { _all: true },
  });
  // Las invitaciones prioritarias abiertas retienen su cupo: no se ofrece al público.
  const retenidas = await db.invitacionOperativo.groupBy({
    by: ["operativoId", "servicioId"],
    where: { operativoId: { in: operativos.map((o) => o.id) }, estado: { in: [...INVITACION_ABIERTA] } },
    _count: { _all: true },
  });
  const ocupados = (op: string, sv: string) =>
    (ocupacion.find((o) => o.operativoId === op && o.servicioId === sv)?._count._all ?? 0) +
    (retenidas.find((o) => o.operativoId === op && o.servicioId === sv)?._count._all ?? 0);
  return operativos.map((o) => ({
    ...o,
    servicios: o.capacidades.map((c) => ({
      servicioId: c.servicioId,
      nombre: c.servicio.nombre,
      clave: c.servicio.clave,
      capacidad: c.cupos,
      disponibles: cuposDisponibles(c.cupos, ocupados(o.id, c.servicioId)),
    })),
  }));
}

const incluirOperativo = {
  sector: { select: { id: true, nombre: true } },
  lugar: { select: { nombre: true } },
  capacidades: { include: { servicio: { select: { nombre: true, clave: true } } } },
} as const;

/** Operativos publicados desde hoy en adelante, con cupos disponibles por servicio. */
export async function operativosAbiertos(filtro: { sectorId?: string } = {}) {
  const operativos = await db.operativo.findMany({
    where: { estado: "PUBLICADO", fecha: { gte: inicioDeHoy() }, sector: { municipioId: municipioId() }, ...(filtro.sectorId ? { sectorId: filtro.sectorId } : {}) },
    include: incluirOperativo,
    orderBy: { fecha: "asc" },
  });
  return conCupos(operativos);
}

/**
 * Listado público de operativos: los que vienen (desde hoy), con inscripciones
 * abiertas o ya cerradas, con su localidad y los cupos reales por servicio.
 * Solo lectura: inscribirse sigue exigiendo un operativo PUBLICADO.
 */
export async function operativosProximos(filtro: { sectorId?: string } = {}) {
  const operativos = await db.operativo.findMany({
    where: { estado: { in: ["PUBLICADO", "INSCRIPCIONES_CERRADAS"] }, fecha: { gte: inicioDeHoy() }, sector: { municipioId: municipioId() }, ...(filtro.sectorId ? { sectorId: filtro.sectorId } : {}) },
    include: { ...incluirOperativo, lugar: { select: { nombre: true, localidad: { select: { nombre: true } } } } },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  });
  return (await conCupos(operativos)).map((o) => ({ ...o, inscripcionAbierta: o.estado === "PUBLICADO" }));
}

/**
 * Próximo operativo para la portada: publicado (inscripciones abiertas) o con
 * inscripciones cerradas, desde hoy. Con su localidad y los cupos reales por
 * servicio (descontando los retenidos por invitaciones). Null si no hay.
 */
export async function proximoOperativo() {
  const o = await db.operativo.findFirst({
    where: { estado: { in: ["PUBLICADO", "INSCRIPCIONES_CERRADAS"] }, fecha: { gte: inicioDeHoy() }, sector: { municipioId: municipioId() } },
    include: { ...incluirOperativo, lugar: { select: { nombre: true, localidad: { select: { nombre: true } } } } },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  });
  if (!o) return null;
  const [conDatos] = await conCupos([o]);
  return conDatos;
}

export async function operativo(id: string) {
  const o = await db.operativo.findFirst({
    where: { id, estado: { in: [...ESTADOS_PUBLICOS] }, sector: { municipioId: municipioId() } },
    include: { ...incluirOperativo, lugar: { select: { nombre: true, localidad: { select: { nombre: true } } } } },
  });
  if (!o) return null;
  const [conDatos] = await conCupos([o]);
  return { ...conDatos, inscripcionAbierta: o.estado === "PUBLICADO" && o.fecha >= inicioDeHoy() };
}

/**
 * Operativo publicado que ofrece el servicio: primero en el mismo sector y, si
 * no hay, uno cuyo lugar quede a menos de 10 km de la localidad de la persona.
 */
export async function operativoCercano(sectorId: string, servicioId: string, localidadId?: string | null) {
  const abiertos = (await operativosAbiertos()).filter((o) => o.capacidades.some((c) => c.servicioId === servicioId));
  const enSector = abiertos.find((o) => o.sectorId === sectorId);
  if (enSector || !localidadId) return enSector ?? null;
  const localidad = await db.localidad.findUnique({ where: { id: localidadId } });
  const origen = localidad ? punto(localidad.lat, localidad.lng) : null;
  if (!origen) return null;
  const lugares = new Map((await db.lugar.findMany({ where: { id: { in: abiertos.map((o) => o.lugarId) } } })).map((l) => [l.id, punto(l.lat, l.lng)]));
  const conDistancia = abiertos
    .map((o) => ({ o, km: lugares.get(o.lugarId) ? distanciaKm(origen, lugares.get(o.lugarId)!) : Infinity }))
    .filter((x) => x.km < DISTANCIA_MAXIMA_KM)
    .sort((a, b) => a.km - b.km);
  return conDistancia[0]?.o ?? null;
}

// ───────────── Avisos ─────────────

/** Avisos publicados y vigentes hoy. Con sector: los de toda la comuna y los de ese sector. */
export function avisosVigentes(filtro: { sectorId?: string; limite?: number } = {}) {
  const ahora = new Date();
  return db.aviso.findMany({
    where: {
      estado: "PUBLICADO",
      vigenteDesde: { lte: ahora },
      vigenteHasta: { gte: ahora },
      ...(filtro.sectorId ? { OR: [{ sectores: { none: {} } }, { sectores: { some: { sectorId: filtro.sectorId } } }] } : {}),
    },
    include: { sectores: { include: { sector: { select: { nombre: true } } } } },
    orderBy: [{ destacado: "desc" }, { vigenteDesde: "desc" }],
    take: filtro.limite,
  });
}

// ───────────── Mascotas perdidas y avistadas ─────────────

// Vigente, no oculta y con foto (solo se muestran animales con foto).
/** Aviso visible en el portal: vigente, aceptado por el municipio y con foto. */
const visible = { estado: "ABIERTA", moderacion: "APROBADA", ...PUBLICACION_CON_FOTO } as const;
const camposPublicos = {
  id: true,
  codigo: true,
  tipo: true,
  especie: true,
  sexo: true,
  tamano: true,
  colorPrincipal: true,
  nombreAnimal: true,
  collar: true,
  colorCollar: true,
  microchip: true,
  senas: true,
  fechaEvento: true,
  resguardada: true,
  resguardo: true,
  resguardoDetalle: true,
  resguardoLocalidad: { select: { nombre: true, sector: { select: { nombre: true } } } },
  creadaEn: true,
  sectorId: true,
  sector: { select: { nombre: true } },
  localidad: { select: { nombre: true, lat: true, lng: true } },
  fotoUrl: true,
  animal: { select: { foto: true } },
} as const;

export function publicaciones(filtro: { tipo?: "PERDIDA" | "ENCONTRADA"; especie?: "PERRO" | "GATO" | "OTRA"; sectorId?: string }) {
  return db.publicacionMascota.findMany({
    where: { ...visible, ...filtro },
    select: camposPublicos,
    orderBy: { fechaEvento: "desc" },
  });
}

export function publicacion(id: string) {
  return db.publicacionMascota.findFirst({ where: { id, ...visible }, select: camposPublicos });
}

/** El aviso recién creado, aunque aún no se muestre (sin foto): para buscar sus coincidencias. */
export function publicacionPropia(id: string) {
  return db.publicacionMascota.findUnique({ where: { id }, select: camposPublicos });
}


type Publica = { id: string; tipo: "PERDIDA" | "ENCONTRADA"; especie: string; sectorId: string; fechaEvento: Date; colorPrincipal: string; tamano: string | null; collar: string | null; colorCollar: string | null; senas: string | null; localidad: { lat: number | null; lng: number | null } | null };

const comparable = (p: Publica): PublicacionComparable => ({ ...p, localidad: p.localidad ? punto(p.localidad.lat, p.localidad.lng) : null });

/** Hasta 3 posibles coincidencias: mismo sector o localidades a menos de 10 km (sección 6). */
export async function coincidenciasDe(p: Publica) {
  const ventanaMs = VENTANA_DIAS * 86_400_000;
  const candidatos = await db.publicacionMascota.findMany({
    where: {
      ...visible,
      tipo: p.tipo === "PERDIDA" ? "ENCONTRADA" : "PERDIDA",
      especie: p.especie as "PERRO" | "GATO" | "OTRA",
      fechaEvento: { gte: new Date(p.fechaEvento.getTime() - ventanaMs), lte: new Date(p.fechaEvento.getTime() + ventanaMs) },
    },
    select: camposPublicos,
  });
  // El equipo municipal pudo descartar una coincidencia: no se vuelve a sugerir.
  const descartadas = await db.coincidencia.findMany({
    where: { estado: "DESCARTADA", OR: [{ perdidaId: p.id }, { encontradaId: p.id }] },
    select: { perdidaId: true, encontradaId: true },
  });
  const excluidas = new Set(descartadas.flatMap((d) => [d.perdidaId, d.encontradaId]).filter((x) => x !== p.id));
  const encontradas = buscarCoincidencias(comparable(p), candidatos.filter((c) => !excluidas.has(c.id)).map(comparable));
  return encontradas.map((c) => ({ ...c, publicacion: candidatos.find((x) => x.id === c.id)! }));
}

// ───────────── Adopción ─────────────

const incluirFicha = {
  sector: { select: { nombre: true } },
  animal: { select: { nombre: true, especie: true, sexo: true, edadAproxMeses: true, tamano: true, colorPrincipal: true, esterilizado: true, vacunasAlDia: true, microchip: true, foto: true } },
} as const;

export function fichasAdopcion() {
  return db.fichaAdopcion.findMany({
    where: FICHA_PUBLICA,
    include: incluirFicha,
    orderBy: { publicadaEn: "asc" },
  });
}

export function fichaAdopcion(id: string) {
  return db.fichaAdopcion.findFirst({ where: { id, ...FICHA_PUBLICA }, include: incluirFicha });
}

// ───────────── Perros comunitarios ─────────────
// Público: ficha, foto y lugar de referencia. Cuidadores y controles son
// internos (docs/concepto.md, sección 14) y no se leen aquí.

const camposComunitario = {
  id: true,
  apodo: true,
  fotos: true,
  sector: { select: { nombre: true, clave: true } },
  lugar: { select: { nombre: true, tipo: true, localidad: { select: { nombre: true } } } },
  animal: { select: { nombre: true, sexo: true, tamano: true, colorPrincipal: true, edadAproxMeses: true, rasgos: true, esterilizado: true, vacunasAlDia: true, microchip: true, foto: true } },
} as const;

export function perrosComunitarios(filtro: { sectorId?: string } = {}) {
  return db.perroComunitario.findMany({
    where: { sector: { municipioId: municipioId() }, ...COMUNITARIO_PUBLICO, ...(filtro.sectorId ? { sectorId: filtro.sectorId } : {}) },
    select: camposComunitario,
    orderBy: [{ sector: { orden: "asc" } }, { apodo: "asc" }],
  });
}

/** Lugares públicos de referencia (plazas, escuelas, recintos) donde puede estar un perro comunitario. */
export function lugaresPublicos() {
  return db.lugar.findMany({
    where: { sector: { municipioId: municipioId() } },
    select: { id: true, nombre: true, sector: { select: { nombre: true } } },
    orderBy: [{ sector: { orden: "asc" } }, { nombre: "asc" }],
  });
}

export function perroComunitario(id: string) {
  return db.perroComunitario.findFirst({ where: { id, sector: { municipioId: municipioId() }, ...COMUNITARIO_PUBLICO }, select: camposComunitario });
}

/**
 * Lo que la ficha pública agrega sobre su seguimiento: fechas de revisión, si
 * hay un cuidador registrado (sin sus datos) y el historial que se puede
 * mostrar: los controles en terreno (historial marcado como público) y las
 * atenciones realizadas (tabla de atenciones).
 */
export async function seguimientoComunitario(id: string) {
  const c = await db.perroComunitario.findFirst({
    where: { id, sector: { municipioId: municipioId() } },
    select: {
      animalId: true,
      ultimoControl: true,
      fichaRevisadaEn: true,
      _count: { select: { cuidadoresAutorizados: { where: { activo: true } } } },
      historial: { where: { publico: true }, select: { id: true, accion: true, creadoEn: true }, orderBy: { creadoEn: "desc" }, take: 10 },
    },
  });
  if (!c) return null;
  const atenciones = await db.atencion.findMany({
    where: { animalId: c.animalId, resultado: "REALIZADA" },
    select: { id: true, realizadaEn: true, servicio: { select: { nombre: true } } },
    orderBy: { realizadaEn: "desc" },
    take: 10,
  });
  const historial = [
    ...c.historial.map((h) => ({ clave: h.id, texto: h.accion, fecha: h.creadoEn })),
    ...atenciones.map((a) => ({ clave: a.id, texto: `${a.servicio.nombre} realizada`, fecha: a.realizadaEn })),
  ]
    .sort((x, y) => y.fecha.getTime() - x.fecha.getTime())
    .slice(0, 10);
  return { ultimoControl: c.ultimoControl, fichaRevisadaEn: c.fichaRevisadaEn, conCuidador: c._count.cuidadoresAutorizados > 0, historial };
}



// ───────────── Mapa público ─────────────
// Solo mascotas perdidas y encontradas por sector y perros comunitarios en su
// lugar de referencia. Ningún reporte es público (docs/concepto.md, sección 11).

export async function mapaPublico() {
  const [lista, conteo, comunitarios] = await Promise.all([
    db.sector.findMany({
      where: { municipioId: municipioId() },
      orderBy: { orden: "asc" },
      select: { id: true, clave: true, nombre: true, centroLat: true, centroLng: true, localidades: { select: { nombre: true, lat: true, lng: true } } },
    }),
    db.publicacionMascota.groupBy({ by: ["sectorId", "tipo"], where: { ...visible, sector: { municipioId: municipioId() } }, _count: { _all: true } }),
    db.perroComunitario.findMany({
      where: { sector: { municipioId: municipioId() }, ...COMUNITARIO_PUBLICO },
      select: { id: true, apodo: true, animal: { select: { nombre: true } }, lugar: { select: { id: true, nombre: true, lat: true, lng: true, localidad: { select: { nombre: true } } } }, sector: { select: { clave: true, nombre: true } } },
      orderBy: { apodo: "asc" },
    }),
  ]);
  const cuenta = (sectorId: string, tipo: "PERDIDA" | "ENCONTRADA") => conteo.find((c) => c.sectorId === sectorId && c.tipo === tipo)?._count._all ?? 0;

  const lugares = new Map<string, { id: string; nombre: string; localidad: string; sector: string; claveSector: string; centro: ReturnType<typeof punto>; perros: { id: string; nombre: string }[] }>();
  for (const c of comunitarios) {
    const l = lugares.get(c.lugar.id) ?? { id: c.lugar.id, nombre: c.lugar.nombre, localidad: c.lugar.localidad.nombre, sector: c.sector.nombre, claveSector: c.sector.clave, centro: punto(c.lugar.lat, c.lugar.lng), perros: [] };
    l.perros.push({ id: c.id, nombre: c.animal.nombre ?? c.apodo });
    lugares.set(c.lugar.id, l);
  }

  return {
    sectores: lista.map((s) => ({
      clave: s.clave,
      nombre: s.nombre,
      centro: punto(s.centroLat, s.centroLng),
      perdidas: cuenta(s.id, "PERDIDA"),
      encontradas: cuenta(s.id, "ENCONTRADA"),
    })),
    localidades: lista.flatMap((s) => s.localidades.map((l) => ({ nombre: l.nombre, punto: punto(l.lat, l.lng) }))),
    lugares: [...lugares.values()],
  };
}

// ───────────── Portada: mosaico y posibles reencuentros ─────────────

/** `foto`: dirección de la imagen; `subida`: la subió un vecino (se entrega sin el optimizador de imágenes). */
export type Mosaico = { clave: string; foto: string; subida: boolean; alt: string; etiqueta: string; href: string | null };

const femenino = (sexo: string) => sexo === "HEMBRA";
/** Primera foto de una ficha de adopción, para el mosaico. */
const principal = (f: Parameters<typeof fotosDeFicha>[0]) => {
  const [p] = fotosDeFicha(f);
  return { foto: p.src, subida: p.subida };
};
const mezclar = <T,>(xs: T[]) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Fotos reales para la portada, cada una con su historia y su ficha. Se
 * alternan los tipos (adopción, avisos, comunitarios, reencuentros) y el orden
 * cambia en cada visita.
 */
export async function mosaicoInicio(cantidad = 8): Promise<Mosaico[]> {
  const v12 = new Date(Date.now() - 365 * 86_400_000);
  const [fichas, avisos, comunitarios, reencontradas] = await Promise.all([
    fichasAdopcion(),
    publicaciones({}),
    perrosComunitarios(),
    db.publicacionMascota.findMany({
      where: { tipo: "PERDIDA", estado: "REENCONTRADA", resueltaEn: { gte: v12 }, moderacion: { not: "OCULTA" }, sector: { municipioId: municipioId() }, animal: { foto: { not: null } } },
      select: { id: true, especie: true, animal: { select: { foto: true } } },
    }),
  ]);
  const tipos: Mosaico[][] = [
    fichas.map((f) => ({ clave: `adopcion-${f.id}`, ...principal(f), alt: `${f.animal.nombre ?? "Animal"} en adopción`, etiqueta: `Busca hogar · ${f.animal.nombre ?? "sin nombre"}`, href: `/adoptar/${f.id}` })),
    avisos
      .filter((p) => fotoDeAviso(p))
      .map((p) => {
        const lugar = p.localidad?.nombre ?? p.sector.nombre;
        const etiqueta = p.tipo === "PERDIDA" ? `Se perdió en ${lugar}` : `${p.sexo === "HEMBRA" ? "Vista" : "Visto"} en ${lugar}`;
        return { clave: `aviso-${p.id}`, foto: fotoDeAviso(p)!.src, subida: fotoDeAviso(p)!.subida, alt: `${etiqueta}: ${p.colorPrincipal}`, etiqueta, href: `/mascotas/${p.id}` };
      }),
    comunitarios.map((c) => ({
      clave: `comunitario-${c.id}`,
      foto: fotoDeComunitario(c)!.src,
      subida: fotoDeComunitario(c)!.subida,
      alt: `${c.animal.nombre ?? c.apodo}, perro comunitario`,
      etiqueta: `${femenino(c.animal.sexo) ? "Comunitaria" : "Comunitario"} · ${c.animal.nombre ?? c.apodo}`,
      href: `/comunitarios/${c.id}`,
    })),
    // Las reencontradas ya no tienen ficha pública: se muestran sin enlace.
    reencontradas.map((r) => ({ clave: `volvio-${r.id}`, foto: `/fotos/${r.animal!.foto!}`, subida: false, alt: "Mascota que volvió a casa", etiqueta: "Volvió a casa", href: null })),
  ];
  const grupos = tipos.map((g) => mezclar(g));

  // Se alterna un elemento de cada tipo para que el mosaico cuente historias distintas.
  const resultado: Mosaico[] = [];
  const fotosUsadas = new Set<string>();
  while (resultado.length < cantidad && grupos.some((g) => g.length)) {
    for (const g of mezclar(grupos)) {
      const x = g.shift();
      if (x && !fotosUsadas.has(x.foto) && resultado.length < cantidad) {
        resultado.push(x);
        fotosUsadas.add(x.foto);
      }
    }
  }
  return resultado;
}

/** Ids de avisos visibles que tienen una posible coincidencia abierta (no descartada). */
/** Avistamientos que sus autores vincularon a un aviso de pérdida (posibles coincidencias, sin certeza). */
export async function avistamientosVinculados(perdidaId: string) {
  const c = await db.coincidencia.findMany({
    where: { perdidaId, estado: { not: "DESCARTADA" }, motivos: { contains: MOTIVO_AVISTAMIENTO }, encontrada: visible },
    include: { encontrada: { select: camposPublicos } },
    orderBy: { creadaEn: "desc" },
  });
  return c.map((x) => x.encontrada);
}

export async function idsConCoincidencia(): Promise<Set<string>> {
  const c = await db.coincidencia.findMany({
    where: { estado: { in: ["SUGERIDA", "VALIDADA"] }, perdida: visible, encontrada: visible },
    select: { perdidaId: true, encontradaId: true },
  });
  return new Set(c.flatMap((x) => [x.perdidaId, x.encontradaId]));
}

/** Pares de avisos que podrían ser el mismo animal, para que cualquier vecino ayude a reconocerlo. */
export async function posiblesReencuentros(limite = 3) {
  const pares = await db.coincidencia.findMany({
    where: { estado: { in: ["SUGERIDA", "VALIDADA"] }, perdida: { ...visible, sector: { municipioId: municipioId() } }, encontrada: visible },
    include: { perdida: { select: camposPublicos }, encontrada: { select: camposPublicos } },
    orderBy: [{ puntaje: "desc" }, { creadaEn: "desc" }],
    take: limite,
  });
  return pares;
}
