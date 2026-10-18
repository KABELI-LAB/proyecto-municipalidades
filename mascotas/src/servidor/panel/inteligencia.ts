// Inteligencia artificial en el panel: si está configurada y encendida, y cuánto
// se usó en los últimos 30 días (sin datos de personas).
import "server-only";
import { municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { iaActiva, iaConfigurada, modeloIA } from "@/servidor/ia/openai";

const DIA = 86_400_000;

export async function estadoInteligencia() {
  const municipioId = municipioActivo().id;
  const desde = new Date(Date.now() - 30 * DIA);
  const [encendida, conIA, interacciones, resumenes, ultimo] = await Promise.all([
    iaActiva(),
    db.interaccionRed.count({ where: { municipioId, clasificadoPor: "IA", creadaEn: { gte: desde } } }),
    db.interaccionRed.count({ where: { municipioId, creadaEn: { gte: desde } } }),
    db.resumenIA.count({ where: { municipioId, creadoEn: { gte: desde } } }),
    db.resumenIA.findFirst({ where: { municipioId }, orderBy: { creadoEn: "desc" }, select: { creadoEn: true } }),
  ]);
  return {
    configurada: iaConfigurada(),
    encendida,
    modelo: modeloIA(),
    uso: { conIA, interacciones, resumenes, ultimoResumen: ultimo?.creadoEn ?? null },
  };
}
