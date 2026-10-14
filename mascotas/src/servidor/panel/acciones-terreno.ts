"use server";
// Registro en terreno el día del operativo: asistencia, atenciones y
// atenciones espontáneas. Terreno solo opera su operativo asignado y solo
// mientras está «En curso».
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { autorizar } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { puedeOperar } from "@/servidor/panel/operativos";

type Tx = Prisma.TransactionClient;
export type Respuesta = { ok: true; mensaje: string } | { ok: false; mensaje: string };

const SIN_PERMISO: Respuesta = { ok: false, mensaje: "Tu cuenta no puede registrar en este operativo." };
const NO_EN_CURSO: Respuesta = { ok: false, mensaje: "El operativo no está en curso. Pide a coordinación que lo inicie." };

async function autorizarEn(operativoId: string) {
  const u = await autorizar("registrarAtenciones");
  if (!u || !(await puedeOperar(u, operativoId))) return null;
  return u;
}

const refrescar = (operativoId: string) => {
  revalidatePath(`/panel/operativos/${operativoId}/asistencia`);
  revalidatePath(`/panel/operativos/${operativoId}`);
  revalidatePath("/", "layout");
};

/** Un servicio realizado actualiza el estado sanitario del animal. */
async function marcarServicio(tx: Tx, animalId: string, servicioId: string) {
  const s = await tx.servicio.findUniqueOrThrow({ where: { id: servicioId } });
  const data = s.clave === "esterilizacion" ? { esterilizado: true } : s.clave === "microchip" ? { microchip: true } : s.clave === "vacunacion" ? { vacunasAlDia: true } : null;
  if (data) await tx.animal.update({ where: { id: animalId }, data });
}

async function cupoEnCurso(cupoId: string) {
  const c = await db.cupo.findUnique({ where: { id: cupoId }, include: { operativo: true, persona: { select: { nombre: true } }, animal: { select: { especie: true } } } });
  return c;
}

export async function marcarAsistencia(cupoId: string, asistio: boolean): Promise<Respuesta> {
  const c = await cupoEnCurso(cupoId);
  if (!c) return { ok: false, mensaje: "No encontramos la inscripción." };
  if (!(await autorizarEn(c.operativoId))) return SIN_PERMISO;
  if (c.operativo.estado !== "EN_CURSO") return NO_EN_CURSO;
  if (!asistio && c.estado === "ASISTIO") {
    const atencion = await db.atencion.findUnique({ where: { cupoId } });
    if (atencion) return { ok: false, mensaje: "Ya tiene una atención registrada; corrígela primero." };
  }
  await db.cupo.update({ where: { id: cupoId }, data: { estado: asistio ? "ASISTIO" : "NO_ASISTIO" } });
  refrescar(c.operativoId);
  return { ok: true, mensaje: asistio ? `Registramos la asistencia de ${c.persona.nombre}.` : `Registramos que ${c.persona.nombre} no asistió.` };
}

const esquemaAtencion = z.object({
  resultado: z.enum(["REALIZADA", "NO_REALIZADA", "DERIVADA"]),
  observaciones: z.string().trim().max(300),
});

export async function registrarAtencion(cupoId: string, valores: unknown): Promise<Respuesta> {
  const r = esquemaAtencion.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: "Indica el resultado de la atención." };
  const c = await cupoEnCurso(cupoId);
  if (!c) return { ok: false, mensaje: "No encontramos la inscripción." };
  const u = await autorizarEn(c.operativoId);
  if (!u) return SIN_PERMISO;
  if (c.operativo.estado !== "EN_CURSO") return NO_EN_CURSO;

  await db.$transaction(async (tx) => {
    await tx.cupo.update({ where: { id: cupoId }, data: { estado: "ASISTIO" } });
    const datos = { resultado: r.data.resultado, observaciones: r.data.observaciones || null, funcionarioId: u.id, realizadaEn: new Date() };
    await tx.atencion.upsert({
      where: { cupoId },
      create: {
        ...datos,
        operativoId: c.operativoId,
        cupoId,
        animalId: c.animalId,
        servicioId: c.servicioId,
        especie: c.animal.especie,
        sectorId: c.operativo.sectorId,
        lugarId: c.operativo.lugarId,
        loteDemoId: c.operativo.loteDemoId,
      },
      update: datos,
    });
    if (r.data.resultado === "REALIZADA") await marcarServicio(tx, c.animalId, c.servicioId);
  });
  refrescar(c.operativoId);
  return { ok: true, mensaje: `Registramos la atención de ${c.persona.nombre}.` };
}

/** Corrige un registro hecho por error: borra la atención y deja el cupo como confirmado. */
export async function deshacerAtencion(cupoId: string): Promise<Respuesta> {
  const c = await cupoEnCurso(cupoId);
  if (!c) return { ok: false, mensaje: "No encontramos la inscripción." };
  if (!(await autorizarEn(c.operativoId))) return SIN_PERMISO;
  if (c.operativo.estado !== "EN_CURSO") return NO_EN_CURSO;
  await db.$transaction([db.atencion.deleteMany({ where: { cupoId } }), db.cupo.update({ where: { id: cupoId }, data: { estado: "CONFIRMADO" } })]);
  refrescar(c.operativoId);
  return { ok: true, mensaje: "Deshicimos el registro." };
}

const esquemaEspontanea = z.object({
  servicioId: z.string().min(1, "Elige el servicio."),
  especie: z.enum(["PERRO", "GATO"], "Indica si es perro o gato."),
  sexo: z.enum(["MACHO", "HEMBRA", "DESCONOCIDO"], "Indica el sexo."),
  nombreAnimal: z.string().trim().max(40),
  resultado: z.enum(["REALIZADA", "NO_REALIZADA", "DERIVADA"], "Indica el resultado."),
  observaciones: z.string().trim().max(300),
});

/** Atención sin inscripción previa. No se piden datos personales en terreno. */
export async function registrarEspontanea(operativoId: string, valores: unknown): Promise<Respuesta> {
  const u = await autorizarEn(operativoId);
  if (!u) return SIN_PERMISO;
  const r = esquemaEspontanea.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: r.error.issues[0]?.message ?? "Revisa los datos." };
  const d = r.data;
  const o = await db.operativo.findUnique({ where: { id: operativoId }, include: { capacidades: true } });
  if (!o || o.estado !== "EN_CURSO") return NO_EN_CURSO;
  if (!o.capacidades.some((c) => c.servicioId === d.servicioId)) return { ok: false, mensaje: "Este operativo no ofrece ese servicio." };

  await db.$transaction(async (tx) => {
    const animal = await tx.animal.create({ data: { especie: d.especie, sexo: d.sexo, nombre: d.nombreAnimal || null, loteDemoId: o.loteDemoId } });
    await tx.atencion.create({
      data: {
        operativoId,
        animalId: animal.id,
        servicioId: d.servicioId,
        especie: d.especie,
        sectorId: o.sectorId,
        lugarId: o.lugarId,
        resultado: d.resultado,
        observaciones: d.observaciones || "Atención espontánea, sin inscripción previa.",
        funcionarioId: u.id,
        loteDemoId: o.loteDemoId,
      },
    });
    if (d.resultado === "REALIZADA") await marcarServicio(tx, animal.id, d.servicioId);
  });
  refrescar(operativoId);
  return { ok: true, mensaje: "Registramos la atención espontánea." };
}
