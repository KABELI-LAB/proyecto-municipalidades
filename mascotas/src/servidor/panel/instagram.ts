// Instagram en el panel: publicación automática (la cambia administración) y
// contenido público que aún no sale en Instagram, para publicarlo a mano.
import "server-only";
import type { TipoRed } from "@/dominio/redes";
import { municipioActivo } from "@/lib/municipio";
import { FICHA_PUBLICA, PUBLICACION_CON_FOTO } from "@/servidor/conFoto";
import { db } from "@/servidor/db";
import { fechaCorta } from "@/servidor/formato";
import { estadoIntegracion } from "@/servidor/redes/instagram";
import { faltantesRespuestas } from "@/servidor/redes/respuestas";
import { estadosInstagram, type EstadoInstagram } from "@/servidor/redes/servicio";

export type PendienteInstagram = { tipo: TipoRed; id: string; titulo: string; detalle: string; estado?: EstadoInstagram };

/** Cuántos contenidos sin publicar se muestran como máximo. */
const LIMITE = 12;

export async function configuracionInstagram() {
  const municipio = municipioActivo();
  const m = await db.municipio.findUnique({ where: { id: municipio.id }, select: { redesPublicarAuto: true, redesIncluirDemo: true, redesResponderAuto: true } });
  return {
    automatica: m?.redesPublicarAuto ?? true,
    incluirDemo: m?.redesIncluirDemo ?? false,
    responder: m?.redesResponderAuto ?? false,
    integracion: estadoIntegracion(),
    faltanParaResponder: faltantesRespuestas(),
  };
}

/**
 * Contenido público que todavía no está en Instagram (o cuyo intento falló):
 * avisos aprobados y vigentes, fichas de adopción publicadas y operativos
 * publicados que aún no ocurren. El de demostración solo si está habilitado.
 */
export async function pendientesInstagram(incluirDemo: boolean, tipos: TipoRed[]): Promise<PendienteInstagram[]> {
  if (!tipos.length) return [];
  const municipio = municipioActivo();
  const demo = incluirDemo ? {} : { loteDemoId: null };
  const hoy = new Date(new Date().toDateString());
  const quiere = (t: TipoRed) => tipos.includes(t);
  const [avisos, fichas, operativos] = await Promise.all([
    !quiere("PERDIDA") ? [] : db.publicacionMascota.findMany({
      where: { estado: "ABIERTA", moderacion: "APROBADA", sector: { municipioId: municipio.id }, ...PUBLICACION_CON_FOTO, ...demo },
      include: { sector: true },
      orderBy: { creadaEn: "desc" },
      take: LIMITE,
    }),
    !quiere("ADOPCION") ? [] : db.fichaAdopcion.findMany({ where: { ...FICHA_PUBLICA, ...demo }, include: { animal: true }, orderBy: { creadaEn: "desc" }, take: LIMITE }),
    !quiere("OPERATIVO") ? [] : db.operativo.findMany({ where: { estado: "PUBLICADO", fecha: { gte: hoy }, sector: { municipioId: municipio.id }, ...demo }, include: { sector: true }, orderBy: { fecha: "asc" }, take: LIMITE }),
  ]);
  const candidatos: PendienteInstagram[] = [
    ...operativos.map((o) => ({ tipo: "OPERATIVO" as const, id: o.id, titulo: `Operativo en ${o.sector.nombre}`, detalle: fechaCorta(o.fecha) })),
    ...avisos.map((p) => ({
      tipo: p.tipo === "PERDIDA" ? ("PERDIDA" as const) : ("AVISTADA" as const),
      id: p.id,
      titulo: `${p.tipo === "PERDIDA" ? "Perdida" : "Avistada"}: ${p.nombreAnimal?.trim() || p.colorPrincipal}`,
      detalle: [p.codigo, p.sector.nombre].filter(Boolean).join(" · "),
    })),
    ...fichas.map((f) => ({ tipo: "ADOPCION" as const, id: f.id, titulo: `En adopción: ${f.animal.nombre ?? "sin nombre"}`, detalle: fechaCorta(f.creadaEn) })),
  ];
  const presentes = [...new Set(candidatos.map((c) => c.tipo))];
  const estados = Object.assign({}, ...(await Promise.all(presentes.map((t) => estadosInstagram(t, candidatos.filter((c) => c.tipo === t).map((c) => c.id))))));
  return candidatos
    .map((c) => ({ ...c, estado: estados[c.id] as EstadoInstagram | undefined }))
    .filter((c) => c.estado?.estado !== "PUBLICADO" && c.estado?.estado !== "PUBLICANDO")
    .slice(0, LIMITE);
}
