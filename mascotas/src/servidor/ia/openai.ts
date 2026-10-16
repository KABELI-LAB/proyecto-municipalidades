// Inteligencia artificial con la API de OpenAI (Chat Completions), solo desde
// el servidor. La clave vive en OPENAI_API_KEY (variable de entorno, nunca en
// el navegador ni en el repositorio) y el modelo en OPENAI_MODEL. Con
// OPENAI_BASE_URL se usa otro servicio compatible, por ejemplo Azure AI Foundry
// («https://<recurso>.services.ai.azure.com/openai/v1», y en OPENAI_MODEL el
// nombre del despliegue). Se usa solo
// si hay clave y si administración la encendió en el panel; si algo falla,
// quien llama sigue sin IA (nunca se interrumpe el flujo).
// A la IA nunca se le envían RUT, teléfonos, correos ni nombres de personas.
import "server-only";
import type { z } from "zod";
import { municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";

const MODELO_PREDETERMINADO = "gpt-4o-mini";
const BASE_PREDETERMINADA = "https://api.openai.com/v1";

const urlAPI = () => `${(process.env.OPENAI_BASE_URL?.trim() || BASE_PREDETERMINADA).replace(/\/+$/, "")}/chat/completions`;

export const modeloIA = () => process.env.OPENAI_MODEL?.trim() || MODELO_PREDETERMINADO;
/** Modelos que razonan (gpt-5…, o1, o3…): no aceptan «temperature» y gastan tokens en pensar. */
const razona = (modelo: string) => /^(gpt-5|o\d)/i.test(modelo);

export const iaConfigurada = () => Boolean(process.env.OPENAI_API_KEY?.trim());

/** Si la IA está configurada y encendida para este municipio. */
export async function iaActiva(): Promise<boolean> {
  if (!iaConfigurada()) return false;
  const m = await db.municipio.findUnique({ where: { id: municipioActivo().id }, select: { iaActiva: true } });
  return m?.iaActiva ?? false;
}

/**
 * Pide a la IA una respuesta en JSON y la valida con el esquema. Devuelve null
 * si no hay clave, si la API falla o si la respuesta no calza: quien llama
 * sigue con su camino sin IA.
 */
export async function pedirJSON<T>(o: {
  sistema: string;
  usuario: string;
  esquema: z.ZodType<T>;
  maxTokens?: number;
  espera?: number;
  /** Cuánto piensa un modelo que razona: «none» para clasificar, «low» para escribir. */
  razonamiento?: "none" | "low";
}): Promise<T | null> {
  const clave = process.env.OPENAI_API_KEY?.trim();
  if (!clave) return null;
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), o.espera ?? 20_000);
  try {
    const url = urlAPI();
    // Azure acepta la clave en «api-key»; OpenAI, como «Bearer».
    const azure = new URL(url).hostname.endsWith(".azure.com");
    const r = await fetch(url, {
      method: "POST",
      headers: { ...(azure ? { "api-key": clave } : { Authorization: `Bearer ${clave}` }), "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modeloIA(),
        ...(razona(modeloIA()) ? { reasoning_effort: o.razonamiento ?? "low" } : { temperature: 0.2 }),
        max_completion_tokens: o.maxTokens ?? 800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: o.sistema },
          { role: "user", content: o.usuario },
        ],
      }),
      signal: control.signal,
      cache: "no-store",
    });
    const cuerpo = (await r.json().catch(() => null)) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } } | null;
    if (!r.ok || !cuerpo?.choices?.[0]?.message?.content) {
      // Solo el estado y el mensaje de la API: nunca la clave ni lo que se envió.
      console.error(`IA: la API respondió ${r.status}${cuerpo?.error?.message ? `: ${cuerpo.error.message}` : ""}`);
      return null;
    }
    const datos = o.esquema.safeParse(JSON.parse(cuerpo.choices[0].message.content));
    return datos.success ? datos.data : null;
  } catch (e) {
    console.error("IA: no se pudo completar la consulta", e instanceof Error ? e.name : "");
    return null;
  } finally {
    clearTimeout(reloj);
  }
}
