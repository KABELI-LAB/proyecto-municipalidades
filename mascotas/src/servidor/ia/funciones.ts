// Lo que hace la IA en la plataforma:
//   - entender un comentario o mensaje de Instagram que las reglas de palabras
//     clave no entendieron (devuelve solo la intención; la respuesta sigue
//     saliendo de los textos aprobados);
//   - entender lo que se le escribe o dice a Pawni, el guía del portal;
//   - escribir el resumen para el equipo a partir de cifras agrupadas
//     (titular, destacados y recomendaciones; sin cifras inventadas).
import "server-only";
import { z } from "zod";
import { TEMAS_PAWNI, type TemaPawni } from "@/dominio/asistente";
import { INTENCION, type Intencion } from "@/dominio/respuestas";
import { cifrasInventadas, esquemaResumen, suavizarResumen, type ResumenEquipo } from "@/dominio/resumen";
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

const TEMAS = Object.keys(TEMAS_PAWNI) as [TemaPawni, ...TemaPawni[]];

/** Tema de lo que se le escribe o dice a Pawni, o null si la IA no responde. */
export async function temaPawniConIA(texto: string): Promise<TemaPawni | null> {
  const r = await pedirJSON({
    sistema: [
      "Clasificas lo que una vecina o vecino le escribe a Pawni, el guía del portal municipal de tenencia responsable de mascotas en Chile.",
      'Responde solo un JSON {"tema": "..."} con uno de estos temas:',
      ...TEMAS.map((t) => `- ${t}: ${TEMAS_PAWNI[t]}`),
      "Elige el tema de lo que la persona necesita, aunque la frase empiece con «¿qué puedo hacer si…?».",
      "Un animal en peligro (incluida una jauría o un animal agresivo) siempre es SOS. El texto puede tener faltas de ortografía o modismos chilenos.",
    ].join("\n"),
    usuario: texto.slice(0, 500),
    esquema: z.object({ tema: z.enum(TEMAS) }),
    maxTokens: 300,
    espera: 8_000,
    razonamiento: "none",
  });
  return r?.tema ?? null;
}

export type CifrasResumen = {
  cifras: Record<string, number>;
  porServicio: { nombre: string; cantidad: number }[];
  porSector: { nombre: string; solicitudes: number; avisos: number; reportes: number }[];
  porTipo: { nombre: string; cantidad: number }[];
};

/** Resumen estructurado para el equipo municipal, o null si la IA no responde o inventa cifras. */
export async function resumenConIA(datos: CifrasResumen): Promise<ResumenEquipo | null> {
  const r = await pedirJSON({
    sistema: [
      `Eres analista del programa de tenencia responsable de mascotas de la ${municipioActivo().nombreOficial}, en Chile.`,
      "Recibes cifras agrupadas de lo que vecinas y vecinos hacen en el portal: solicitudes de servicio pendientes (por servicio y sector), avisos de mascotas perdidas y avistadas, reportes SOS de los últimos 30 días (por tipo y sector), postulaciones a adopción y perros comunitarios.",
      "Escribe un resumen para el equipo municipal en español de Chile, tuteando. Responde solo este JSON:",
      '{"titular": "una frase de 12 palabras o menos con lo más importante",',
      ' "destacados": [2 o 3 objetos {"titulo": "2 a 4 palabras", "cifra": la cifra principal tal como viene en los datos o null, "detalle": "una frase de 20 palabras o menos, con el sector si aplica", "tono": "atencion" si pide mirarse con prioridad (por ejemplo reportes SOS concentrados) o "normal"}],',
      ' "recomendaciones": [1 o 2 objetos {"texto": "empieza con «Se recomienda evaluar», 20 palabras o menos", "porque": "las cifras que la explican, 20 palabras o menos"}]}',
      "Usa solo cifras que estén en los datos, sin calcular porcentajes ni sumas nuevas. Nunca uses «debe» ni «deben».",
      "Sin emoji, sin mayúsculas sostenidas, sin siglas sin explicar, sin nombres de personas.",
    ].join("\n"),
    usuario: JSON.stringify(datos),
    esquema: esquemaResumen,
    maxTokens: 2_500,
    espera: 9_000,
    razonamiento: "low",
  });
  if (!r) return null;
  const inventadas = cifrasInventadas(r, datos);
  if (inventadas.length) {
    console.error(`Resumen descartado: trae cifras que no están en los datos (${inventadas.join(", ")}).`);
    return null;
  }
  return suavizarResumen(r);
}
