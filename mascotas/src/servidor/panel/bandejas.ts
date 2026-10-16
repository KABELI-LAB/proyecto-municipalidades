// Consultas de las bandejas de revisión del panel.
import "server-only";
import { municipioActivo } from "@/lib/municipio";
import { FICHA_CON_FOTO, PUBLICACION_CON_FOTO } from "@/servidor/conFoto";
import { db } from "@/servidor/db";

const enMunicipio = () => ({ sector: { municipioId: municipioActivo().id } });
/** Avisos del municipio con foto: lo que muestran y cuentan las bandejas. */
const avisoVisible = () => ({ ...enMunicipio(), ...PUBLICACION_CON_FOTO });

// ───────────── Reportes ─────────────
// Contenido, sector y lugar. La identidad de quien reporta no se lee aquí (sección 14).

export type GrupoReportes = "ABIERTO" | "EN_REVISION" | "CERRADO";

export async function reportesBandeja(estado: GrupoReportes, sectorId?: string) {
  const reportes = await db.reporteCiudadano.findMany({
    where: { estado, ...enMunicipio(), ...(sectorId ? { sectorId } : {}) },
    select: {
      id: true,
      codigo: true,
      especie: true,
      cantidad: true,
      sigueEnLugar: true,
      descripcion: true,
      fotoArchivo: true,
      estado: true,
      creadoEn: true,
      cerradoEn: true,
      tipo: { select: { nombre: true } },
      sector: { select: { nombre: true } },
      localidad: { select: { nombre: true } },
      lugar: { select: { nombre: true } },
      historial: { select: { estado: true, creadoEn: true, usuario: { select: { nombre: true } } }, orderBy: { creadoEn: "asc" } },
    },
    // Los abiertos, del más antiguo al más nuevo: primero lo que lleva más tiempo esperando.
    orderBy: { creadoEn: estado === "CERRADO" ? "desc" : "asc" },
    take: estado === "CERRADO" ? 50 : undefined,
  });
  // El nombre del archivo no sale del servidor: el panel pide la foto por el id del reporte.
  const lista = reportes.map(({ fotoArchivo, ...r }) => ({ ...r, tieneFoto: fotoArchivo !== null }));
  return lista;
}

export async function contarReportes() {
  const g = await db.reporteCiudadano.groupBy({ by: ["estado"], where: enMunicipio(), _count: { _all: true } });
  const n = (e: GrupoReportes) => g.find((x) => x.estado === e)?._count._all ?? 0;
  return { ABIERTO: n("ABIERTO"), EN_REVISION: n("EN_REVISION"), CERRADO: n("CERRADO") };
}

// ───────────── Publicaciones de mascotas ─────────────

export type GrupoPublicaciones = "pendientes" | "vigentes" | "ocultas";

const camposPublicacion = {
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
  creadaEn: true,
  estado: true,
  moderacion: true,
  resguardada: true,
  resguardo: true,
  resguardoDetalle: true,
  resguardoLocalidad: { select: { nombre: true, sector: { select: { nombre: true } } } },
  sector: { select: { nombre: true } },
  localidad: { select: { nombre: true } },
  fotoUrl: true,
  animal: { select: { foto: true } },
  _count: { select: { mensajes: true } },
} as const;

export function publicacionesBandeja(grupo: GrupoPublicaciones) {
  const where =
    grupo === "pendientes"
      ? { estado: "ABIERTA" as const, moderacion: "PENDIENTE" as const }
      : grupo === "vigentes"
        ? { estado: "ABIERTA" as const, moderacion: "APROBADA" as const }
        : { moderacion: "OCULTA" as const };
  return db.publicacionMascota.findMany({ where: { ...where, ...avisoVisible() }, select: camposPublicacion, orderBy: { creadaEn: "asc" } });
}

export async function contarPublicaciones() {
  const [pendientes, vigentes, ocultas] = await Promise.all([
    db.publicacionMascota.count({ where: { estado: "ABIERTA", moderacion: "PENDIENTE", ...avisoVisible() } }),
    db.publicacionMascota.count({ where: { estado: "ABIERTA", moderacion: "APROBADA", ...avisoVisible() } }),
    db.publicacionMascota.count({ where: { moderacion: "OCULTA", ...avisoVisible() } }),
  ]);
  return { pendientes, vigentes, ocultas };
}

// ───────────── Coincidencias ─────────────

export type GrupoCoincidencias = "SUGERIDA" | "VALIDADA" | "cerradas";

export function coincidenciasBandeja(grupo: GrupoCoincidencias) {
  const abiertas = { perdida: { estado: "ABIERTA" as const, ...avisoVisible() }, encontrada: { estado: "ABIERTA" as const, ...PUBLICACION_CON_FOTO } };
  const where =
    grupo === "cerradas"
      ? { OR: [{ estado: "DESCARTADA" as const }, { perdida: { estado: "REENCONTRADA" as const } }], perdida: avisoVisible(), encontrada: PUBLICACION_CON_FOTO }
      : { estado: grupo, ...abiertas };
  return db.coincidencia.findMany({
    where,
    include: { perdida: { select: camposPublicacion }, encontrada: { select: camposPublicacion } },
    orderBy: [{ puntaje: "desc" }, { creadaEn: "asc" }],
  });
}

export async function contarCoincidencias() {
  const abiertas = { perdida: { estado: "ABIERTA" as const, ...avisoVisible() }, encontrada: { estado: "ABIERTA" as const, ...PUBLICACION_CON_FOTO } };
  const [SUGERIDA, VALIDADA] = await Promise.all([
    db.coincidencia.count({ where: { estado: "SUGERIDA", ...abiertas } }),
    db.coincidencia.count({ where: { estado: "VALIDADA", ...abiertas } }),
  ]);
  return { SUGERIDA, VALIDADA };
}

// ───────────── Propuestas de adopción («Dar en adopción») ─────────────
// Incluye el contacto de quien propone: solo para quienes gestionan adopciones.

export type GrupoPropuestas = "pendientes" | "correcciones" | "publicadas" | "cerradas";

const REVISIONES: Record<GrupoPropuestas, ("PENDIENTE" | "CORRECCIONES" | "APROBADA" | "RECHAZADA" | "OCULTA" | "RETIRADA")[]> = {
  pendientes: ["PENDIENTE"],
  correcciones: ["CORRECCIONES"],
  publicadas: ["APROBADA"],
  cerradas: ["RECHAZADA", "OCULTA", "RETIRADA"],
};

/** Propuestas de vecinos del municipio; «publicadas» incluye también las fichas del municipio, para poder ocultarlas. */
const deVecinosOPublicadas = (grupo: GrupoPropuestas) =>
  grupo === "publicadas"
    ? { OR: [{ proponente: { municipioId: municipioActivo().id } }, { proponenteId: null }], estado: { not: "ADOPTADO" as const } }
    : { proponente: { municipioId: municipioActivo().id } };

export function propuestasBandeja(grupo: GrupoPropuestas) {
  return db.fichaAdopcion.findMany({
    // Ambas condiciones usan OR: se combinan con AND para que una no reemplace a la otra.
    where: { revision: { in: REVISIONES[grupo] }, AND: [deVecinosOPublicadas(grupo), FICHA_CON_FOTO] },
    select: {
      id: true,
      codigo: true,
      revision: true,
      estado: true,
      caracter: true,
      conviveConNinos: true,
      conviveConAnimales: true,
      saludTexto: true,
      hogarTexto: true,
      relacion: true,
      autorizaPublicar: true,
      motivoRevision: true,
      cierre: true,
      revisadaEn: true,
      creadaEn: true,
      fotos: true,
      sector: { select: { nombre: true } },
      localidad: { select: { nombre: true } },
      revisadoPor: { select: { nombre: true } },
      proponente: { select: { nombre: true, telefono: true, correo: true } },
      animal: { select: { nombre: true, especie: true, sexo: true, edadAproxMeses: true, tamano: true, esterilizado: true, vacunasAlDia: true, microchip: true, foto: true } },
      _count: { select: { postulaciones: true } },
    },
    // Lo que espera revisión, de lo más antiguo a lo más nuevo.
    orderBy: { creadaEn: grupo === "pendientes" || grupo === "correcciones" ? "asc" : "desc" },
    take: grupo === "cerradas" ? 50 : undefined,
  });
}

export async function contarPropuestas() {
  const contar = (g: GrupoPropuestas) => db.fichaAdopcion.count({ where: { revision: { in: REVISIONES[g] }, AND: [deVecinosOPublicadas(g), FICHA_CON_FOTO] } });
  const [pendientes, correcciones, publicadas, cerradas] = await Promise.all([contar("pendientes"), contar("correcciones"), contar("publicadas"), contar("cerradas")]);
  return { pendientes, correcciones, publicadas, cerradas };
}
