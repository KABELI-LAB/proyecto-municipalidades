import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'
import { handleEnviarRequest } from './email.ts'
import { handleAnalyzeRequest } from './handler.ts'

type Handler = (req: Request, env: Record<string, string>) => Promise<Response>

/** Endpoints que en producción sirven las funciones de netlify/functions/. */
const RUTAS: Record<string, Handler> = {
  '/api/cv/analyze': handleAnalyzeRequest,
  '/api/cv/enviar': handleEnviarRequest,
}

/**
 * Sirve los endpoints del módulo CV en el dev server de Vite. Lee las
 * variables del `.env` de la raíz del repo (`envDir`). Solo para desarrollo.
 */
export function cvApiDevPlugin(envDir: string): Plugin {
  return {
    name: 'muni-cv-api-dev',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, envDir, ['AZURE_OPENAI_', 'RESEND_', 'CV_EMAIL_'])
      for (const [ruta, handler] of Object.entries(RUTAS)) {
        server.middlewares.use(ruta, (req, res) => {
          void forward(req, res, ruta, handler, env)
        })
      }
    },
  }
}

async function forward(req: IncomingMessage, res: ServerResponse, ruta: string, handler: Handler, env: Record<string, string>) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const request = new Request(`http://localhost${ruta}`, {
    method: req.method,
    headers: { 'Content-Type': req.headers['content-type'] ?? 'application/json' },
    body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
  })
  const response = await handler(request, env)
  res.statusCode = response.status
  response.headers.forEach((v, k) => res.setHeader(k, v))
  res.end(await response.text())
}
