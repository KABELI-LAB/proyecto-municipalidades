"use server";
// Avisos a los vecinos: crear (se publica de una vez), editar, retirar y
// eliminar. Los operativos dejan un borrador al publicarse.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { municipioActivo } from "@/lib/municipio";
import { autorizar } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { hoyISO, medianocheEn } from "@/servidor/formato";

export type Respuesta = { ok: boolean; mensaje: string; id?: string; errores?: Record<string, string> };

const SIN_PERMISO = { ok: false, mensaje: "Su cuenta no tiene permiso para esta acción." };
const ERROR = "No pudimos guardar el cambio. Intente nuevamente.";
const fin = (dia: string) => new Date(medianocheEn(dia).getTime() + 86_400_000 - 1);

function refrescar() {
  revalidatePath("/panel/avisos");
  revalidatePath("/avisos");
  revalidatePath("/", "layout");
}

const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indique la fecha.");
const esquemaAviso = z
  .object({
    titulo: z.string().trim().min(5, "Escriba un título de al menos 5 caracteres.").max(90, "Use como máximo 90 caracteres."),
    texto: z.string().trim().min(10, "Escriba el texto del aviso.").max(400, "Use como máximo 400 caracteres."),
    desde: dia,
    hasta: dia,
  })
  .refine((d) => d.hasta >= d.desde, { path: ["hasta"], message: "La fecha de término debe ser igual o posterior a la de inicio." });

async function avisoDelMunicipio(id: string) {
  // Avisos de toda la comuna (sin sectores) o de sectores de este municipio.
  return db.aviso.findFirst({
    where: { id, OR: [{ sectores: { none: {} } }, { sectores: { some: { sector: { municipioId: municipioActivo().id } } } }] },
  });
}

export async function guardarAviso(id: string, valores: unknown): Promise<Respuesta> {
  if (!(await autorizar("gestionarAvisos"))) return SIN_PERMISO;
  const r = esquemaAviso.safeParse(valores);
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[String(i.path[0])] ??= i.message;
    return { ok: false, mensaje: "Revise los datos marcados.", errores };
  }
  if (!(await avisoDelMunicipio(id))) return { ok: false, mensaje: "No encontramos el aviso." };
  await db.aviso.update({ where: { id }, data: { titulo: r.data.titulo, texto: r.data.texto, vigenteDesde: medianocheEn(r.data.desde), vigenteHasta: fin(r.data.hasta) } });
  refrescar();
  return { ok: true, mensaje: "Guardamos los cambios." };
}

export async function publicarAviso(id: string): Promise<Respuesta> {
  if (!(await autorizar("gestionarAvisos"))) return SIN_PERMISO;
  const a = await avisoDelMunicipio(id);
  if (!a) return { ok: false, mensaje: "No encontramos el aviso." };
  if (a.vigenteHasta < new Date()) return { ok: false, mensaje: "La vigencia de este aviso ya terminó. Cambie las fechas antes de publicarlo." };
  await db.aviso.update({ where: { id }, data: { estado: "PUBLICADO" } });
  refrescar();
  return { ok: true, mensaje: a.vigenteDesde > new Date() ? "Publicado: se mostrará en el portal desde su fecha de inicio." : "Publicado: ya se muestra en el portal." };
}

/** Deja de mostrarlo en el portal: termina su vigencia hoy. */
export async function retirarAviso(id: string): Promise<Respuesta> {
  if (!(await autorizar("gestionarAvisos"))) return SIN_PERMISO;
  if (!(await avisoDelMunicipio(id))) return { ok: false, mensaje: "No encontramos el aviso." };
  await db.aviso.update({ where: { id }, data: { vigenteHasta: new Date() } });
  refrescar();
  return { ok: true, mensaje: "Retiramos el aviso del portal." };
}

const esquemaNuevo = z.object({
  tipo: z.enum(["INFORMACION", "CAMPANA", "ALERTA", "CAMBIO"], "Elija el tipo de aviso."),
  titulo: z.string().trim().min(5, "Escriba un título de al menos 5 caracteres.").max(90, "Use como máximo 90 caracteres."),
  texto: z.string().trim().min(10, "Escriba el texto del aviso.").max(400, "Use como máximo 400 caracteres."),
  hasta: dia,
});

/** Crea un aviso para toda la comuna y lo publica desde hoy hasta la fecha indicada. */
export async function crearAviso(valores: unknown): Promise<Respuesta> {
  const u = await autorizar("gestionarAvisos");
  if (!u) return SIN_PERMISO;
  const r = esquemaNuevo.safeParse(valores);
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[String(i.path[0])] ??= i.message;
    return { ok: false, mensaje: "Revise los datos marcados.", errores };
  }
  if (r.data.hasta < hoyISO()) return { ok: false, mensaje: "Revise los datos marcados.", errores: { hasta: "La fecha no puede ser anterior a hoy." } };
  try {
    const a = await db.aviso.create({
      data: { tipo: r.data.tipo, titulo: r.data.titulo, texto: r.data.texto, vigenteDesde: medianocheEn(hoyISO()), vigenteHasta: fin(r.data.hasta), estado: "PUBLICADO", autorId: u.id, loteDemoId: u.loteDemoId },
    });
    refrescar();
    return { ok: true, mensaje: "Publicamos el aviso: ya se ve en el portal.", id: a.id };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR };
  }
}

/** Elimina un aviso (deja de verse y no queda en la lista). */
export async function eliminarAviso(id: string): Promise<Respuesta> {
  if (!(await autorizar("gestionarAvisos"))) return SIN_PERMISO;
  if (!(await avisoDelMunicipio(id))) return { ok: false, mensaje: "No encontramos el aviso." };
  await db.aviso.delete({ where: { id } });
  refrescar();
  return { ok: true, mensaje: "Eliminamos el aviso." };
}
