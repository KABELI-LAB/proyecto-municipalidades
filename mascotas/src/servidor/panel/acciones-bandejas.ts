"use server";
// Acciones de las bandejas de revisión. Cada una comprueba el permiso y que el
// registro siga en un estado que permite el cambio (otra persona pudo
// adelantarse). Los registros nuevos heredan el lote de demostración del padre.
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { TRANSICION_COINCIDENCIA, TRANSICION_REPORTE } from "@/dominio/bandejas";
import { TRANSICION_REVISION } from "@/dominio/propuestas";
import type { Permiso } from "@/dominio/permisos";
import { municipioActivo } from "@/lib/municipio";
import { autorizar, type UsuarioSesion } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { notificar } from "@/servidor/notificaciones";
import { difundirEnInstagram, notaInstagram } from "@/servidor/redes/servicio";

type Respuesta = { ok: boolean; mensaje: string };

const SIN_PERMISO: Respuesta = { ok: false, mensaje: "Tu cuenta no tiene permiso para esta acción." };
const YA_CAMBIO: Respuesta = { ok: false, mensaje: "Este registro ya cambió de estado. Actualiza la página para ver su estado actual." };
const ERROR: Respuesta = { ok: false, mensaje: "No pudimos guardar el cambio. Intenta nuevamente." };
const enMunicipio = () => ({ sector: { municipioId: municipioActivo().id } });

async function con(permiso: Permiso, rutas: string[], accion: (usuario: UsuarioSesion) => Promise<Respuesta>): Promise<Respuesta> {
  const usuario = await autorizar(permiso);
  if (!usuario) return SIN_PERMISO;
  try {
    const r = await accion(usuario);
    if (r.ok) {
      for (const ruta of [...rutas, "/panel"]) revalidatePath(ruta);
      revalidatePath("/", "layout");
    }
    return r;
  } catch (e) {
    console.error(e);
    return ERROR;
  }
}

// ───────────── Reportes ─────────────
// Cada cambio de estado queda en el historial con quién lo hizo y cuándo.

const anotar = (tx: Prisma.TransactionClient, reporteId: string, estado: "EN_REVISION" | "CERRADO", u: UsuarioSesion) =>
  tx.historialReporte.create({ data: { reporteId, estado, usuarioId: u.id } });

export async function revisarReporte(id: string) {
  return con("gestionarReportes", ["/panel/reportes"], (u) =>
    db.$transaction(async (tx) => {
      const r = await tx.reporteCiudadano.updateMany({ where: { id, estado: { in: [...TRANSICION_REPORTE.revisar] }, ...enMunicipio() }, data: { estado: "EN_REVISION" } });
      if (!r.count) return YA_CAMBIO;
      await anotar(tx, id, "EN_REVISION", u);
      return { ok: true, mensaje: "El reporte quedó en revisión." };
    }),
  );
}

export async function cerrarReporte(id: string) {
  return con("gestionarReportes", ["/panel/reportes"], async (u) => {
    const reporte = await db.reporteCiudadano.findFirst({ where: { id, estado: { in: [...TRANSICION_REPORTE.cerrar] }, ...enMunicipio() }, include: { persona: true } });
    if (!reporte) return YA_CAMBIO;
    await db.$transaction(async (tx) => {
      await tx.reporteCiudadano.update({ where: { id }, data: { estado: "CERRADO", cerradoEn: new Date() } });
      await anotar(tx, id, "CERRADO", u);
      if (reporte.persona && reporte.codigo) {
        await notificar(tx, reporte.persona, "Tu reporte fue revisado", `El equipo municipal revisó y cerró tu reporte ${reporte.codigo}. Gracias por avisarnos.`, reporte.loteDemoId);
      }
    });
    return { ok: true, mensaje: "Cerramos el reporte." };
  });
}

export async function reabrirReporte(id: string) {
  return con("gestionarReportes", ["/panel/reportes"], (u) =>
    db.$transaction(async (tx) => {
      const r = await tx.reporteCiudadano.updateMany({ where: { id, estado: { in: [...TRANSICION_REPORTE.reabrir] }, ...enMunicipio() }, data: { estado: "EN_REVISION", cerradoEn: null } });
      if (!r.count) return YA_CAMBIO;
      await anotar(tx, id, "EN_REVISION", u);
      return { ok: true, mensaje: "El reporte volvió a revisión." };
    }),
  );
}

// ───────────── Publicaciones ─────────────

/**
 * «Aceptar y publicar» un aviso de mascota perdida o avistada que envió un
 * vecino: desde ese momento se ve en el portal, se publica en Instagram y se
 * avisa a quien lo envió. También sirve para volver a mostrar uno oculto.
 */
export async function aprobarPublicacion(id: string) {
  return con("moderarPublicaciones", ["/panel/publicaciones", "/mascotas", "/"], async (u) => {
    const p = await db.publicacionMascota.findFirst({ where: { id, estado: "ABIERTA", moderacion: { in: ["PENDIENTE", "OCULTA"] }, ...enMunicipio() }, include: { persona: true } });
    if (!p) return YA_CAMBIO;
    const r = await db.publicacionMascota.updateMany({ where: { id, moderacion: p.moderacion }, data: { moderacion: "APROBADA" } });
    if (!r.count) return YA_CAMBIO;
    if (p.moderacion === "PENDIENTE") {
      await notificar(db, p.persona, "Publicamos tu aviso", `Revisamos y publicamos tu aviso${p.codigo ? ` ${p.codigo}` : ""} en el portal y en las redes sociales del municipio. Te avisaremos si aparece una publicación que podría corresponder.`, p.loteDemoId);
    }
    const instagram = await difundirEnInstagram(p.tipo === "PERDIDA" ? "PERDIDA" : "AVISTADA", id, u.id);
    return { ok: true, mensaje: `Publicamos el aviso en el portal.${notaInstagram(instagram)}` };
  });
}

export async function ocultarPublicacion(id: string) {
  return con("moderarPublicaciones", ["/panel/publicaciones", "/mascotas"], async () => {
    const p = await db.publicacionMascota.findFirst({ where: { id, moderacion: { not: "OCULTA" }, ...enMunicipio() }, include: { persona: true } });
    if (!p) return YA_CAMBIO;
    await db.$transaction(async (tx) => {
      await tx.publicacionMascota.update({ where: { id }, data: { moderacion: "OCULTA" } });
      await notificar(tx, p.persona, "Tu publicación no está visible", `Ocultamos tu publicación${p.codigo ? ` ${p.codigo}` : ""} porque no cumple las condiciones de uso del portal. Si crees que es un error, escríbenos.`, p.loteDemoId);
    });
    return { ok: true, mensaje: "Ocultamos la publicación y avisamos a quien la publicó." };
  });
}

/**
 * Para cuando la persona avisa por otra vía (teléfono, en persona) que su
 * mascota volvió, o perdió su código. Solo cierra este aviso; no se sabe si
 * vino de una coincidencia, así que ese dato queda vacío.
 */
export async function marcarReencontrada(id: string) {
  return con("moderarPublicaciones", ["/panel/publicaciones", "/panel/coincidencias", "/mascotas", "/"], async () => {
    const p = await db.publicacionMascota.findFirst({ where: { id, estado: "ABIERTA", ...enMunicipio() }, include: { persona: true } });
    if (!p) return YA_CAMBIO;
    await db.$transaction(async (tx) => {
      await tx.publicacionMascota.update({ where: { id }, data: { estado: "REENCONTRADA", resueltaEn: new Date(), reencuentroPorCoincidencia: null } });
      await notificar(tx, p.persona, "Retiramos tu aviso", `Registramos que la mascota de tu aviso${p.codigo ? ` ${p.codigo}` : ""} ya volvió a casa, así que dejó de mostrarse en el portal. Si no corresponde, escríbenos.`, p.loteDemoId);
    });
    return { ok: true, mensaje: "Registramos el reencuentro. El aviso dejó de mostrarse en el portal." };
  });
}

// ───────────── Coincidencias ─────────────

const coincidenciaAbierta = (id: string, estados: readonly string[]) =>
  db.coincidencia.findFirst({
    where: { id, estado: { in: [...estados] as ("SUGERIDA" | "VALIDADA" | "DESCARTADA")[] }, perdida: { estado: "ABIERTA", ...enMunicipio() }, encontrada: { estado: "ABIERTA" } },
    include: { perdida: { include: { persona: true } }, encontrada: { include: { persona: true } } },
  });

/** Validar: el equipo cree que vale la pena que las personas se contacten. Nunca se afirma que es el mismo animal. */
export async function validarCoincidencia(id: string) {
  return con("moderarPublicaciones", ["/panel/coincidencias"], async () => {
    const c = await coincidenciaAbierta(id, TRANSICION_COINCIDENCIA.validar);
    if (!c) return YA_CAMBIO;
    await db.$transaction(async (tx) => {
      await tx.coincidencia.update({ where: { id }, data: { estado: "VALIDADA" } });
      for (const p of [c.perdida, c.encontrada]) {
        await notificar(tx, p.persona, "Revisa una posible coincidencia", "El equipo municipal revisó una publicación que podría corresponder a la tuya. Te recomendamos revisarla y escribir a la otra persona a través del portal.", p.loteDemoId);
      }
    });
    return { ok: true, mensaje: "Validamos la coincidencia y avisamos a ambas personas." };
  });
}

export async function descartarCoincidencia(id: string) {
  return con("moderarPublicaciones", ["/panel/coincidencias"], async () => {
    // Solo mientras ambas publicaciones siguen abiertas: un reencuentro registrado no se deshace así.
    if (!(await coincidenciaAbierta(id, TRANSICION_COINCIDENCIA.descartar))) return YA_CAMBIO;
    await db.coincidencia.update({ where: { id }, data: { estado: "DESCARTADA" } });
    return { ok: true, mensaje: "Descartamos la coincidencia: ya no se mostrará como sugerencia." };
  });
}

/** Ambas publicaciones quedan reencontradas, registrando que vino de una coincidencia sugerida (sección 6, paso 5). */
export async function registrarReencuentro(id: string) {
  return con("moderarPublicaciones", ["/panel/coincidencias", "/mascotas", "/"], async () => {
    const c = await coincidenciaAbierta(id, TRANSICION_COINCIDENCIA.registrarReencuentro);
    if (!c) return YA_CAMBIO;
    const ahora = new Date();
    await db.$transaction(async (tx) => {
      await tx.coincidencia.update({ where: { id }, data: { estado: "VALIDADA" } });
      await tx.publicacionMascota.updateMany({
        where: { id: { in: [c.perdidaId, c.encontradaId] } },
        data: { estado: "REENCONTRADA", resueltaEn: ahora, reencuentroPorCoincidencia: true },
      });
    });
    return { ok: true, mensaje: "Registramos el reencuentro. Ambas publicaciones dejaron de mostrarse en el portal." };
  });
}

// ───────────── Propuestas de adopción («Dar en adopción») ─────────────
// Solo las APROBADA se ven en el catálogo. Cada decisión guarda quién y cuándo,
// y se avisa a quien propuso (simulado). Los motivos se le muestran tal cual.

const nombreDe = (a: { nombre: string | null }) => a.nombre ?? "el animal";
const RUTAS_PROPUESTAS = ["/panel/propuestas", "/adoptar", "/"];
const MOTIVO_CORTO: Respuesta = { ok: false, mensaje: "Escribe el motivo en al menos 10 caracteres: se lo mostraremos a quien propuso." };

async function revisarPropuesta(
  id: string,
  desde: readonly string[],
  u: UsuarioSesion,
  datos: { revision: "APROBADA" | "CORRECCIONES" | "RECHAZADA" | "OCULTA"; motivo?: string },
  aviso: (nombre: string, codigo: string) => [string, string] | null,
): Promise<Respuesta | null> {
  const f = await db.fichaAdopcion.findFirst({
    where: { id, revision: { in: [...desde] as ("PENDIENTE" | "CORRECCIONES" | "APROBADA" | "OCULTA")[] }, OR: [{ proponente: { municipioId: municipioActivo().id } }, { proponenteId: null }] },
    include: { proponente: true, animal: { select: { nombre: true } } },
  });
  if (!f) return null;
  const ahora = new Date();
  await db.$transaction(async (tx) => {
    await tx.fichaAdopcion.update({
      where: { id },
      data: {
        revision: datos.revision,
        motivoRevision: datos.motivo ?? null,
        revisadaEn: ahora,
        revisadoPorId: u.id,
        // Al publicarse por primera vez, la ficha empieza a contar su tiempo en el catálogo.
        ...(datos.revision === "APROBADA" && f.revision === "PENDIENTE" ? { publicadaEn: ahora } : {}),
      },
    });
    const texto = f.proponente ? aviso(nombreDe(f.animal), f.codigo ?? "") : null;
    if (f.proponente && texto) await notificar(tx, f.proponente, texto[0], texto[1], f.loteDemoId);
  });
  return { ok: true, mensaje: "" };
}

export async function aprobarPropuesta(id: string) {
  return con("gestionarAdopciones", RUTAS_PROPUESTAS, async (u) => {
    const r = await revisarPropuesta(id, TRANSICION_REVISION.aprobar, u, { revision: "APROBADA" }, (n, c) => [
      "Publicamos tu propuesta de adopción",
      `Revisamos y publicamos la ficha de ${n} (${c}) en el catálogo de adopción. Tú recibes las postulaciones: revísalas en Mis solicitudes con tu RUT y este código, y elige con quién compartir tu contacto.`,
    ]);
    if (!r) return YA_CAMBIO;
    // Ficha aprobada: también a Instagram. Sin autorización de quien la propuso, no se publica allí.
    const instagram = await difundirEnInstagram("ADOPCION", id, u.id);
    return { ok: true, mensaje: `Publicamos la ficha en el catálogo de adopción y avisamos a quien la propuso.${notaInstagram(instagram)}` };
  });
}

export async function pedirCorrecciones(id: string, motivo: string) {
  return con("gestionarAdopciones", RUTAS_PROPUESTAS, async (u) => {
    if (motivo.trim().length < 10) return MOTIVO_CORTO;
    const r = await revisarPropuesta(id, TRANSICION_REVISION.pedirCorrecciones, u, { revision: "CORRECCIONES", motivo: motivo.trim() }, (n, c) => [
      "Tu propuesta de adopción necesita correcciones",
      `Antes de publicar la ficha de ${n} (${c}) te pedimos corregir algunos datos: ${motivo.trim()} Puedes corregirla en Mis solicitudes con tu RUT y este código.`,
    ]);
    return r ? { ok: true, mensaje: "Pedimos las correcciones a quien propuso." } : YA_CAMBIO;
  });
}

export async function rechazarPropuesta(id: string, motivo: string) {
  return con("gestionarAdopciones", RUTAS_PROPUESTAS, async (u) => {
    if (motivo.trim().length < 10) return MOTIVO_CORTO;
    const r = await revisarPropuesta(id, TRANSICION_REVISION.rechazar, u, { revision: "RECHAZADA", motivo: motivo.trim() }, (n, c) => [
      "Sobre tu propuesta de adopción",
      `Revisamos la propuesta de ${n} (${c}) y no podemos publicarla: ${motivo.trim()} Si tienes dudas, escríbenos.`,
    ]);
    return r ? { ok: true, mensaje: "La propuesta quedó como no publicada y avisamos a quien la propuso." } : YA_CAMBIO;
  });
}

export async function ocultarFichaAdopcion(id: string, motivo: string) {
  return con("gestionarAdopciones", RUTAS_PROPUESTAS, async (u) => {
    if (motivo.trim().length < 10) return MOTIVO_CORTO;
    // Con una adopción en curso no se oculta: primero se resuelven las postulaciones aprobadas.
    if (await db.fichaAdopcion.count({ where: { id, estado: "EN_PROCESO" } })) return { ok: false, mensaje: "Hay una adopción en curso. Resuelve primero la postulación aprobada." };
    const r = await revisarPropuesta(id, TRANSICION_REVISION.ocultar, u, { revision: "OCULTA", motivo: motivo.trim() }, (n, c) => [
      "Retiramos una ficha de adopción",
      `Retiramos del catálogo la ficha de ${n} (${c}): ${motivo.trim()} Si tienes dudas, escríbenos.`,
    ]);
    return r ? { ok: true, mensaje: "La ficha dejó de mostrarse en el catálogo." } : YA_CAMBIO;
  });
}

export async function volverAPublicarFicha(id: string) {
  return con("gestionarAdopciones", RUTAS_PROPUESTAS, async (u) => {
    const r = await revisarPropuesta(id, TRANSICION_REVISION.volverAPublicar, u, { revision: "APROBADA" }, () => null);
    return r ? { ok: true, mensaje: "La ficha volvió al catálogo." } : YA_CAMBIO;
  });
}
