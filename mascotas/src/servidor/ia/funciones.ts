// Lo que hace la IA en la plataforma:
//   - entender un comentario o mensaje de Instagram que las reglas de palabras
//     clave no entendieron (devuelve solo la intención; la respuesta sigue
//     saliendo de los textos aprobados);
//   - escribir el resumen para el equipo a partir de cifras agrupadas.
import "server-only";
import { z } from "zod";
import { INTENCION, type Intencion } from "@/dominio/respuestas";
import { municipioActivo } from "@/lib/municipio";
import { pedirJSON } from "./openai";

const INTENCIONES = Object.keys(INTENCION) as [Intencion, ...Intencion[]];

/** Intención de un comentario o mensaje según la IA, o null si no responde. */
export async function intencionConIA(texto: string): Promise<Intencion | null> {
  const r = await pedirJSON({
    sistema: [
      "Clasificas comentarios y mensajes de Instagram de un programa municipal de tenencia responsable de mascotas en Chile.",
      "Responde solo un JSON {\"intencion\": \"...\"} con una de estas intenciones:",
      ...INTENCIONES.map((i) => `- ${i}: ${INTENCION[i]}`),
      "SOS es un animal herido, maltratado, abandonado o en peligro. VISTO: vio al animal de la publicación. ES_MIO: dice que el animal es suyo.",
      "Si no calza con ninguna, usa OTRO. El texto puede tener faltas de ortografía o modismos chilenos.",
    ].join("\n"),
    usuario: texto.slice(0, 500),
    esquema: z.object({ intencion: z.enum(INTENCIONES) }),
    maxTokens: 300,
    espera: 8_000,
    razonamiento: "none",
  });
  return r?.intencion ?? null;
}

export type CifrasResumen = {
  cifras: Record<string, number>;
  porServicio: { nombre: string; cantidad: number }[];
  porSector: { nombre: string; solicitudes: number; avisos: number; reportes: number }[];
  porTipo: { nombre: string; cantidad: number }[];
};

/** Resumen corto para el equipo municipal, o null si la IA no responde. */
export async function resumenConIA(datos: CifrasResumen): Promise<string | null> {
  const r = await pedirJSON({
    sistema: [
      `Eres analista del programa de tenencia responsable de mascotas de la ${municipioActivo().nombreOficial}, en Chile.`,
      "Recibes cifras agrupadas de lo que vecinas y vecinos hacen en el portal: solicitudes de servicio pendientes, avisos de mascotas perdidas y avistadas, reportes SOS de los últimos 30 días, postulaciones a adopción y perros comunitarios.",
      "Escribe un resumen para el equipo municipal en español de Chile, tuteando, en 3 a 5 frases cortas (20 palabras o menos cada una).",
      "Di qué destaca y dónde, citando las cifras. Termina con una o dos recomendaciones que empiecen con «Se recomienda evaluar».",
      "Nunca uses «debe» ni «deben». No inventes cifras ni datos que no estén. Sin emoji, sin mayúsculas sostenidas, sin siglas sin explicar.",
      "Usa coma decimal y espacio antes de %. Responde solo un JSON {\"resumen\": \"...\"}.",
    ].join("\n"),
    usuario: JSON.stringify(datos),
    esquema: z.object({ resumen: z.string().trim().min(20).max(1500) }),
    maxTokens: 2_000,
    espera: 9_000,
    razonamiento: "low",
  });
  if (!r) return null;
  // Si a pesar de la instrucción aparece un «debe», se suaviza.
  return r.resumen.replace(/\b(se )?deben?\b/gi, (m) => (/^[SD]/.test(m) ? "Se recomienda" : "se recomienda"));
}
