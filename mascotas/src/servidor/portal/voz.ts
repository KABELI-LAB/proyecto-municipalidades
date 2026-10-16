// La voz fija de Pawni: el audio se genera en el servidor con Azure Speech, así
// suena igual en todos los equipos. Solo se envía el texto de Pawni (nunca lo
// que dijo la persona) y solo textos que firmó el propio servidor, para que
// nadie use el servicio para leer cualquier cosa. Cada audio se genera una vez
// y se guarda (Netlify Blobs publicado; memoria en desarrollo).
// Configuración (variables de entorno del servidor):
//   AZURE_SPEECH_ENDPOINT  https://<recurso>.cognitiveservices.azure.com
//   AZURE_SPEECH_KEY       clave del recurso
//   PAWNI_VOZ              nombre de la voz (por ejemplo es-MX-MarinaNeural)
//   PAWNI_VOZ_TONO         opcional, por ejemplo +10%
//   PAWNI_VOZ_ESTILO       opcional, por ejemplo cheerful
// Sin ellas, Pawni usa la voz del navegador.
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Largo máximo de lo que Pawni lee de una vez. */
export const MAXIMO_VOZ = 600;

const VOZ_PREDETERMINADA = "es-MX-MarinaNeural";

function configuracion() {
  const endpoint = process.env.AZURE_SPEECH_ENDPOINT?.trim().replace(/\/+$/, "");
  const clave = process.env.AZURE_SPEECH_KEY?.trim();
  if (!endpoint || !clave) return null;
  return {
    endpoint,
    clave,
    voz: process.env.PAWNI_VOZ?.trim() || VOZ_PREDETERMINADA,
    tono: process.env.PAWNI_VOZ_TONO?.trim() || "",
    estilo: process.env.PAWNI_VOZ_ESTILO?.trim() || "",
  };
}

export const vozConfigurada = () => configuracion() !== null;

const secreto = () => process.env.SESION_SECRETO || "pawni";

/**
 * Firma corta de un texto que Pawni puede decir con la voz del servidor. Lleva
 * la voz configurada: si se cambia la voz, cambian las direcciones y no quedan
 * audios antiguos guardados en los navegadores.
 */
export function firmarVoz(texto: string): string {
  const c = configuracion();
  const voz = c ? `${c.voz}|${c.tono}|${c.estilo}` : "";
  return createHmac("sha256", secreto()).update(`voz:${voz}:${texto}`).digest("base64url").slice(0, 22);
}

/** Firmas de varios textos, o vacío si la voz del servidor no está configurada. */
export function firmasVoz(textos: string[]): Record<string, string> {
  if (!vozConfigurada()) return {};
  return Object.fromEntries(textos.map((t) => [t, firmarVoz(t)]));
}

export function firmaVozValida(texto: string, firma: string): boolean {
  const esperada = Buffer.from(firmarVoz(texto));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

const escapar = (s: string) => s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

/** SSML con la voz, el tono y el estilo configurados. */
export function ssmlDe(texto: string, c: { voz: string; tono: string; estilo: string }): string {
  const idioma = c.voz.slice(0, 5);
  let interior = escapar(texto);
  if (c.tono) interior = `<prosody pitch="${escapar(c.tono)}">${interior}</prosody>`;
  if (c.estilo) interior = `<mstts:express-as style="${escapar(c.estilo)}">${interior}</mstts:express-as>`;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${escapar(idioma)}"><voice name="${escapar(c.voz)}">${interior}</voice></speak>`;
}

// Audios ya generados: en memoria (siempre) y en Netlify Blobs (publicado).
const memoria = new Map<string, Buffer>();
const enBlobs = () => Boolean(process.env.NETLIFY_BLOBS_CONTEXT);
const almacen = async () => (await import("@netlify/blobs")).getStore({ name: "voz-pawni", consistency: "eventual" });

/** El audio MP3 del texto, o null si la voz no está configurada o Azure falla. */
export async function audioDe(texto: string): Promise<Buffer | null> {
  const c = configuracion();
  if (!c) return null;
  const clave = createHash("sha256").update(`${c.voz}|${c.tono}|${c.estilo}|${texto}`).digest("hex");
  const enMemoria = memoria.get(clave);
  if (enMemoria) return enMemoria;
  if (enBlobs()) {
    const guardado = await (await almacen()).get(clave, { type: "arrayBuffer" }).catch(() => null);
    if (guardado) return guarda(clave, Buffer.from(guardado));
  }
  try {
    const r = await fetch(`${c.endpoint}/tts/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": c.clave,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "pawni",
      },
      body: ssmlDe(texto, c),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`Voz de Pawni: Azure respondió ${r.status}`);
      return null;
    }
    const audio = Buffer.from(await r.arrayBuffer());
    if (enBlobs()) await (await almacen()).set(clave, new Uint8Array(audio).buffer).catch(() => {});
    return guarda(clave, audio);
  } catch (e) {
    console.error("Voz de Pawni: no se pudo generar el audio", e instanceof Error ? e.name : "");
    return null;
  }
}

function guarda(clave: string, audio: Buffer) {
  // Un tope sencillo para no llenar la memoria del servidor.
  if (memoria.size > 300) memoria.delete(memoria.keys().next().value!);
  memoria.set(clave, audio);
  return audio;
}
