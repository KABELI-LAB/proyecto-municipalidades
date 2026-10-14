// Fotos que sube la ciudadanía. Se guardan fuera de `public/`: en desarrollo en
// la carpeta ALMACEN_DIR (por defecto `almacen/`, excluida de git) y, publicado
// en Netlify, en Netlify Blobs (el disco de Netlify no se conserva). Solo se
// entregan a través de rutas que comprueban permisos. Cada foto se vuelve a codificar:
// así se descartan los metadatos (incluida la ubicación GPS de la cámara) y
// cualquier contenido que no sea una imagen.
import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export type Carpeta = "reportes" | "adopciones" | "comunitarios" | "novedades" | "avisos" | "redes";

/** Tamaño máximo que se acepta (el portal ya la reduce antes de enviarla). */
export const MAXIMO_BYTES = 3 * 1024 * 1024;
const LADO_MAXIMO = 1600;
const FORMATOS = new Set(["jpeg", "png", "webp"]);
const NOMBRE_VALIDO = /^[0-9a-f-]{36}\.jpg$/;

export const MENSAJE_FOTO = {
  grande: "La foto pesa demasiado. Prueba con otra o tómala con menor resolución.",
  invalida: "No pudimos leer la foto. Usa una imagen JPG, PNG o WebP.",
} as const;

const raiz = () => path.resolve(process.env.ALMACEN_DIR || path.join(process.cwd(), "almacen"));

/** En Netlify (o con ALMACEN=blobs) las fotos van a Netlify Blobs; si no, al disco. */
const enBlobs = () => process.env.ALMACEN === "blobs" || Boolean(process.env.NETLIFY_BLOBS_CONTEXT);
const almacen = async () => (await import("@netlify/blobs")).getStore({ name: "fotos", consistency: "strong" });

async function escribir(carpeta: Carpeta, nombre: string, datos: Buffer) {
  if (enBlobs()) return void (await (await almacen()).set(`${carpeta}/${nombre}`, new Uint8Array(datos).buffer));
  await mkdir(path.join(raiz(), carpeta), { recursive: true });
  await writeFile(path.join(raiz(), carpeta, nombre), datos);
}

/** `huella`: sha256 de la foto ya recodificada; sirve para detectar la misma foto en dos propuestas. */
export type ResultadoFoto = { ok: true; nombre: string; huella: string } | { ok: false; mensaje: string };

export async function guardarFoto(archivo: Blob, carpeta: Carpeta): Promise<ResultadoFoto> {
  if (archivo.size === 0 || archivo.size > MAXIMO_BYTES) return { ok: false, mensaje: archivo.size === 0 ? MENSAJE_FOTO.invalida : MENSAJE_FOTO.grande };
  const entrada = Buffer.from(await archivo.arrayBuffer());
  let salida: Buffer;
  try {
    const { format } = await sharp(entrada).metadata();
    if (!format || !FORMATOS.has(format)) return { ok: false, mensaje: MENSAJE_FOTO.invalida };
    salida = await sharp(entrada)
      .rotate() // aplica la orientación de la cámara antes de descartar los metadatos
      .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return { ok: false, mensaje: MENSAJE_FOTO.invalida };
  }
  const nombre = `${randomUUID()}.jpg`;
  await escribir(carpeta, nombre, salida);
  return { ok: true, nombre, huella: createHash("sha256").update(salida).digest("hex") };
}

/** Guarda una imagen generada por el sistema (piezas para redes), ya en JPEG. */
export async function guardarGenerada(imagen: Buffer, carpeta: Carpeta): Promise<string> {
  const nombre = `${randomUUID()}.jpg`;
  await escribir(carpeta, nombre, imagen);
  return nombre;
}

/** Lee una foto guardada; null si el nombre no es válido o el archivo no existe. */
export async function leerFoto(carpeta: Carpeta, nombre: string): Promise<Buffer | null> {
  if (!NOMBRE_VALIDO.test(nombre)) return null;
  try {
    if (enBlobs()) {
      const datos = await (await almacen()).get(`${carpeta}/${nombre}`, { type: "arrayBuffer" });
      return datos ? Buffer.from(datos) : null;
    }
    return await readFile(path.join(raiz(), carpeta, nombre));
  } catch {
    return null;
  }
}

export async function borrarFoto(carpeta: Carpeta, nombre: string) {
  if (!NOMBRE_VALIDO.test(nombre)) return;
  if (enBlobs()) return void (await (await almacen()).delete(`${carpeta}/${nombre}`));
  await rm(path.join(raiz(), carpeta, nombre), { force: true });
}
