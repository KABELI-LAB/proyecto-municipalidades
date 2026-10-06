import { analyzeCv, AnalyzeError, MAX_TEXTO, readAiConfig } from './analyze.ts'
import { requestSchema } from './schema.ts'

/**
 * Handler HTTP estándar (Request → Response) de `POST /api/cv/analyze`.
 * Lo usan netlify/functions/cv-analyze.mts y el plugin de Vite en desarrollo.
 */
export async function handleAnalyzeRequest(
  req: Request,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido.' })

  const config = readAiConfig(env)
  if (!config) {
    console.error('[cv-analyze] faltan variables AZURE_OPENAI_*')
    return json(503, { error: 'El servicio de análisis no está configurado.' })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Solicitud inválida.' })
  }
  const input = requestSchema.safeParse(body)
  if (!input.success) return json(400, { error: 'Solicitud inválida.' })
  if (input.data.texto.length > MAX_TEXTO) {
    return json(413, { error: 'El CV es demasiado extenso para analizarlo. Redúzcalo a 2 páginas e inténtelo de nuevo.' })
  }

  try {
    const result = await analyzeCv(input.data.texto, config, fetchImpl)
    return json(200, result)
  } catch (err) {
    if (err instanceof AnalyzeError) {
      console.error(`[cv-analyze] ${err.detalle}`)
      return json(err.status, { error: err.mensajeUsuario })
    }
    console.error('[cv-analyze] error inesperado', (err as Error).name)
    return json(500, { error: 'Ocurrió un problema al procesar su CV.' })
  }
}

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
