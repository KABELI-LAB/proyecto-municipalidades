// Avisos en el panel: borradores, publicados y terminados.
import "server-only";
import { municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";

const delMunicipio = () => ({ OR: [{ sectores: { none: {} } }, { sectores: { some: { sector: { municipioId: municipioActivo().id } } } }] });
const incluir = { sectores: { include: { sector: { select: { nombre: true } } } } } as const;

export type GrupoAvisos = "borradores" | "vigentes" | "terminados";

export function avisosPanel(grupo: GrupoAvisos) {
  const ahora = new Date();
  const where =
    grupo === "borradores"
      ? { estado: "BORRADOR" as const, vigenteHasta: { gte: ahora } }
      : grupo === "vigentes"
        ? { estado: "PUBLICADO" as const, vigenteHasta: { gte: ahora } }
        : { vigenteHasta: { lt: ahora } };
  return db.aviso.findMany({ where: { ...where, ...delMunicipio() }, include: incluir, orderBy: { vigenteDesde: grupo === "terminados" ? "desc" : "asc" } });
}

export function avisoPanel(id: string) {
  return db.aviso.findFirst({ where: { id, ...delMunicipio() }, include: incluir });
}
