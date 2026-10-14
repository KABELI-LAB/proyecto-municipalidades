// Integración con la API oficial de publicación de contenido de Instagram
// (Instagram API with Instagram Login, graph.instagram.com). Se usa solo
// desde el servidor: las credenciales viven en variables de entorno y nunca
// llegan al navegador ni al repositorio. Sin credenciales, la publicación
// externa queda deshabilitada y se explica qué falta.
//
// Flujo documentado por Meta para una imagen:
//   1. POST /<IG_ID>/media         image_url (JPEG público), caption, alt_text → id del contenedor
//   2. GET  /<CONTENEDOR>?fields=status_code  (FINISHED cuando está listo)
//   3. POST /<IG_ID>/media_publish creation_id → id de la publicación
//   4. GET  /<MEDIA_ID>?fields=permalink → enlace permanente
// Límite: 100 publicaciones por API en 24 horas por cuenta.
import "server-only";

const VERSION_PREDETERMINADA = "v25.0";
const HOST_PREDETERMINADO = "graph.instagram.com";

export type EstadoIntegracion = { configurada: boolean; faltantes: string[] };

/** Dirección pública del portal (APP_URL), solo si es https y no local. */
export function urlPublica(): string | null {
  const url = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
  if (!/^https:\/\//.test(url)) return null;
  if (/^https:\/\/(localhost|127\.0\.0\.1|\[::1\]|[^/]+\.localhost|[^/]+\.test)(:\d+)?(\/|$)/i.test(url)) return null;
  return url;
}

/**
 * Qué falta para publicar de verdad. Tener las variables no prueba que la
 * cuenta esté conectada: eso se confirma con «Verificar conexión».
 */
export function estadoIntegracion(): EstadoIntegracion {
  const faltantes: string[] = [];
  if (!process.env.INSTAGRAM_USER_ID?.trim()) faltantes.push("INSTAGRAM_USER_ID: el identificador de la cuenta profesional de Instagram de la municipalidad");
  if (!process.env.INSTAGRAM_ACCESS_TOKEN?.trim()) faltantes.push("INSTAGRAM_ACCESS_TOKEN: un token de acceso de usuario de Instagram con los permisos instagram_business_basic e instagram_business_content_publish");
  if (!urlPublica()) faltantes.push("APP_URL: una dirección pública https del portal, para que Instagram pueda descargar la imagen");
  return { configurada: faltantes.length === 0, faltantes };
}

const base = () => `https://${process.env.INSTAGRAM_API_HOST?.trim() || HOST_PREDETERMINADO}/${process.env.INSTAGRAM_API_VERSION?.trim() || VERSION_PREDETERMINADA}`;

class ErrorInstagram extends Error {}

/** Llamada a la API. El token va en el cuerpo (POST) o en la consulta (GET), nunca en registros. */
async function llamar(metodo: "GET" | "POST", ruta: string, parametros: Record<string, string>) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim() ?? "";
  const datos = new URLSearchParams({ ...parametros, access_token: token });
  let respuesta: Response;
  try {
    respuesta = metodo === "GET" ? await fetch(`${base()}/${ruta}?${datos}`, { cache: "no-store" }) : await fetch(`${base()}/${ruta}`, { method: "POST", body: datos, cache: "no-store" });
  } catch {
    throw new ErrorInstagram("No pudimos comunicarnos con Instagram. Revisa la conexión a internet del servidor.");
  }
  const cuerpo = (await respuesta.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string; code?: number } };
  if (!respuesta.ok || cuerpo.error) {
    const detalle = cuerpo.error?.message ? `${cuerpo.error.message}${cuerpo.error.code ? ` (código ${cuerpo.error.code})` : ""}` : `respuesta ${respuesta.status}`;
    throw new ErrorInstagram(`Instagram respondió con un error: ${detalle}`);
  }
  return cuerpo;
}

export type ResultadoPublicacion =
  | { ok: true; mediaId: string; permalink: string | null; contenedorId: string }
  | { ok: false; error: string; contenedorId: string | null };

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Publica una imagen. Si ya existe un contenedor de un intento anterior y
 * sigue utilizable, se reutiliza: así un reintento no duplica la publicación.
 * Solo devuelve ok cuando la API entrega el id de la publicación.
 */
export async function publicarImagen(p: { imagenUrl: string; texto: string; textoAlternativo: string; contenedorId: string | null; espera?: number }): Promise<ResultadoPublicacion> {
  const ig = process.env.INSTAGRAM_USER_ID?.trim() ?? "";
  const espera = p.espera ?? 3000;
  let contenedor = p.contenedorId;
  try {
    if (contenedor) {
      const { status_code } = (await llamar("GET", contenedor, { fields: "status_code" })) as { status_code?: string };
      if (status_code === "PUBLISHED") return { ok: false, error: "Ese contenedor ya figura publicado en Instagram. Revisa la cuenta antes de volver a intentar.", contenedorId: contenedor };
      if (status_code !== "FINISHED" && status_code !== "IN_PROGRESS") contenedor = null; // vencido o con error: se crea otro
    }
    if (!contenedor) {
      const creado = (await llamar("POST", `${ig}/media`, { image_url: p.imagenUrl, caption: p.texto, alt_text: p.textoAlternativo })) as { id?: string };
      if (!creado.id) throw new ErrorInstagram("Instagram no devolvió el contenedor de la imagen.");
      contenedor = creado.id;
    }
    // Las imágenes suelen quedar listas de inmediato; se consulta unas pocas veces.
    let estado = "";
    for (let i = 0; i < 4; i++) {
      estado = ((await llamar("GET", contenedor, { fields: "status_code" })) as { status_code?: string }).status_code ?? "";
      if (estado === "FINISHED" || estado === "ERROR" || estado === "EXPIRED") break;
      await pausa(espera);
    }
    if (estado === "ERROR" || estado === "EXPIRED") return { ok: false, error: `Instagram no pudo procesar la imagen (estado ${estado}).`, contenedorId: null };
    if (estado !== "FINISHED") return { ok: false, error: "Instagram aún procesa la imagen. Reintenta en unos minutos; se usará el mismo contenedor.", contenedorId: contenedor };
    const publicado = (await llamar("POST", `${ig}/media_publish`, { creation_id: contenedor })) as { id?: string };
    if (!publicado.id) throw new ErrorInstagram("Instagram no confirmó la publicación.");
    let permalink: string | null = null;
    try {
      permalink = ((await llamar("GET", publicado.id, { fields: "permalink" })) as { permalink?: string }).permalink ?? null;
    } catch {
      // La publicación ya está confirmada; el enlace se puede consultar después.
    }
    return { ok: true, mediaId: publicado.id, permalink, contenedorId: contenedor };
  } catch (e) {
    if (e instanceof ErrorInstagram) return { ok: false, error: e.message, contenedorId: contenedor };
    throw e;
  }
}

// ── Respuestas a comentarios y mensajes (permisos instagram_business_manage_comments
//    e instagram_business_manage_messages). Documentado por Meta:
//    POST /<COMENTARIO>/replies            message            → respuesta pública al comentario
//    POST /<IG_ID>/messages  recipient={comment_id}, message  → respuesta privada (una por comentario, hasta 7 días)
//    POST /<IG_ID>/messages  recipient={id: IGSID}, message   → mensaje directo (hasta 24 h después del último mensaje de la persona)

export type ResultadoRespuesta = { ok: true } | { ok: false; error: string };

async function intentar(fn: () => Promise<unknown>): Promise<ResultadoRespuesta> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof ErrorInstagram) return { ok: false, error: e.message };
    throw e;
  }
}

/** Texto (caption) de una publicación de la cuenta, para saber de qué contenido trata. */
export async function textoDePublicacion(mediaId: string): Promise<string | null> {
  try {
    return ((await llamar("GET", mediaId, { fields: "caption" })) as { caption?: string }).caption ?? null;
  } catch {
    return null;
  }
}

/** Respuesta pública a un comentario. */
export const responderComentario = (comentarioId: string, texto: string) => intentar(() => llamar("POST", `${comentarioId}/replies`, { message: texto }));

/** Mensaje privado a quien comentó (respuesta privada). */
export const responderEnPrivado = (comentarioId: string, texto: string) =>
  intentar(() => llamar("POST", `${process.env.INSTAGRAM_USER_ID?.trim() ?? ""}/messages`, { recipient: JSON.stringify({ comment_id: comentarioId }), message: JSON.stringify({ text: texto }) }));

/** Mensaje directo a quien nos escribió. */
export const enviarMensaje = (destinatarioId: string, texto: string) =>
  intentar(() => llamar("POST", `${process.env.INSTAGRAM_USER_ID?.trim() ?? ""}/messages`, { recipient: JSON.stringify({ id: destinatarioId }), message: JSON.stringify({ text: texto }) }));
