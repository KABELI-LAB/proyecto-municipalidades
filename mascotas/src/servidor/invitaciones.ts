// Invitaciones prioritarias a operativos (docs/concepto.md, secciones 5 y 9).
//
// - Al publicar un operativo se invita a las solicitudes pendientes compatibles
//   (mismo servicio; mismo sector o cerca del lugar), por prioridad, hasta
//   completar los cupos libres. Sin invitaciones duplicadas.
// - Una invitación abierta retiene un cupo (la inscripción pública no lo
//   toma), pero no es una reserva: si la persona confirma interés, el sistema
//   le asigna el cupo efectivo cuando hay disponibilidad.
// - Si la rechaza o vence el plazo, su solicitud vuelve a la demanda pendiente
//   y se invita a la siguiente. Si no queda demanda que invitar, el cupo libre
//   pasa a la lista de espera pública.
// Todo se hace dentro de la transacción que recibe cada función.
import "server-only";
import { alcanzaLimiteHogar, CUPO_OCUPA, CUPO_VIGENTE } from "@/dominio/cupos";
import { punto } from "@/dominio/geo";
import { INVITACION_ABIERTA, ordenarElegibles, vencimiento } from "@/dominio/invitaciones";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { municipioActivo } from "@/lib/municipio";
import { nuevoCodigo } from "@/servidor/codigos";
import { fechaLarga } from "@/servidor/formato";
import { notificar } from "@/servidor/notificaciones";

type Tx = Prisma.TransactionClient;
const ABIERTA = { in: [...INVITACION_ABIERTA] };
/** Mientras se puede responder: antes de que el operativo comience. */
const OPERATIVO_RECIBE = ["PUBLICADO", "INSCRIPCIONES_CERRADAS"] as const;

/** Cupos de un servicio: capacidad, ocupados por cupos, retenidos por invitaciones abiertas y libres. */
export async function disponibilidad(tx: Tx, operativoId: string, servicioId: string) {
  const [cap, ocupados, retenidos] = await Promise.all([
    tx.capacidadServicio.findUnique({ where: { operativoId_servicioId: { operativoId, servicioId } } }),
    tx.cupo.count({ where: { operativoId, servicioId, estado: { in: [...CUPO_OCUPA] } } }),
    tx.invitacionOperativo.count({ where: { operativoId, servicioId, estado: ABIERTA } }),
  ]);
  const capacidad = cap?.cupos ?? 0;
  return { capacidad, ocupados, retenidos, libres: Math.max(0, capacidad - ocupados - retenidos) };
}

/**
 * Invita a la siguiente demanda pendiente compatible, por prioridad, hasta
 * completar los cupos libres de cada servicio. Devuelve cuántas invitaciones creó.
 */
/** ¿Están activas las invitaciones prioritarias en este municipio? (config/municipios, parametros). */
export const invitacionesActivas = () => municipioActivo().parametros.invitacionesPrioritarias === true;

export async function invitarSiguientes(tx: Tx, operativoId: string, ahora = new Date()): Promise<number> {
  // Apagadas: no se invita ni se retiene ningún cupo; las solicitudes solo miden la necesidad.
  if (!invitacionesActivas()) return 0;
  const o = await tx.operativo.findUniqueOrThrow({ where: { id: operativoId }, include: { capacidades: { include: { servicio: true } }, sector: true, lugar: true } });
  if (!(OPERATIVO_RECIBE as readonly string[]).includes(o.estado) || o.fecha.getTime() + 86_400_000 <= ahora.getTime()) return 0;
  const limite = municipioActivo().parametros.limitePorHogar;
  const lugar = punto(o.lugar.lat, o.lugar.lng);
  const venceEn = vencimiento(ahora, o.fecha);
  let creadas = 0;

  for (const c of o.capacidades) {
    let { libres } = await disponibilidad(tx, operativoId, c.servicioId);
    if (libres <= 0) continue;
    // Solo el servicio que el operativo ofrece, solicitudes aún pendientes y nunca invitadas a este operativo.
    const pendientes = await tx.solicitudServicio.findMany({
      where: { servicioId: c.servicioId, estado: "RECIBIDA", sector: { municipioId: o.sector.municipioId }, invitaciones: { none: { operativoId } } },
      include: { localidad: true, persona: true },
    });
    const elegibles = ordenarElegibles(
      pendientes.map((s) => ({ ...s, localidad: s.localidad ? punto(s.localidad.lat, s.localidad.lng) : null })),
      o.sectorId,
      lugar,
    );
    let orden = (await tx.invitacionOperativo.aggregate({ where: { operativoId, servicioId: c.servicioId }, _max: { orden: true } }))._max.orden ?? 0;
    for (const s of elegibles) {
      if (libres <= 0) break;
      // Límite por hogar: cupos vigentes más invitaciones abiertas de la persona en este operativo.
      const [cupos, abiertas] = await Promise.all([
        tx.cupo.count({ where: { operativoId, personaId: s.personaId, estado: { in: [...CUPO_VIGENTE] } } }),
        tx.invitacionOperativo.count({ where: { operativoId, personaId: s.personaId, estado: ABIERTA } }),
      ]);
      if (alcanzaLimiteHogar(cupos + abiertas, limite)) continue;
      const codigo = await nuevoCodigo(tx);
      await tx.invitacionOperativo.create({
        data: { codigo, operativoId, servicioId: c.servicioId, solicitudId: s.id, personaId: s.personaId, animalId: s.animalId, orden: ++orden, venceEn, loteDemoId: o.loteDemoId },
      });
      await tx.solicitudServicio.update({ where: { id: s.id }, data: { estado: "INVITADO" } });
      await notificar(
        tx,
        s.persona,
        "Invitación prioritaria a un operativo",
        `Te invitamos al operativo de ${c.servicio.nombre.toLowerCase()} en ${o.lugar.nombre} (${o.sector.nombre}) el ${fechaLarga(o.fecha)}, de ${o.horaInicio} a ${o.horaFin} horas. Responde antes del ${fechaLarga(venceEn)} en Mis solicitudes, entrando con tu correo. Confirmar tu interés no reserva el cupo: se lo asignamos según disponibilidad.`,
        o.loteDemoId,
      );
      libres--;
      creadas++;
    }
  }
  return creadas;
}

/**
 * Asigna el cupo efectivo a quienes confirmaron interés, por prioridad,
 * mientras haya capacidad y no superen el límite por hogar.
 */
export async function asignarInteresadas(tx: Tx, operativoId: string, ahora = new Date()): Promise<number> {
  const o = await tx.operativo.findUniqueOrThrow({ where: { id: operativoId }, include: { lugar: true } });
  if (!(OPERATIVO_RECIBE as readonly string[]).includes(o.estado)) return 0;
  const limite = municipioActivo().parametros.limitePorHogar;
  const interesadas = await tx.invitacionOperativo.findMany({ where: { operativoId, estado: "INTERESADA" }, include: { persona: true, servicio: true }, orderBy: [{ servicioId: "asc" }, { orden: "asc" }] });
  let asignadas = 0;
  for (const i of interesadas) {
    const d = await disponibilidad(tx, operativoId, i.servicioId);
    // Su propia invitación ya retiene un lugar: hay cupo si los ocupados no llenan la capacidad.
    if (d.ocupados >= d.capacidad) continue;
    const vigentes = await tx.cupo.count({ where: { operativoId, personaId: i.personaId, estado: { in: [...CUPO_VIGENTE] } } });
    if (alcanzaLimiteHogar(vigentes, limite)) continue;
    const cupo = await tx.cupo.create({
      data: { codigo: await nuevoCodigo(tx), operativoId, servicioId: i.servicioId, personaId: i.personaId, animalId: i.animalId, solicitudId: i.solicitudId, estado: "CONFIRMADO", loteDemoId: i.loteDemoId },
    });
    await tx.invitacionOperativo.update({ where: { id: i.id }, data: { estado: "ASIGNADA", asignadaEn: ahora, cupoId: cupo.id } });
    await tx.solicitudServicio.update({ where: { id: i.solicitudId }, data: { estado: "CUPO_CONFIRMADO" } });
    await notificar(
      tx,
      i.persona,
      "Te asignamos un cupo",
      `Tu cupo de ${i.servicio.nombre.toLowerCase()} el ${fechaLarga(o.fecha)}, de ${o.horaInicio} a ${o.horaFin} horas, en ${o.lugar.nombre}, quedó asignado.`,
      i.loteDemoId,
    );
    asignadas++;
  }
  return asignadas;
}

/** Sube al primero de la lista de espera pública de ese servicio, si queda un cupo libre (no retenido). */
export async function promoverEspera(tx: Tx, operativoId: string, servicioId: string, loteDemoId: string | null) {
  if ((await disponibilidad(tx, operativoId, servicioId)).libres <= 0) return null;
  const siguiente = await tx.cupo.findFirst({ where: { operativoId, servicioId, estado: "EN_LISTA_ESPERA" }, orderBy: [{ posicionEspera: "asc" }, { creadoEn: "asc" }], include: { persona: true, servicio: true } });
  if (!siguiente) return null;
  await tx.cupo.update({ where: { id: siguiente.id }, data: { estado: "CONFIRMADO", posicionEspera: null } });
  if (siguiente.solicitudId) await tx.solicitudServicio.update({ where: { id: siguiente.solicitudId }, data: { estado: "CUPO_CONFIRMADO" } });
  await notificar(tx, siguiente.persona, "Se liberó un cupo", `Se liberó un cupo de ${siguiente.servicio.nombre.toLowerCase()} y quedó confirmado para ti.`, loteDemoId);
  return siguiente.persona.nombre;
}

/** Vence las invitaciones sin respuesta de un operativo: su solicitud vuelve a la demanda pendiente. */
async function vencerDeOperativo(tx: Tx, operativoId: string, ahora: Date): Promise<number> {
  const vencidas = await tx.invitacionOperativo.findMany({ where: { operativoId, estado: "ENVIADA", venceEn: { lt: ahora } }, include: { persona: true, servicio: true } });
  for (const i of vencidas) {
    await tx.invitacionOperativo.update({ where: { id: i.id }, data: { estado: "VENCIDA", cerradaEn: ahora, motivoCierre: "Venció el plazo sin respuesta" } });
    await tx.solicitudServicio.update({ where: { id: i.solicitudId }, data: { estado: "RECIBIDA" } });
    await notificar(tx, i.persona, "Tu invitación venció", `Tu invitación de ${i.servicio.nombre.toLowerCase()} venció sin respuesta. Tu solicitud sigue registrada y te avisaremos del próximo operativo.`, i.loteDemoId);
  }
  return vencidas.length;
}

/**
 * Pone al día un operativo: vence lo que corresponde, asigna cupos a quienes
 * confirmaron interés, invita a la siguiente demanda y, si sobra cupo, sube a
 * la lista de espera pública.
 */
export async function procesarOperativo(tx: Tx, operativoId: string, ahora = new Date()) {
  const vencidas = await vencerDeOperativo(tx, operativoId, ahora);
  const asignadas = await asignarInteresadas(tx, operativoId, ahora);
  const invitadas = await invitarSiguientes(tx, operativoId, ahora);
  const o = await tx.operativo.findUniqueOrThrow({ where: { id: operativoId }, include: { capacidades: true } });
  let promovidas = 0;
  if ((OPERATIVO_RECIBE as readonly string[]).includes(o.estado)) {
    for (const c of o.capacidades) while (await promoverEspera(tx, operativoId, c.servicioId, o.loteDemoId)) promovidas++;
  }
  return { vencidas, asignadas, invitadas, promovidas };
}

/** Para la tarea programada: vence las invitaciones sin respuesta de todos los operativos abiertos e invita a las siguientes. */
export async function vencerInvitaciones(db: PrismaClient, ahora = new Date()) {
  const ops = await db.invitacionOperativo.findMany({
    where: { estado: "ENVIADA", venceEn: { lt: ahora }, operativo: { estado: { in: [...OPERATIVO_RECIBE] } } },
    select: { operativoId: true },
    distinct: ["operativoId"],
  });
  let vencidas = 0;
  let invitadas = 0;
  for (const { operativoId } of ops) {
    const r = await db.$transaction((tx) => procesarOperativo(tx, operativoId, ahora), { timeout: 30_000 });
    vencidas += r.vencidas;
    invitadas += r.invitadas;
  }
  return { vencidas, invitadas };
}

/**
 * Cierra las invitaciones abiertas cuando el operativo comienza o se cancela:
 * sus solicitudes vuelven a la demanda pendiente.
 */
export async function cerrarInvitacionesAbiertas(tx: Tx, operativoId: string, motivo: string, avisar: string | null, ahora = new Date()): Promise<number> {
  const abiertas = await tx.invitacionOperativo.findMany({ where: { operativoId, estado: ABIERTA }, include: { persona: true } });
  for (const i of abiertas) {
    await tx.invitacionOperativo.update({ where: { id: i.id }, data: { estado: "CANCELADA", cerradaEn: ahora, motivoCierre: motivo } });
    await tx.solicitudServicio.update({ where: { id: i.solicitudId }, data: { estado: "RECIBIDA" } });
    if (avisar) await notificar(tx, i.persona, "Sobre tu invitación", `${avisar} Tu solicitud sigue registrada y te avisaremos del próximo operativo.`, i.loteDemoId);
  }
  return abiertas.length;
}
