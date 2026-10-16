// Difusión en Instagram: cuando el municipio publica o acepta un contenido
// (operativo, ficha de adopción, aviso de mascota perdida o avistada), se
// genera la pieza y el texto y se publica de inmediato en Instagram, si la
// integración está configurada. Solo contenido público y con foto (salvo los
// operativos); nunca SOS ni reportes. Cada paso queda en la bitácora.
import "server-only";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PREFIJO_FOTO_AVISO } from "@/componentes/portal/fotoAviso";
import { ESPECIE, nombreMascota, TAMANO } from "@/dominio/etiquetas";
import { generoAviso, puedeRed, rasgosAviso, textoAdopcion, textoAvistada, textoOperativo, textoPerdida, type DatosAviso, type TipoRed } from "@/dominio/redes";
import { municipioActivo } from "@/lib/municipio";
import { borrarFoto, guardarGenerada, leerFoto } from "@/servidor/archivos";
import { FICHA_PUBLICA, PUBLICACION_CON_FOTO } from "@/servidor/conFoto";
import { db } from "@/servidor/db";
import { fechaCorta, fechaLarga } from "@/servidor/formato";
import { estadoIntegracion, publicarImagen, urlPublica } from "./instagram";
import { generarPieza, type DatosPieza } from "./pieza";

export type Respuesta = { ok: boolean; mensaje: string; id?: string };

/** ¿Se permite publicar en Instagram contenido de demostración? Solo para pruebas (Configuración). */
/** Si al aprobar o publicar un contenido también sale en Instagram (configuración del panel). */
export async function publicacionAutomatica() {
  const m = await db.municipio.findUnique({ where: { id: municipioActivo().id }, select: { redesPublicarAuto: true } });
  return m?.redesPublicarAuto ?? true;
}

export async function demoEnInstagram() {
  const m = await db.municipio.findUnique({ where: { id: municipioActivo().id }, select: { redesIncluirDemo: true } });
  return m?.redesIncluirDemo ?? false;
}

const especie = (e: string) => (e === "OTRA" ? "animal" : ESPECIE[e].toLowerCase());
const tamano = (t: string | null) => (t ? TAMANO[t].toLowerCase() : null);
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const sinProtocolo = (u: string | null) => (u ? u.replace(/^https?:\/\//, "") : null);

async function fotoDemo(ruta: string) {
  const carpeta = path.join(process.cwd(), "demo", "fotos");
  const archivo = path.normalize(path.join(carpeta, ruta));
  if (!archivo.startsWith(carpeta + path.sep)) return null;
  return readFile(archivo).catch(() => null);
}

type Origen = { pieza: Omit<DatosPieza, "portal" | "demo">; texto: string; alternativo: string; loteDemoId: string | null; descripcion: string };

/**
 * Carga el contenido de origen solo si es público y está autorizado para
 * difusión; si no, null. Es la misma condición al preparar y al publicar.
 */
export async function cargarOrigen(tipo: TipoRed, id: string): Promise<Origen | null> {
  const municipio = municipioActivo();
  const url = urlPublica();
  if (tipo === "OPERATIVO") {
    const o = await db.operativo.findFirst({
      where: { id, estado: "PUBLICADO", sector: { municipioId: municipio.id } },
      include: { sector: true, lugar: { include: { localidad: true } }, capacidades: { include: { servicio: true } } },
    });
    if (!o) return null;
    const servicios = o.capacidades.map((c) => c.servicio.nombre);
    const fecha = fechaLarga(o.fecha);
    const { texto, alternativo } = textoOperativo(
      { id: o.id, sector: o.sector.nombre, fecha, horaInicio: o.horaInicio, horaFin: o.horaFin, lugar: o.lugar.nombre, localidad: o.lugar.localidad.nombre, servicios, requisitos: o.requisitos },
      municipio.nombre,
      url,
    );
    return {
      pieza: {
        tipo,
        antetitulo: "Tenencia responsable de mascotas",
        titulo: `Operativo en ${o.sector.nombre}`,
        detalles: [
          { icono: "fecha", texto: `${mayuscula(fecha)} · ${o.horaInicio} a ${o.horaFin}` },
          { icono: "lugar", texto: `${o.lugar.nombre}, ${o.lugar.localidad.nombre}` },
          ...(servicios.length ? [{ icono: "servicio" as const, texto: mayuscula(servicios.join(", ").toLocaleLowerCase("es-CL")) }] : []),
          { icono: "llamado", texto: "Inscríbete en el portal: cupos limitados" },
        ],
        foto: null,
      },
      texto,
      alternativo,
      loteDemoId: o.loteDemoId,
      descripcion: `Operativo en ${o.sector.nombre}, ${fecha}`,
    };
  }

  if (tipo === "ADOPCION") {
    // Ficha pública (aprobada, disponible, con foto). Si la propuso un vecino, debe haber autorizado su publicación.
    const f = await db.fichaAdopcion.findFirst({
      where: { id, AND: [FICHA_PUBLICA, { OR: [{ proponenteId: null }, { autorizaPublicar: true }] }] },
      include: { animal: true, localidad: true, sector: true },
    });
    if (!f) return null;
    const subida = f.fotos.split(",").filter(Boolean)[0];
    const foto = subida ? await leerFoto("adopciones", subida) : f.animal.foto ? await fotoDemo(f.animal.foto) : null;
    if (!foto) return null;
    const donde = f.localidad?.nombre ?? f.sector?.nombre ?? null;
    const datos = { id: f.id, nombre: f.animal.nombre, especie: especie(f.animal.especie), tamano: tamano(f.animal.tamano), donde };
    const { texto, alternativo } = textoAdopcion(datos, municipio.nombre, url);
    return {
      pieza: {
        tipo,
        titulo: f.animal.nombre ? `${f.animal.nombre} busca hogar` : "Busca hogar",
        detalles: [
          { icono: "animal", texto: [mayuscula(datos.especie), datos.tamano ? `tamaño ${datos.tamano}` : null, donde].filter(Boolean).join(" · ") },
          { icono: "llamado", texto: "Revisa su ficha y postula en el portal" },
        ],
        foto,
      },
      texto,
      alternativo,
      loteDemoId: f.loteDemoId,
      descripcion: `Ficha de adopción de ${f.animal.nombre ?? `un ${datos.especie}`}`,
    };
  }

  // Avisos de mascotas: vigentes, aprobados por moderación y con foto.
  const p = await db.publicacionMascota.findFirst({
    where: { id, tipo: tipo === "PERDIDA" ? "PERDIDA" : "ENCONTRADA", estado: "ABIERTA", moderacion: "APROBADA", sector: { municipioId: municipio.id }, ...PUBLICACION_CON_FOTO },
    include: { sector: true, localidad: true, animal: { select: { foto: true } } },
  });
  if (!p) return null;
  const foto = p.fotoUrl?.startsWith(PREFIJO_FOTO_AVISO) ? await leerFoto("avisos", p.fotoUrl.slice(PREFIJO_FOTO_AVISO.length)) : p.animal?.foto ? await fotoDemo(p.animal.foto) : null;
  if (!foto) return null;
  const datos: DatosAviso = {
    id: p.id,
    especie: p.especie,
    sexo: p.sexo,
    color: p.colorPrincipal,
    tamano: tamano(p.tamano),
    localidad: p.localidad?.nombre ?? null,
    sector: p.sector.nombre,
    fecha: fechaCorta(p.fechaEvento),
    nombre: tipo === "PERDIDA" && p.nombreAnimal?.trim() ? nombreMascota(p.nombreAnimal) : null,
    collar: p.collar,
    colorCollar: p.colorCollar,
    senas: p.senas,
  };
  const g = generoAviso(datos.especie, datos.sexo);
  const donde = datos.localidad ? `${datos.localidad} (sector ${datos.sector})` : `el sector ${datos.sector}`;
  const perdida = tipo === "PERDIDA";
  const { texto, alternativo } = (perdida ? textoPerdida : textoAvistada)(datos, municipio.nombre, url);
  // En la imagen: rasgos en una línea (señas acortadas) y cuándo y dónde.
  const [principal, ...resto] = rasgosAviso(datos);
  const rasgos = [principal.replace(/\.$/, ""), ...resto.map((r) => r.replace(/\.$/, ""))].join(" · ");
  return {
    pieza: {
      tipo,
      titulo: perdida ? `¿Has visto a ${datos.nombre ?? `${g.este} ${g.sustantivo}`}?` : `¿Reconoces a ${g.este} ${g.sustantivo}?`,
      detalles: [
        { icono: "animal", texto: rasgos.length > 90 ? `${rasgos.slice(0, 87).trimEnd()}…` : rasgos },
        { icono: "lugar", texto: perdida ? `Se perdió el ${datos.fecha} en ${donde}` : `${mayuscula(g.visto)} el ${datos.fecha} en ${donde}` },
        { icono: "llamado", texto: perdida ? `¿${mayuscula(g.lo)} viste? Avisa en el portal` : "¿Es tuyo? Revisa el aviso en el portal" },
      ],
      foto,
    },
    texto,
    alternativo,
    loteDemoId: p.loteDemoId,
    descripcion: `${perdida ? "Aviso de mascota perdida" : "Aviso de mascota avistada"}${p.codigo ? ` ${p.codigo}` : ""}`,
  };
}

const anotar = (publicacionId: string, accion: string, detalle: string | null, usuarioId: string | null) => db.eventoPublicacionRed.create({ data: { publicacionId, accion, detalle, usuarioId } });

async function generarImagen(o: Origen) {
  const imagen = await generarPieza({ ...o.pieza, portal: sinProtocolo(urlPublica()), demo: o.loteDemoId !== null });
  return guardarGenerada(imagen, "redes");
}

export type Difusion = {
  estado: "publicado" | "ya-publicado" | "error" | "sin-integracion" | "demo" | "no-publico" | "manual";
  mensaje: string;
  permalink?: string | null;
};

/**
 * Publica en Instagram un contenido recién publicado o aceptado. No duplica:
 * si ya está publicado, no hace nada; si un intento anterior falló, reintenta
 * con la misma publicación. Nunca interrumpe el flujo que la llamó.
 * Con `automatico`, respeta la configuración: si la publicación automática
 * está apagada, no publica (queda el botón de cada contenido).
 */
export async function difundirEnInstagram(tipo: TipoRed, origenId: string, usuarioId: string | null, { automatico = false } = {}): Promise<Difusion> {
  try {
    if (automatico && !(await publicacionAutomatica())) return { estado: "manual", mensaje: "La publicación automática en Instagram está apagada." };
    const integracion = estadoIntegracion();
    if (!integracion.configurada) return { estado: "sin-integracion", mensaje: "Instagram no está configurado: se publicó solo en la web." };
    const municipio = municipioActivo();
    const anterior = await db.publicacionRed.findFirst({ where: { tipo, origenId, municipioId: municipio.id, estado: { not: "CANCELADO" } }, orderBy: { version: "desc" } });
    if (anterior?.estado === "PUBLICADO") return { estado: "ya-publicado", mensaje: "Ya estaba publicado en Instagram.", permalink: anterior.igPermalink };
    if (anterior?.estado === "PUBLICANDO") return { estado: "error", mensaje: "Se está publicando en Instagram en este momento." };
    const origen = await cargarOrigen(tipo, origenId);
    if (!origen) return { estado: "no-publico", mensaje: "No se publicó en Instagram: el contenido no tiene foto o no está público." };
    if (origen.loteDemoId && !(await demoEnInstagram())) return { estado: "demo", mensaje: "Son datos de demostración: no se publicaron en Instagram." };

    const ahora = new Date();
    let id: string;
    if (anterior) {
      // Un intento anterior que no salió: se reintenta con la misma publicación,
      // pero con la pieza y el texto rehechos con el diseño y los datos de hoy
      // (el contenedor anterior apuntaba a la imagen vieja, así que se descarta).
      const imagen = await generarImagen(origen);
      await db.publicacionRed.update({
        where: { id: anterior.id },
        data: { estado: anterior.estado === "ERROR" ? "ERROR" : "APROBADO", revisadoPorId: usuarioId, aprobadaEn: ahora, imagen, texto: origen.texto, textoGenerado: origen.texto, textoAlternativo: origen.alternativo, contenedorId: null },
      });
      if (anterior.imagen && anterior.imagen !== imagen) await borrarFoto("redes", anterior.imagen);
      await anotar(anterior.id, "Pieza rehecha para el reintento", null, usuarioId);
      id = anterior.id;
    } else {
      const imagen = await generarImagen(origen);
      const creada = await db.publicacionRed.create({
        data: { municipioId: municipio.id, tipo, origenId, texto: origen.texto, textoGenerado: origen.texto, textoAlternativo: origen.alternativo, imagen, loteDemoId: origen.loteDemoId, estado: "APROBADO", revisadoPorId: usuarioId, aprobadaEn: ahora },
      });
      await anotar(creada.id, "Generada al publicar", `${origen.descripcion}.`, usuarioId);
      id = creada.id;
    }
    const r = await publicarRed(id, usuarioId);
    if (!r.ok) return { estado: "error", mensaje: r.mensaje };
    const p = await db.publicacionRed.findUnique({ where: { id }, select: { igPermalink: true } });
    return { estado: "publicado", mensaje: "Publicado en Instagram.", permalink: p?.igPermalink ?? null };
  } catch (e) {
    console.error("No se pudo publicar en Instagram", e);
    return { estado: "error", mensaje: "Ocurrió un error inesperado al publicar en Instagram." };
  }
}

/** Frase para el mensaje de la acción que publicó el contenido. */
export function notaInstagram(d: Difusion): string {
  return {
    publicado: " También se publicó en Instagram.",
    "ya-publicado": " Ya estaba publicado en Instagram.",
    error: ` No se pudo publicar en Instagram: ${d.mensaje} Puedes reintentar desde la misma tarjeta.`,
    "sin-integracion": " Instagram no está configurado: se publicó solo en la web.",
    demo: " Son datos de demostración: no se publicaron en Instagram.",
    "no-publico": " No se publicó en Instagram porque no tiene foto.",
    manual: " No se publicó en Instagram: la publicación automática está apagada. Puedes publicarlo desde Instagram en el panel.",
  }[d.estado];
}

export type EstadoInstagram = { estado: string; permalink: string | null; error: string | null };

/** Estado en Instagram de varios contenidos de un tipo (para mostrarlo en sus tarjetas). */
export async function estadosInstagram(tipo: TipoRed, origenIds: string[]): Promise<Record<string, EstadoInstagram>> {
  if (!origenIds.length) return {};
  const filas = await db.publicacionRed.findMany({
    where: { tipo, origenId: { in: origenIds }, municipioId: municipioActivo().id, estado: { not: "CANCELADO" } },
    orderBy: { version: "asc" },
    select: { origenId: true, estado: true, igPermalink: true, error: true },
  });
  return Object.fromEntries(filas.map((f) => [f.origenId, { estado: f.estado, permalink: f.igPermalink, error: f.error }]));
}

/** Firma para la dirección pública de la imagen: solo quien la recibe del servidor puede descargarla. */
export function firmaImagen(id: string, imagen: string) {
  return createHmac("sha256", process.env.SESION_SECRETO ?? "").update(`${id}:${imagen}`).digest("base64url").slice(0, 32);
}

/**
 * Publica en Instagram una publicación aprobada (o reintenta tras un error).
 * No marca nada como publicado sin la confirmación de la API.
 */
export async function publicarRed(id: string, usuarioId: string | null): Promise<Respuesta> {
  const p = await db.publicacionRed.findFirst({ where: { id, municipioId: municipioActivo().id } });
  if (!p || !puedeRed("publicar", p.estado)) return { ok: false, mensaje: "Solo se publica una publicación aprobada o con un error anterior." };
  const integracion = estadoIntegracion();
  if (!integracion.configurada) return { ok: false, mensaje: `La publicación en Instagram está deshabilitada. Falta configurar: ${integracion.faltantes.map((f) => f.split(":")[0]).join(", ")}.` };
  if (p.loteDemoId && !(await demoEnInstagram())) return { ok: false, mensaje: "Las publicaciones hechas con datos de demostración no se publican en Instagram (administración puede habilitarlo para pruebas)." };
  if (!(await cargarOrigen(p.tipo, p.origenId))) return { ok: false, mensaje: "El contenido de origen ya no está público o no está autorizado para difusión. No se publicó." };

  // Bloqueo: si dos personas pulsan a la vez, solo una publica.
  const tomada = await db.publicacionRed.updateMany({ where: { id, estado: { in: ["APROBADO", "ERROR"] } }, data: { estado: "PUBLICANDO", intentos: { increment: 1 } } });
  if (!tomada.count) return { ok: false, mensaje: "Esta publicación ya cambió de estado. Actualiza la página." };
  await anotar(id, "Publicación solicitada a Instagram", p.contenedorId ? "Se reutiliza el contenedor del intento anterior." : null, usuarioId);

  const imagenUrl = `${urlPublica()}/redes/${p.id}/imagen?f=${firmaImagen(p.id, p.imagen)}`;
  let r: Awaited<ReturnType<typeof publicarImagen>>;
  try {
    r = await publicarImagen({ imagenUrl, texto: p.texto, textoAlternativo: p.textoAlternativo, contenedorId: p.contenedorId });
  } catch (e) {
    console.error(e);
    r = { ok: false, error: "Ocurrió un error inesperado al publicar.", contenedorId: p.contenedorId };
  }
  if (r.ok) {
    await db.publicacionRed.update({ where: { id }, data: { estado: "PUBLICADO", publicadaEn: new Date(), igMediaId: r.mediaId, igPermalink: r.permalink, contenedorId: r.contenedorId, error: null } });
    await anotar(id, "Publicada en Instagram", r.permalink ?? `Id de la publicación: ${r.mediaId}`, usuarioId);
    return { ok: true, mensaje: "Instagram confirmó la publicación." };
  }
  await db.publicacionRed.update({ where: { id }, data: { estado: "ERROR", error: r.error, contenedorId: r.contenedorId } });
  await anotar(id, "Error de publicación", r.error, usuarioId);
  return { ok: false, mensaje: r.error };
}
