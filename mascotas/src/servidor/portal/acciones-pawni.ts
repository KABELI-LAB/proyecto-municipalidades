"use server";
// Pawni responde una pregunta del portal. Si la inteligencia artificial está
// encendida, ella elige el tema de lo que se escribe o dice (solo con el texto);
// si está apagada o falla, lo eligen las reglas de palabras clave. Las
// preguntas sugeridas siempre van por reglas. La respuesta sale siempre de los
// textos aprobados.
import { SUGERENCIAS, responderPawni, temaDe, type OperativoPawni, type RespuestaPawni, type TemaPawni } from "@/dominio/asistente";
import { municipioActivo } from "@/lib/municipio";
import { temaPawniConIA } from "@/servidor/ia/funciones";
import { iaActiva } from "@/servidor/ia/openai";
import { fechaLarga } from "@/servidor/formato";
import { proximoOperativo } from "./consultas";

/** Largo máximo de una pregunta: lo que se escribe en el chat, no un documento. */
const MAXIMO = 300;

async function operativoParaPawni(): Promise<OperativoPawni> {
  const o = await proximoOperativo();
  if (!o) return null;
  return {
    id: o.id,
    cuando: `${fechaLarga(o.fecha)}, de ${o.horaInicio} a ${o.horaFin}`,
    donde: `${o.lugar.nombre}${o.lugar.localidad ? `, ${o.lugar.localidad.nombre}` : ""}`,
    abierto: o.estado === "PUBLICADO",
    conCupos: o.servicios.filter((s) => s.disponibles > 0).map((s) => s.nombre),
  };
}

export async function preguntarAPawni(pregunta: string): Promise<RespuestaPawni> {
  const texto = String(pregunta ?? "").slice(0, MAXIMO).trim();
  let tema: TemaPawni | null = null;
  if (!SUGERENCIAS.includes(texto) && texto.length > 2 && (await iaActiva())) tema = await temaPawniConIA(texto);
  tema ??= temaDe(texto);
  return responderPawni(tema, tema === "OPERATIVO" ? await operativoParaPawni() : null, municipioActivo().plataforma);
}
