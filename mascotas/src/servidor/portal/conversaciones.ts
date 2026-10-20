"use server";
// Conversaciones protegidas entre quien publicó (aviso de mascota perdida o
// avistada, o ficha de adopción de un vecino) y una persona interesada.
//   - Quien publicó las ve y responde en Mis solicitudes (con su sesión).
//   - La persona interesada no necesita entrar: recibe por correo un enlace
//     privado a su conversación (firmado por el servidor) y responde ahí.
//   - Cada mensaje le llega al otro por correo, con el texto completo.
//   - Ninguno ve el correo ni el teléfono del otro, salvo que el otro pulse
//     «Compartir mi contacto».
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ESPECIE, especieConSexo, tipoAviso } from "@/dominio/etiquetas";
import { esquemaMensaje, validarCampos, type Errores } from "@/lib/esquemas";
import { db } from "@/servidor/db";
import { fechaCorta, hora } from "@/servidor/formato";
import { notificar } from "@/servidor/notificaciones";
import { filtroVecino, SESION_VENCIDA } from "@/servidor/portal/sesionVecino";

type Respuesta = { ok: boolean; mensaje: string; errores?: Errores };

const REVISE = "Revisa los datos marcados.";
const ERROR = "No pudimos completar la acción. Intenta de nuevo en unos minutos.";
const NO_ENCONTRADA = "No encontramos esta conversación. Abre el enlace más reciente que te llegó por correo.";

/** Una conversación vista por una de las dos partes. */
export type ConversacionVista = {
  id: string;
  /** Con quién conversas: el nombre de la persona interesada, o «quien publicó». */
  con: string;
  /** Sobre qué es: el aviso o la ficha. */
  sobre: string;
  enlaceSobre: string;
  mensajes: { mio: boolean; texto: string; fecha: string }[];
  /** El contacto de la otra parte, solo si lo compartió. */
  contactoDelOtro: string | null;
  compartiMiContacto: boolean;
};

// ───────────── Enlace privado de la persona interesada ─────────────

const secreto = () => process.env.SESION_SECRETO || "";
const firma = (id: string) => createHmac("sha256", secreto()).update(`conversacion:${id}`).digest("base64url").slice(0, 32);

function firmaValida(id: string, t: string) {
  const esperada = Buffer.from(firma(id));
  const recibida = Buffer.from(t);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

function enlacePrivado(id: string) {
  const base = process.env.APP_URL?.trim().replace(/\/+$/, "") ?? "";
  return `${base}/conversacion/${id}?t=${firma(id)}`;
}

// ───────────── Lectura ─────────────

const INCLUIR = {
  mensajes: { orderBy: { creadoEn: "asc" as const } },
  publicacion: { include: { sector: true, persona: true } },
  ficha: { include: { animal: true, proponente: true } },
};

type ConversacionCompleta = NonNullable<Awaited<ReturnType<typeof buscar>>>;
const buscar = (id: string) => db.conversacion.findUnique({ where: { id }, include: INCLUIR });

/** Sobre qué es la conversación, para los títulos y los correos. */
function tema(c: ConversacionCompleta) {
  if (c.publicacion) {
    const p = c.publicacion;
    // «perro café perdido», «perra café perdida», «gato gris avistado».
    return { sobre: `Aviso de ${especieConSexo(p.especie, p.sexo).toLowerCase()} ${p.colorPrincipal} ${tipoAviso(p.tipo, p.sexo).toLowerCase()} en ${p.sector.nombre}`, enlace: `/mascotas/${p.id}`, dueno: p.persona, lote: p.loteDemoId };
  }
  const f = c.ficha!;
  const nombre = f.animal.nombre ?? ESPECIE[f.animal.especie].toLowerCase();
  return { sobre: `${nombre}, en adopción`, enlace: `/adoptar/${f.id}`, dueno: f.proponente, lote: f.loteDemoId };
}

const contacto = (correo: string | null, telefono: string | null) => [telefono, correo].filter(Boolean).join(" · ") || null;

function vista(c: ConversacionCompleta, comoDueno: boolean): ConversacionVista {
  const t = tema(c);
  return {
    id: c.id,
    con: comoDueno ? c.interesadoNombre : "Quien publicó",
    sobre: t.sobre,
    enlaceSobre: t.enlace,
    mensajes: c.mensajes.map((m) => ({ mio: m.deDueno === comoDueno, texto: m.texto, fecha: `${fechaCorta(m.creadoEn)}, ${hora(m.creadoEn)}` })),
    contactoDelOtro: comoDueno
      ? c.interesadoComparte
        ? contacto(c.interesadoCorreo, c.interesadoTelefono)
        : null
      : c.duenoComparte
        ? contacto(t.dueno?.correo ?? null, t.dueno?.telefono ?? null)
        : null,
    compartiMiContacto: comoDueno ? c.duenoComparte : c.interesadoComparte,
  };
}

/** La conversación vista por la persona interesada (con el enlace privado), o null. */
export async function conversacionDeInteresado(id: string, t: string): Promise<ConversacionVista | null> {
  if (!id || !t || !firmaValida(id, t)) return null;
  const c = await buscar(id);
  return c ? vista(c, false) : null;
}

/** Las conversaciones de los avisos y fichas propios de quien tiene la sesión, para Mis solicitudes. */
export async function conversacionesComoDueno(): Promise<ConversacionVista[]> {
  const filtro = await filtroVecino();
  if (!filtro) return [];
  const lista = await db.conversacion.findMany({
    where: { OR: [{ publicacion: { persona: filtro } }, { ficha: { proponente: filtro } }] },
    include: INCLUIR,
    orderBy: { actualizadaEn: "desc" },
    take: 50,
  });
  return lista.map((c) => vista(c, true));
}

// ───────────── Escribir ─────────────

/**
 * Desde un aviso o una ficha: la persona interesada escribe a quien publicó.
 * Si ya conversaban (mismo correo), el mensaje se suma a esa conversación.
 */
export async function escribirAQuienPublico(valores: unknown): Promise<Respuesta> {
  const r = esquemaMensaje.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: REVISE, errores: validarCampos(esquemaMensaje, valores) };
  const d = r.data;
  const correo = d.correo.trim().toLowerCase();
  try {
    const destino = d.fichaId
      ? await db.fichaAdopcion.findFirst({ where: { id: d.fichaId, revision: "APROBADA", estado: { not: "ADOPTADO" }, proponenteId: { not: null } }, select: { id: true } })
      : await db.publicacionMascota.findFirst({ where: { id: d.publicacionId, estado: "ABIERTA", moderacion: "APROBADA" }, select: { id: true } });
    if (!destino) return { ok: false, mensaje: "Esta publicación ya no está disponible." };
    const clave = d.fichaId ? { fichaId_interesadoCorreo: { fichaId: destino.id, interesadoCorreo: correo } } : { publicacionId_interesadoCorreo: { publicacionId: destino.id, interesadoCorreo: correo } };
    const conv = await db.conversacion.upsert({
      where: clave,
      create: { ...(d.fichaId ? { fichaId: destino.id } : { publicacionId: destino.id }), interesadoNombre: d.nombre, interesadoCorreo: correo, interesadoTelefono: d.telefono || null },
      update: { interesadoNombre: d.nombre, ...(d.telefono ? { interesadoTelefono: d.telefono } : {}) },
    });
    await agregar(conv.id, false, d.texto, true);
    return { ok: true, mensaje: "Enviamos tu mensaje. Te llegará a tu correo un enlace para seguir la conversación." };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}

const esquemaTexto = z.object({ texto: z.string().trim().min(2, "Escribe un mensaje.").max(500, "Usa como máximo 500 caracteres.") });

/** La persona interesada responde desde su enlace privado. */
export async function escribirComoInteresado(valores: unknown): Promise<Respuesta> {
  const r = esquemaTexto.extend({ id: z.string(), t: z.string() }).safeParse(valores);
  if (!r.success) return { ok: false, mensaje: REVISE, errores: { texto: r.error.issues[0]?.message ?? REVISE } };
  if (!firmaValida(r.data.id, r.data.t)) return { ok: false, mensaje: NO_ENCONTRADA };
  return agregar(r.data.id, false, r.data.texto);
}

/** Quien publicó responde desde Mis solicitudes. */
export async function escribirComoDueno(valores: unknown): Promise<Respuesta> {
  const filtro = await filtroVecino();
  if (!filtro) return { ok: false, mensaje: SESION_VENCIDA };
  const r = esquemaTexto.extend({ id: z.string() }).safeParse(valores);
  if (!r.success) return { ok: false, mensaje: REVISE, errores: { texto: r.error.issues[0]?.message ?? REVISE } };
  const propia = await db.conversacion.findFirst({ where: { id: r.data.id, OR: [{ publicacion: { persona: filtro } }, { ficha: { proponente: filtro } }] }, select: { id: true } });
  if (!propia) return { ok: false, mensaje: NO_ENCONTRADA };
  return agregar(propia.id, true, r.data.texto);
}

/** Guarda el mensaje y se lo envía por correo a la otra parte (con el texto completo). */
async function agregar(id: string, deDueno: boolean, texto: string, primero = false): Promise<Respuesta> {
  try {
    const c = await buscar(id);
    if (!c) return { ok: false, mensaje: NO_ENCONTRADA };
    const t = tema(c);
    await db.$transaction(async (tx) => {
      await tx.mensajeConversacion.create({ data: { conversacionId: id, deDueno, texto } });
      await tx.conversacion.update({ where: { id }, data: { actualizadaEn: new Date() } });
      if (deDueno) {
        await notificar(
          tx,
          { correo: c.interesadoCorreo, telefono: null },
          "Te respondieron sobre la mascota",
          `Quien publicó «${t.sobre}» te escribió:\n\n«${texto}»\n\nPara responder, abre tu conversación (es privada, no la compartas): ${enlacePrivado(id)}`,
          t.lote,
        );
      } else if (t.dueno) {
        await notificar(
          tx,
          t.dueno,
          primero ? `${c.interesadoNombre} te escribió` : `${c.interesadoNombre} te respondió`,
          `${c.interesadoNombre} te escribió sobre «${t.sobre}»:\n\n«${texto}»\n\nPara responderle, entra a Mis solicitudes con tu correo. Tu respuesta le llegará sin mostrarle tu correo ni tu teléfono.`,
          t.lote,
        );
        // A quien escribe desde el aviso le enviamos (o reenviamos) el enlace para seguir la conversación.
        if (primero) {
          await notificar(
            tx,
            { correo: c.interesadoCorreo, telefono: null },
            "Tu conversación sobre la mascota",
            `Enviamos tu mensaje sobre «${t.sobre}». Cuando te respondan te avisaremos por correo.\n\nTu conversación (es privada, no la compartas): ${enlacePrivado(id)}`,
            t.lote,
          );
        }
      }
    });
    return { ok: true, mensaje: "Mensaje enviado." };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}

// ───────────── Compartir el contacto ─────────────

/** La persona interesada decide mostrarle su correo y teléfono a quien publicó. */
export async function compartirContactoInteresado(valores: unknown): Promise<Respuesta> {
  const r = z.object({ id: z.string(), t: z.string() }).safeParse(valores);
  if (!r.success || !firmaValida(r.data.id, r.data.t)) return { ok: false, mensaje: NO_ENCONTRADA };
  return compartir(r.data.id, false);
}

/** Quien publicó decide mostrarle su correo y teléfono a la persona interesada. */
export async function compartirContactoDueno(valores: unknown): Promise<Respuesta> {
  const filtro = await filtroVecino();
  if (!filtro) return { ok: false, mensaje: SESION_VENCIDA };
  const r = z.object({ id: z.string() }).safeParse(valores);
  if (!r.success) return { ok: false, mensaje: NO_ENCONTRADA };
  const propia = await db.conversacion.findFirst({ where: { id: r.data.id, OR: [{ publicacion: { persona: filtro } }, { ficha: { proponente: filtro } }] }, select: { id: true } });
  if (!propia) return { ok: false, mensaje: NO_ENCONTRADA };
  return compartir(propia.id, true);
}

async function compartir(id: string, deDueno: boolean): Promise<Respuesta> {
  try {
    const c = await buscar(id);
    if (!c) return { ok: false, mensaje: NO_ENCONTRADA };
    if (deDueno ? c.duenoComparte : c.interesadoComparte) return { ok: true, mensaje: "Ya habías compartido tu contacto." };
    const t = tema(c);
    await db.$transaction(async (tx) => {
      await tx.conversacion.update({ where: { id }, data: deDueno ? { duenoComparte: true } : { interesadoComparte: true } });
      if (deDueno) {
        const datos = contacto(t.dueno?.correo ?? null, t.dueno?.telefono ?? null);
        await notificar(tx, { correo: c.interesadoCorreo, telefono: null }, "Te compartieron su contacto", `Quien publicó «${t.sobre}» decidió compartir su contacto contigo: ${datos}.\n\nTu conversación: ${enlacePrivado(id)}`, t.lote);
      } else if (t.dueno) {
        const datos = contacto(c.interesadoCorreo, c.interesadoTelefono);
        await notificar(tx, t.dueno, `${c.interesadoNombre} te compartió su contacto`, `${c.interesadoNombre} decidió compartir su contacto contigo, sobre «${t.sobre}»: ${datos}.`, t.lote);
      }
    });
    return { ok: true, mensaje: "Compartimos tu contacto. Le avisamos por correo." };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}
