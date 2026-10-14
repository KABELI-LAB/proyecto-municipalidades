"use server";
// Ciclo completo de un operativo (docs/concepto.md, sección 5): crear, publicar
// con invitación prioritaria, gestionar cupos y lista de espera, recordar,
// iniciar, cerrar con retorno a la demanda pendiente, o cancelar.
//
// Lo que crea una cuenta de demostración hereda su lote (usuario.loteDemoId).
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { CUPO_VIGENTE } from "@/dominio/cupos";
import { calcularResultado, destinoDe, esEditable, puedeTransitar, type EstadoOperativo, type Transicion } from "@/dominio/operativos";
import { municipioActivo } from "@/lib/municipio";
import { autorizar } from "@/servidor/auth";
import { nuevoCodigo } from "@/servidor/codigos";
import { db } from "@/servidor/db";
import { fechaLarga, inicioDeHoy, medianocheEn } from "@/servidor/formato";
import { cerrarInvitacionesAbiertas, invitacionesActivas, invitarSiguientes, procesarOperativo, promoverEspera } from "@/servidor/invitaciones";
import { notificar } from "@/servidor/notificaciones";
import { prioridades } from "@/servidor/panel/indicadores";
import { difundirEnInstagram, notaInstagram } from "@/servidor/redes/servicio";

type Tx = Prisma.TransactionClient;
export type Respuesta = { ok: true; mensaje: string; id?: string } | { ok: false; mensaje: string; errores?: Record<string, string> };

const SIN_PERMISO: Respuesta = { ok: false, mensaje: "Su cuenta no tiene permiso para esta acción." };
const ERROR = "No pudimos completar la acción. Intente nuevamente.";

async function gestor() {
  return autorizar("gestionarOperativos");
}

const refrescar = (id?: string) => {
  revalidatePath("/panel", "layout");
  if (id) revalidatePath(`/operativos/${id}`);
  revalidatePath("/operativos");
  revalidatePath("/");
};

// ───────────── Crear y editar (borrador) ─────────────

const esquemaOperativo = z.object({
  id: z.string().optional(),
  sectorId: z.string().min(1, "Elija el sector."),
  lugarId: z.string().min(1, "Elija el lugar de referencia."),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indique la fecha."),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Indique la hora de inicio."),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Indique la hora de término."),
  requisitos: z.string().trim().max(600),
  origen: z.enum(["RECOMENDACION", "FICHA_SECTOR", "DESDE_CERO"]),
  capacidades: z.record(z.string(), z.coerce.number().int().min(0, "Use 0 o más.").max(500)),
});

export async function guardarOperativo(valores: unknown): Promise<Respuesta> {
  const u = await gestor();
  if (!u) return SIN_PERMISO;
  const r = esquemaOperativo.safeParse(valores);
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[String(i.path[0])] ??= i.message;
    return { ok: false, mensaje: "Revise los datos marcados.", errores };
  }
  const d = r.data;
  const errores: Record<string, string> = {};
  const fecha = new Date(medianocheEn(d.fecha).getTime() + Number(d.horaInicio.slice(0, 2)) * 3_600_000 + Number(d.horaInicio.slice(3)) * 60_000);
  if (medianocheEn(d.fecha) < inicioDeHoy()) errores.fecha = "La fecha no puede ser anterior a hoy.";
  if (d.horaFin <= d.horaInicio) errores.horaFin = "La hora de término debe ser posterior a la de inicio.";
  const capacidades = Object.entries(d.capacidades).filter(([, n]) => n > 0);
  if (capacidades.length === 0) errores.capacidades = "Indique cupos para al menos un servicio.";
  const municipio = municipioActivo();
  if (!(await db.sector.findFirst({ where: { id: d.sectorId, municipioId: municipio.id } }))) errores.sectorId = "Elija un sector de la lista.";
  else if (!(await db.lugar.findFirst({ where: { id: d.lugarId, sectorId: d.sectorId } }))) errores.lugarId = "Elija un lugar del sector.";
  // Servicios activos; al editar, también los que el operativo ya ofrecía aunque luego se desactivaran.
  const servicios = await db.servicio.findMany({
    where: { municipioId: municipio.id, id: { in: capacidades.map(([s]) => s) }, OR: [{ activo: true }, ...(d.id ? [{ capacidades: { some: { operativoId: d.id } } }] : [])] },
  });
  if (servicios.length !== capacidades.length) errores.capacidades = "Hay un servicio que no existe o ya no se ofrece.";
  if (Object.keys(errores).length > 0) return { ok: false, mensaje: "Revise los datos marcados.", errores };

  const datos = {
    sectorId: d.sectorId,
    lugarId: d.lugarId,
    fecha,
    horaInicio: d.horaInicio,
    horaFin: d.horaFin,
    requisitos: d.requisitos,
  };

  try {
    if (d.id) {
      const actual = await db.operativo.findUnique({ where: { id: d.id } });
      if (!actual || !esEditable(actual.estado as EstadoOperativo)) return { ok: false, mensaje: "Solo se puede editar un operativo en borrador." };
      await db.$transaction([
        db.operativo.update({ where: { id: d.id }, data: datos }),
        db.capacidadServicio.deleteMany({ where: { operativoId: d.id } }),
        db.capacidadServicio.createMany({ data: capacidades.map(([servicioId, cupos]) => ({ operativoId: d.id!, servicioId, cupos })) }),
      ]);
      refrescar(d.id);
      return { ok: true, mensaje: "Guardamos los cambios del borrador.", id: d.id };
    }

    // Si nace de la prioridad o de la ficha, queda registrada la decisión con el índice de ese momento.
    const p = d.origen === "DESDE_CERO" ? undefined : (await prioridades()).find((x) => x.sectorId === d.sectorId);
    const creado = await db.$transaction(async (tx) => {
      const o = await tx.operativo.create({
        data: {
          ...datos,
          origen: d.origen,
          estado: "BORRADOR",
          creadoPorId: u.id,
          loteDemoId: u.loteDemoId,
          capacidades: { create: capacidades.map(([servicioId, cupos]) => ({ servicioId, cupos })) },
        },
      });
      if (p) {
        await tx.decisionPrioridad.create({
          data: { sectorId: d.sectorId, puntaje: p.puntaje, nivel: p.nivel, motivos: p.motivos.join("; "), accion: "OPERATIVO_CREADO", usuarioId: u.id, loteDemoId: u.loteDemoId },
        });
      }
      return o;
    });
    refrescar(creado.id);
    return { ok: true, mensaje: "Creamos el operativo en borrador.", id: creado.id };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}

/**
 * Crear y publicar en un solo paso (formulario corto del panel): el sector se
 * deduce del lugar. Si la publicación falla, el operativo queda en borrador
 * para revisarlo.
 */
export async function crearYPublicarOperativo(valores: unknown): Promise<Respuesta> {
  const lugarId = z.object({ lugarId: z.string().min(1) }).safeParse(valores);
  const lugar = lugarId.success ? await db.lugar.findFirst({ where: { id: lugarId.data.lugarId, sector: { municipioId: municipioActivo().id } } }) : null;
  if (!lugar) return { ok: false, mensaje: "Revise los datos marcados.", errores: { lugarId: "Elija el lugar de la lista." } };
  const creado = await guardarOperativo({ ...(valores as object), id: undefined, sectorId: lugar.sectorId, origen: "DESDE_CERO" });
  if (!creado.ok || !creado.id) return creado;
  const publicado = await publicar(creado.id);
  return publicado.ok ? { ...publicado, id: creado.id } : { ok: true, mensaje: `Guardamos el operativo, pero no pudimos publicarlo: ${publicado.mensaje} Quedó en borrador.`, id: creado.id };
}

// ───────────── Invitación prioritaria ─────────────
// Las invitaciones son registros propios (src/servidor/invitaciones.ts): retienen
// el cupo sin reservarlo; la persona confirma interés y el sistema asigna.

// ───────────── Transiciones ─────────────

type OperativoEnTransicion = {
  id: string;
  sectorId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  loteDemoId: string | null;
  sector: { nombre: string };
  lugar: { nombre: string };
};

async function transitar(id: string, t: Transicion, efecto?: (tx: Tx, o: OperativoEnTransicion) => Promise<string | void>): Promise<Respuesta> {
  const u = await gestor();
  if (!u) return SIN_PERMISO;
  try {
    const mensaje = await db.$transaction(async (tx) => {
      const o = await tx.operativo.findFirst({ where: { id, sector: { municipioId: municipioActivo().id } }, include: { sector: true, lugar: true } });
      if (!o) throw new ErrorDeUso("No encontramos el operativo.");
      if (!puedeTransitar(o.estado as EstadoOperativo, t)) throw new ErrorDeUso("El operativo ya no está en un estado que permita esta acción. Actualice la página.");
      const extra = efecto ? await efecto(tx, o) : undefined;
      await tx.operativo.update({
        where: { id },
        data: {
          estado: destinoDe(t),
          ...(t === "publicar" ? { publicadoEn: new Date() } : {}),
          ...(t === "cerrar" ? { cerradoEn: new Date() } : {}),
        },
      });
      return extra;
    }, { timeout: 30_000 });
    refrescar(id);
    return { ok: true, mensaje: mensaje ?? "Listo." };
  } catch (e) {
    if (e instanceof ErrorDeUso) return { ok: false, mensaje: e.message };
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}

class ErrorDeUso extends Error {}

/**
 * Publicar: invita primero a la demanda pendiente y prepara el aviso para
 * comunicaciones. Ya publicado, se publica también en Instagram; si eso
 * falla, el operativo igual queda publicado y se puede reintentar.
 */
export async function publicar(id: string) {
  const r = await transitar(id, "publicar", async (tx, o) => {
    // Primero queda publicado: las invitaciones solo se envían para un operativo abierto.
    await tx.operativo.update({ where: { id }, data: { estado: "PUBLICADO", publicadoEn: new Date() } });
    const invitadas = await invitarSiguientes(tx, id);
    // Si el operativo ya tiene un aviso (por ejemplo, el borrador de la demo), se
    // reutiliza; si no, se prepara uno nuevo. Comunicaciones lo revisa antes de publicarlo.
    const existente = await tx.aviso.findFirst({ where: { operativoId: id, tipo: "OPERATIVO" } });
    if (!existente) {
      await tx.aviso.create({
        data: {
          tipo: "OPERATIVO",
          titulo: `Operativo en ${o.sector.nombre}`,
          texto: `El ${fechaLarga(o.fecha)}, de ${o.horaInicio} a ${o.horaFin} horas, realizaremos un operativo en ${o.lugar.nombre}. Inscríbase en la sección Operativos; los cupos son limitados.`,
          vigenteDesde: new Date(),
          vigenteHasta: new Date(o.fecha.getTime() + 86_400_000),
          estado: "BORRADOR",
          operativoId: id,
          loteDemoId: o.loteDemoId,
          sectores: { create: [{ sectorId: o.sectorId }] },
        },
      });
    }
    if (!invitacionesActivas()) return "Publicamos el operativo: las inscripciones quedaron abiertas en el portal. Dejamos un aviso en borrador para comunicaciones.";
    return `Publicamos el operativo. Enviamos ${invitadas === 1 ? "1 invitación prioritaria" : `${invitadas} invitaciones prioritarias`} a solicitudes pendientes (mismo servicio, del sector o cercanas); sus cupos quedan retenidos hasta que respondan. Dejamos un aviso en borrador para comunicaciones.`;
  });
  if (!r.ok) return r;
  const instagram = await difundirEnInstagram("OPERATIVO", id, (await gestor())?.id ?? null);
  return { ...r, mensaje: r.mensaje + notaInstagram(instagram) };
}

export async function cerrarInscripciones(id: string) {
  return transitar(id, "cerrarInscripciones", async () => "Cerramos las inscripciones. Las nuevas solicitudes quedarán como demanda pendiente.");
}

export async function reabrirInscripciones(id: string) {
  return transitar(id, "reabrirInscripciones", async () => "Reabrimos las inscripciones.");
}

export async function iniciar(id: string) {
  return transitar(id, "iniciar", async (tx) => {
    // Al comenzar ya no se puede responder: las invitaciones abiertas se cierran y su solicitud sigue pendiente.
    const n = await cerrarInvitacionesAbiertas(tx, id, "El operativo comenzó", "El operativo comenzó antes de que pudiéramos asignarle un cupo.");
    return `El operativo está en curso. Terreno ya puede registrar asistencia y atenciones.${n ? ` ${n === 1 ? "Una invitación abierta se cerró" : `${n} invitaciones abiertas se cerraron`}; sus solicitudes siguen pendientes.` : ""}`;
  });
}

/** Cerrar: calcula el resultado y devuelve a la demanda pendiente a quienes no alcanzaron cupo. */
export async function cerrar(id: string) {
  return transitar(id, "cerrar", async (tx, o) => {
    await cerrarInvitacionesAbiertas(tx, id, "El operativo se cerró", null);
    // Una invitación nunca confirmada no es una inscripción: se libera y su solicitud
    // vuelve a la demanda pendiente. Solo los cupos confirmados sin marcar son inasistencia.
    const sinConfirmar = await tx.cupo.findMany({ where: { operativoId: id, estado: "INVITADO" } });
    for (const c of sinConfirmar) {
      await tx.cupo.update({ where: { id: c.id }, data: { estado: "CANCELADO_MUNICIPIO" } });
      if (c.solicitudId) await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "RECIBIDA" } });
    }
    await tx.cupo.updateMany({ where: { operativoId: id, estado: "CONFIRMADO" }, data: { estado: "NO_ASISTIO" } });
    const cupos = await tx.cupo.findMany({ where: { operativoId: id }, include: { servicio: true, persona: true } });
    for (const c of cupos) {
      if (c.estado === "ASISTIO" && c.solicitudId) await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "ATENDIDA" } });
      if (c.estado === "NO_ASISTIO" && c.solicitudId) await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "NO_ASISTIO" } });
      if (c.estado === "EN_LISTA_ESPERA") {
        // Retorno: quien quedó en espera vuelve (o entra) a la demanda pendiente del sector.
        if (c.solicitudId) {
          await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "RECIBIDA" } });
        } else {
          await tx.solicitudServicio.create({
            data: { codigo: await nuevoCodigo(tx), personaId: c.personaId, animalId: c.animalId, servicioId: c.servicioId, sectorId: c.persona.sectorId, origen: "MUNICIPIO", loteDemoId: o.loteDemoId },
          });
        }
        await notificar(tx, c.persona, "Su solicitud sigue registrada", `No alcanzamos a atender su solicitud de ${c.servicio.nombre.toLowerCase()} en este operativo. La mantenemos registrada y le avisaremos del próximo.`, o.loteDemoId);
      }
    }
    const atenciones = await tx.atencion.findMany({ where: { operativoId: id }, include: { servicio: true } });
    const r = calcularResultado(
      cupos.map((c) => ({ servicio: c.servicio.clave, estado: c.estado })),
      atenciones.map((a) => ({ servicio: a.servicio.clave, resultado: a.resultado })),
    );
    await tx.resultadoOperativo.create({
      data: { operativoId: id, inscritos: r.inscritos, asistentes: r.asistentes, atenciones: r.atenciones, atencionesPorServicio: JSON.stringify(r.porServicio), demandaNoCubierta: r.demandaNoCubierta },
    });
    const n = (k: number, uno: string, varios: string) => `${k} ${k === 1 ? uno : varios}`;
    return `Cerramos el operativo: ${n(r.atenciones, "atención realizada", "atenciones realizadas")}; asistieron ${r.asistentes} de ${n(r.inscritos, "inscrito", "inscritos")}${sinConfirmar.length ? `; ${n(sinConfirmar.length, "invitación sin confirmar volvió", "invitaciones sin confirmar volvieron")} a la demanda pendiente` : ""}; ${n(r.demandaNoCubierta, "persona en lista de espera vuelve", "personas en lista de espera vuelven")} a la demanda pendiente. La prioridad del sector ya se recalculó.`;
  });
}

/** Cancelar: avisa a todos los inscritos y devuelve sus solicitudes a la demanda pendiente. */
export async function cancelar(id: string) {
  return transitar(id, "cancelar", async (tx, o) => {
    await cerrarInvitacionesAbiertas(tx, id, "El operativo fue cancelado", `Informamos que el operativo del ${fechaLarga(o.fecha)} en ${o.sector.nombre} fue cancelado.`);
    const vigentes = await tx.cupo.findMany({ where: { operativoId: id, estado: { in: [...CUPO_VIGENTE] } }, include: { persona: true } });
    for (const c of vigentes) {
      await tx.cupo.update({ where: { id: c.id }, data: { estado: "CANCELADO_MUNICIPIO" } });
      if (c.solicitudId) await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "RECIBIDA" } });
      await notificar(tx, c.persona, "Operativo cancelado", `Informamos que el operativo del ${fechaLarga(o.fecha)} en ${o.sector.nombre} fue cancelado. Su solicitud sigue registrada y le avisaremos del próximo operativo.`, o.loteDemoId);
    }
    // El aviso del operativo deja de mostrarse y se prepara uno de cancelación para comunicaciones.
    await tx.aviso.updateMany({ where: { operativoId: id, tipo: "OPERATIVO" }, data: { vigenteHasta: new Date() } });
    await tx.aviso.create({
      data: {
        tipo: "CAMBIO",
        titulo: `Operativo en ${o.sector.nombre} cancelado`,
        texto: `Informamos que el operativo del ${fechaLarga(o.fecha)} en ${o.sector.nombre} fue cancelado. Las solicitudes registradas se mantienen y avisaremos la nueva fecha.`,
        vigenteDesde: new Date(),
        vigenteHasta: new Date(o.fecha.getTime() + 86_400_000),
        estado: "BORRADOR",
        operativoId: id,
        loteDemoId: o.loteDemoId,
        sectores: { create: [{ sectorId: o.sectorId }] },
      },
    });
    return `Cancelamos el operativo y avisamos a ${vigentes.length === 1 ? "1 persona inscrita" : `${vigentes.length} personas inscritas`}. Quedó un aviso de cancelación en borrador para comunicaciones.`;
  });
}

// ───────────── Gestión de cupos ─────────────

async function operarCupo(cupoId: string, fn: (tx: Tx, c: Prisma.CupoGetPayload<{ include: { operativo: true; persona: true } }>) => Promise<string>): Promise<Respuesta> {
  const u = await gestor();
  if (!u) return SIN_PERMISO;
  try {
    const { mensaje, operativoId } = await db.$transaction(async (tx) => {
      const c = await tx.cupo.findUnique({ where: { id: cupoId }, include: { operativo: true, persona: true } });
      if (!c) throw new ErrorDeUso("No encontramos el cupo.");
      if (!["PUBLICADO", "INSCRIPCIONES_CERRADAS"].includes(c.operativo.estado)) throw new ErrorDeUso("Los cupos se gestionan antes de que el operativo comience.");
      return { mensaje: await fn(tx, c), operativoId: c.operativoId };
    });
    refrescar(operativoId);
    return { ok: true, mensaje };
  } catch (e) {
    if (e instanceof ErrorDeUso) return { ok: false, mensaje: e.message };
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}

/** La persona invitada confirmó (por teléfono, por ejemplo). */
export async function confirmarCupo(cupoId: string) {
  return operarCupo(cupoId, async (tx, c) => {
    if (c.estado !== "INVITADO") throw new ErrorDeUso("Solo se confirma un cupo en estado Invitado.");
    await tx.cupo.update({ where: { id: c.id }, data: { estado: "CONFIRMADO", confirmado48h: true } });
    if (c.solicitudId) await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "CUPO_CONFIRMADO" } });
    return `Confirmamos el cupo de ${c.persona.nombre}.`;
  });
}

/** Cancelar un cupo libera su lugar para la lista de espera. */
export async function cancelarCupo(cupoId: string, quien: "PERSONA" | "MUNICIPIO") {
  return operarCupo(cupoId, async (tx, c) => {
    if (!(CUPO_VIGENTE as readonly string[]).includes(c.estado)) throw new ErrorDeUso("Este cupo ya no está vigente.");
    await tx.cupo.update({ where: { id: c.id }, data: { estado: quien === "PERSONA" ? "CANCELADO_PERSONA" : "CANCELADO_MUNICIPIO", posicionEspera: null } });
    if (c.solicitudId) await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "RECIBIDA" } });
    // El cupo liberado va primero a la demanda prioritaria (invitaciones) y, si no queda, a la lista de espera.
    const r = await procesarOperativo(tx, c.operativoId);
    const detalle = r.asignadas ? " El cupo se asignó a una persona invitada que había confirmado interés." : r.invitadas ? " Invitamos a la siguiente solicitud pendiente." : r.promovidas ? " El cupo pasó al primero de la lista de espera." : "";
    return `Cancelamos el cupo de ${c.persona.nombre}.${detalle}`;
  });
}

/** Invitaciones sin respuesta: se liberan y sus solicitudes vuelven a la demanda pendiente. */
export async function liberarNoConfirmados(operativoId: string): Promise<Respuesta> {
  const u = await gestor();
  if (!u) return SIN_PERMISO;
  try {
    const n = await db.$transaction(async (tx) => {
      const o = await tx.operativo.findUniqueOrThrow({ where: { id: operativoId } });
      if (!["PUBLICADO", "INSCRIPCIONES_CERRADAS"].includes(o.estado)) throw new ErrorDeUso("Solo antes de que el operativo comience.");
      const invitados = await tx.cupo.findMany({ where: { operativoId, estado: "INVITADO" } });
      for (const c of invitados) {
        await tx.cupo.update({ where: { id: c.id }, data: { estado: "CANCELADO_MUNICIPIO" } });
        if (c.solicitudId) await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "RECIBIDA" } });
      }
      for (const c of invitados) await promoverEspera(tx, operativoId, c.servicioId, o.loteDemoId);
      await procesarOperativo(tx, operativoId);
      return invitados.length;
    });
    refrescar(operativoId);
    return { ok: true, mensaje: n === 0 ? "No había invitaciones sin confirmar." : `Liberamos ${n === 1 ? "1 invitación" : `${n} invitaciones`} sin confirmar; sus solicitudes siguen como demanda pendiente.` };
  } catch (e) {
    if (e instanceof ErrorDeUso) return { ok: false, mensaje: e.message };
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}

/**
 * Pone al día las invitaciones: vence las que no tuvieron respuesta, asigna
 * cupos a quienes confirmaron interés e invita a la demanda pendiente que
 * llegó después de publicar, si quedan cupos.
 */
export async function invitarNuevamente(operativoId: string): Promise<Respuesta> {
  const u = await gestor();
  if (!u) return SIN_PERMISO;
  try {
    const r = await db.$transaction(async (tx) => {
      const o = await tx.operativo.findUniqueOrThrow({ where: { id: operativoId } });
      if (!["PUBLICADO", "INSCRIPCIONES_CERRADAS"].includes(o.estado)) throw new ErrorDeUso("Solo antes de que el operativo comience.");
      return procesarOperativo(tx, operativoId);
    }, { timeout: 30_000 });
    refrescar(operativoId);
    const partes = [
      r.vencidas && `${r.vencidas === 1 ? "1 invitación venció" : `${r.vencidas} invitaciones vencieron`}`,
      r.asignadas && `${r.asignadas === 1 ? "asignamos 1 cupo" : `asignamos ${r.asignadas} cupos`} a quienes confirmaron interés`,
      r.invitadas && `${r.invitadas === 1 ? "enviamos 1 invitación" : `enviamos ${r.invitadas} invitaciones`}`,
      r.promovidas && `${r.promovidas === 1 ? "1 persona subió" : `${r.promovidas} personas subieron`} desde la lista de espera`,
    ].filter(Boolean);
    return { ok: true, mensaje: partes.length ? `Listo: ${partes.join("; ")}.` : "No hay cambios: sin vencimientos, sin cupos libres o sin solicitudes compatibles por invitar." };
  } catch (e) {
    if (e instanceof ErrorDeUso) return { ok: false, mensaje: e.message };
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}

/** Recordatorio 48 horas antes (simulado en el prototipo). */
export async function enviarRecordatorios(operativoId: string): Promise<Respuesta> {
  const u = await gestor();
  if (!u) return SIN_PERMISO;
  const o = await db.operativo.findUnique({ where: { id: operativoId }, include: { sector: true, lugar: true } });
  if (!o || !["PUBLICADO", "INSCRIPCIONES_CERRADAS"].includes(o.estado)) return { ok: false, mensaje: "Solo antes de que el operativo comience." };
  const cupos = await db.cupo.findMany({ where: { operativoId, estado: { in: ["CONFIRMADO", "INVITADO"] } }, include: { persona: true, servicio: true } });
  await db.$transaction(async (tx) => {
    for (const c of cupos) {
      await notificar(tx, c.persona, "Recordatorio de operativo", `Le recordamos su cupo de ${c.servicio.nombre.toLowerCase()} el ${fechaLarga(o.fecha)}, de ${o.horaInicio} a ${o.horaFin} horas, en ${o.lugar.nombre}. Si no puede asistir, avísenos para liberar el cupo. Código ${c.codigo}.`, o.loteDemoId);
    }
  });
  return { ok: true, mensaje: `Registramos ${cupos.length === 1 ? "1 recordatorio" : `${cupos.length} recordatorios`} (envío simulado en el prototipo).` };
}

// ───────────── Equipo de terreno ─────────────

