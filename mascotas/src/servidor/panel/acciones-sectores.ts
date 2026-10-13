"use server";
import { revalidatePath } from "next/cache";
import { autorizar } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { prioridades } from "@/servidor/panel/indicadores";

type Respuesta = { ok: true } | { ok: false; mensaje: string };

/** «Marcar como evaluado»: guarda el índice y los motivos del momento (auditable). */
export async function marcarEvaluado(sectorId: string): Promise<Respuesta> {
  const u = await autorizar("decidirPrioridad");
  if (!u) return { ok: false, mensaje: "Su cuenta no tiene permiso para registrar esta decisión." };
  const p = (await prioridades()).find((x) => x.sectorId === sectorId);
  if (!p) return { ok: false, mensaje: "No encontramos el sector." };
  await db.decisionPrioridad.create({
    data: { sectorId, puntaje: p.puntaje, nivel: p.nivel, motivos: p.motivos.join("; "), accion: "MARCADO_EVALUADO", usuarioId: u.id, loteDemoId: u.loteDemoId },
  });
  revalidatePath(`/panel/sectores/${p.clave}`);
  return { ok: true };
}
