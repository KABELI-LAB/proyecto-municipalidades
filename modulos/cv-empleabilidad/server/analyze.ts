import type { CvAnalysis } from '../src/services/types.ts'
import { SYSTEM_PROMPT, userMessage } from './prompt.ts'
import { modelResponseSchema, RESPONSE_JSON_SCHEMA } from './schema.ts'

/**
 * Llama al modelo (Azure AI Foundry, API compatible con OpenAI v1) y devuelve
 * un CvAnalysis validado. Sin dependencias de Netlify ni de Vite: se usa desde
 * la función de Netlify y desde el plugin de desarrollo.
 *
 * Privacidad: nunca registrar `texto` ni la respuesta del modelo.
 */

export const MAX_TEXTO = 20_000
const TIMEOUT_MS = 55_000 // las funciones síncronas de Netlify cortan a los 60 s

export interface AiConfig {
  endpoint: string
  apiKey: string
  deployment: string
}

// Sin "parameter properties": este archivo se carga con el type stripping nativo de Node.
export class AnalyzeError extends Error {
  readonly status: number
  /** Mensaje apto para mostrar a la persona usuaria. */
  readonly mensajeUsuario: string
  /** Detalle técnico para logs (sin datos personales). */
  readonly detalle: string

  constructor(status: number, mensajeUsuario: string, detalle: string) {
    super(detalle)
    this.status = status
    this.mensajeUsuario = mensajeUsuario
    this.detalle = detalle
  }
}

type Env = Record<string, string | undefined>

export function readAiConfig(env: Env): AiConfig | null {
  const endpoint = env.AZURE_OPENAI_ENDPOINT?.trim()
  const apiKey = env.AZURE_OPENAI_API_KEY?.trim()
  const deployment = env.AZURE_OPENAI_DEPLOYMENT?.trim()
  if (!endpoint || !apiKey || !deployment) return null
  return { endpoint: endpoint.replace(/\/+$/, ''), apiKey, deployment }
}

export async function analyzeCv(
  texto: string,
  config: AiConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<Omit<CvAnalysis, 'origen'>> {
  let res: Response
  try {
    res = await fetchImpl(`${config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': config.apiKey },
      body: JSON.stringify({
        model: config.deployment,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage(texto) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'cv_analysis', strict: true, schema: RESPONSE_JSON_SCHEMA },
        },
        max_completion_tokens: 8000,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    const timeout = err instanceof DOMException && err.name === 'TimeoutError'
    throw new AnalyzeError(
      timeout ? 504 : 502,
      timeout ? 'El análisis está tardando más de lo esperado. Inténtelo nuevamente.' : 'No pudimos conectar con el servicio de análisis.',
      timeout ? 'timeout del modelo' : `error de red: ${(err as Error).name}`,
    )
  }

  if (!res.ok) {
    const status = res.status === 429 ? 503 : 502
    throw new AnalyzeError(
      status,
      res.status === 429 ? 'El servicio está recibiendo muchas solicitudes. Inténtelo en unos minutos.' : 'El servicio de análisis no está disponible.',
      `modelo respondió ${res.status}`,
    )
  }

  const body = (await res.json()) as { choices?: { message?: { content?: string | null; refusal?: string | null } }[] }
  const message = body.choices?.[0]?.message
  if (!message?.content) {
    throw new AnalyzeError(502, 'No pudimos analizar este CV.', message?.refusal ? 'el modelo rechazó la solicitud' : 'respuesta vacía del modelo')
  }

  let json: unknown
  try {
    json = JSON.parse(message.content)
  } catch {
    throw new AnalyzeError(502, 'No pudimos analizar este CV.', 'el modelo no devolvió JSON')
  }
  const parsed = modelResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new AnalyzeError(502, 'No pudimos analizar este CV.', `JSON inválido: ${parsed.error.issues.length} problemas`)
  }

  const data = parsed.data
  return {
    ...data,
    sugerencias: data.sugerencias.map((s, i) => ({ ...s, id: `s${i + 1}` })),
  }
}
