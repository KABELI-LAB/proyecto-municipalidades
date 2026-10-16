"use server";
// Pawni responde una pregunta del portal. Primero las reglas; si no entienden
// y la inteligencia artificial está encendida, se le pregunta solo el tema
// (con el texto, nada más). La respuesta siempre sale de los textos aprobados.
import { responderPawni, temaDe, type OperativoPawni, type RespuestaPawni } from "@/dominio/asistente";
import { municipioActivo } from "@/lib/municipio";
import { intencionConIA } from "@/servidor/ia/funciones";
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
  let tema = temaDe(texto);
  if (tema === "OTRO" && texto.length > 2 && (await iaActiva())) tema = (await intencionConIA(texto)) ?? tema;
  return responderPawni(tema, tema === "OPERATIVO" ? await operativoParaPawni() : null, municipioActivo().plataforma);
}
