// Respuestas automáticas a comentarios y mensajes de Instagram. Instagram avisa
// cada comentario o mensaje al webhook (src/app/api/instagram/webhook); aquí se
// clasifica con las reglas de src/dominio/respuestas.ts y se responde:
//   - comentario en una publicación: respuesta pública breve y el detalle con
//     el enlace exacto por mensaje privado;
//   - mensaje directo: respuesta por mensaje con el enlace de la sección.
// Cada interacción se guarda una vez (por su id de Instagram), así un aviso
// repetido no responde dos veces. No se guarda el nombre de usuario.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { clasificar, enlacesDe, mensajePrivado, respuestaPublica, type Contexto } from "@/dominio/respuestas";
import type { TipoRed } from "@/dominio/redes";
import { municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { enviarMensaje, responderComentario, responderEnPrivado, urlPublica } from "./instagram";

/**
 * Firma de Meta (X-Hub-Signature-256 = sha256=<hmac del cuerpo con la clave
 * secreta>). Meta tiene dos claves: la de la app de Instagram
 * (INSTAGRAM_APP_SECRET) y la de la app de Meta que la contiene
 * (META_APP_SECRET, opcional). La documentación no precisa cuál firma con el
 * inicio de sesión de Instagram, así que se acepta cualquiera de las dos.
 */
export function firmaValida(cuerpo: string, firma: string | null): boolean {
  const secretos = [process.env.INSTAGRAM_APP_SECRET, process.env.META_APP_SECRET].map((s) => s?.trim()).filter((s): s is string => Boolean(s));
  if (!secretos.length || !firma?.startsWith("sha256=")) return false;
  const recibida = Buffer.from(firma);
  return secretos.some((secreto) => {
    const esperada = Buffer.from(`sha256=${createHmac("sha256", secreto).update(cuerpo, "utf8").digest("hex")}`);
    return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
  });
}

/** Qué falta para responder (además de las credenciales de publicación). */
export function faltantesRespuestas(): string[] {
  const f: string[] = [];
  if (!process.env.INSTAGRAM_APP_SECRET?.trim()) f.push("INSTAGRAM_APP_SECRET");
  if (!process.env.INSTAGRAM_WEBHOOK_TOKEN?.trim()) f.push("INSTAGRAM_WEBHOOK_TOKEN");
  if (!process.env.INSTAGRAM_USER_ID?.trim()) f.push("INSTAGRAM_USER_ID");
  if (!process.env.INSTAGRAM_ACCESS_TOKEN?.trim()) f.push("INSTAGRAM_ACCESS_TOKEN");
  if (!urlPublica()) f.push("APP_URL");
  return f;
}

export async function respuestasActivas() {
  const m = await db.municipio.findUnique({ where: { id: municipioActivo().id }, select: { redesResponderAuto: true } });
  return m?.redesResponderAuto ?? false;
}

const RUTA: Record<TipoRed, string> = { OPERATIVO: "/operativos", ADOPCION: "/adoptar", PERDIDA: "/mascotas", AVISTADA: "/mascotas" };

/** La publicación comentada, si la publicamos nosotros, con su página en el portal. */
async function contextoDe(mediaId: string | undefined, base: string): Promise<{ contexto: Contexto; tipo: string | null; origenId: string | null }> {
  if (!mediaId) return { contexto: null, tipo: null, origenId: null };
  const p = await db.publicacionRed.findFirst({ where: { igMediaId: mediaId, municipioId: municipioActivo().id }, select: { tipo: true, origenId: true } });
  if (!p) return { contexto: null, tipo: null, origenId: null };
  const tipo = p.tipo as TipoRed;
  return { contexto: { tipo, url: `${base}${RUTA[tipo]}/${p.origenId}` }, tipo, origenId: p.origenId };
}

type Comentario = { id: string; text?: string; from?: { id?: string }; media?: { id?: string }; parent_id?: string };
type Mensaje = { sender?: { id?: string }; message?: { mid?: string; text?: string; is_echo?: boolean } };
type Aviso = { object?: string; entry?: { changes?: { field?: string; value?: Comentario }[]; messaging?: Mensaje[] }[] };

/** Procesa un aviso del webhook. No lanza errores: cada interacción queda registrada con su estado. */
export async function procesarAviso(aviso: Aviso): Promise<void> {
  // Solo la forma del aviso (sin contenido ni identificadores), para diagnosticar en el registro de Netlify.
  console.info(
    `Webhook de Instagram: ${aviso.object ?? "sin objeto"} · ${(aviso.entry ?? [])
      .map((e) => [...(e.changes ?? []).map((c) => `changes:${c.field}`), ...(e.messaging ?? []).map(() => "messaging")].join(","))
      .join(" | ")}`,
  );
  if (aviso.object !== "instagram") return;
  const cuenta = process.env.INSTAGRAM_USER_ID?.trim();
  for (const entrada of aviso.entry ?? []) {
    const mensajes = [...(entrada.messaging ?? [])];
    for (const cambio of entrada.changes ?? []) {
      // El botón «Probar» de Meta envía los mensajes dentro de «changes».
      if (cambio.field === "messages" && cambio.value) {
        mensajes.push(cambio.value as unknown as Mensaje);
        continue;
      }
      const c = cambio.value;
      // Solo comentarios de otras personas; nunca respondemos a nuestras propias respuestas.
      if (cambio.field !== "comments" || !c?.id || !c.from?.id || c.from.id === cuenta) continue;
      await atenderComentario(c);
    }
    for (const m of mensajes) {
      if (!m.message?.mid || m.message.is_echo || !m.sender?.id || m.sender.id === cuenta || !m.message.text) continue;
      await atenderMensaje(m.sender.id, m.message.mid, m.message.text);
    }
  }
}

/** Registra la interacción una sola vez; devuelve false si ya se había recibido. */
async function registrar(datos: { canal: string; igId: string; autorIgId: string; mediaId?: string; origenTipo: string | null; origenId: string | null; texto: string; intencion: string }) {
  try {
    const fila = await db.interaccionRed.create({ data: { ...datos, municipioId: municipioActivo().id, estado: "RECIBIDA" } });
    return fila.id;
  } catch {
    return null; // id repetido: Instagram reenvió el mismo aviso
  }
}

async function atenderComentario(c: Comentario) {
  const base = urlPublica();
  const texto = (c.text ?? "").slice(0, 1000);
  const intencion = clasificar(texto);
  const { contexto, tipo, origenId } = base ? await contextoDe(c.media?.id, base) : { contexto: null, tipo: null, origenId: null };
  const id = await registrar({ canal: "COMENTARIO", igId: c.id, autorIgId: c.from!.id!, mediaId: c.media?.id, origenTipo: tipo, origenId, texto, intencion });
  if (!id) return;
  if (!base || !(await respuestasActivas())) return void (await db.interaccionRed.update({ where: { id }, data: { estado: "SIN_RESPUESTA" } }));

  const privado = mensajePrivado(intencion, contexto, enlacesDe(base));
  const publico = respuestaPublica(intencion, Boolean(privado));
  const errores: string[] = [];
  // Primero el mensaje privado: si falla, la respuesta pública no promete algo que no llegó.
  let privadoOk = false;
  if (privado) {
    const r = await responderEnPrivado(c.id, privado);
    privadoOk = r.ok;
    if (!r.ok) errores.push(`Mensaje privado: ${r.error}`);
  }
  const textoPublico = privado && !privadoOk ? null : publico;
  if (textoPublico) {
    const r = await responderComentario(c.id, textoPublico);
    if (!r.ok) errores.push(`Respuesta pública: ${r.error}`);
  }
  await db.interaccionRed.update({
    where: { id },
    data: { estado: errores.length ? "ERROR" : "RESPONDIDA", respuestaPublica: textoPublico, respuestaPrivada: privadoOk ? privado : null, error: errores.join(" ") || null },
  });
}

async function atenderMensaje(autor: string, mid: string, textoOriginal: string) {
  const base = urlPublica();
  const texto = textoOriginal.slice(0, 1000);
  const intencion = clasificar(texto);
  const id = await registrar({ canal: "MENSAJE", igId: mid, autorIgId: autor, origenTipo: null, origenId: null, texto, intencion });
  if (!id) return;
  if (!base || !(await respuestasActivas())) return void (await db.interaccionRed.update({ where: { id }, data: { estado: "SIN_RESPUESTA" } }));
  const respuesta = mensajePrivado(intencion, null, enlacesDe(base)) ?? `Gracias por escribirnos. Todo lo del programa está en el portal: ${base}`;
  const r = await enviarMensaje(autor, respuesta);
  await db.interaccionRed.update({ where: { id }, data: r.ok ? { estado: "RESPONDIDA", respuestaPrivada: respuesta } : { estado: "ERROR", error: r.error } });
}

/** Últimas interacciones, para el panel. */
export function ultimasInteracciones(limite = 20) {
  return db.interaccionRed.findMany({ where: { municipioId: municipioActivo().id }, orderBy: { creadaEn: "desc" }, take: limite });
}
