import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'
import { handleEmergenciaRequest, PREFIJO } from './handler.ts'

/**
 * Sirve `/api/emergencia/*` en el dev server de Vite (en producción lo hace
 * netlify/functions/emergencia-api.mts). Lee DATABASE_URL del `.env` de la raíz;
 * sin ella usa el repositorio en memoria con datos de demostración.
 */
export function emergenciaApiDevPlugin(envDir: string): Plugin {
  return {
    name: 'muni-emergencia-api-dev',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, envDir, ['DATABASE_URL', 'EMERGENCIA_'])
      if (!env.DATABASE_URL) env.EMERGENCIA_DEMO = '1'
      server.middlewares.use(PREFIJO, (req, res) => {
        void forward(req, res, env)
      })
    },
  }
}

async function forward(req: IncomingMessage, res: ServerResponse, env: Record<string, string>) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
  // Dentro del middleware, req.url no incluye el prefijo montado.
  const request = new Request(`http://localhost${PREFIJO}${req.url ?? ''}`, {
    method: req.method,
    headers,
    body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
  })
  const response = await handleEmergenciaRequest(request, env)
  res.statusCode = response.status
  response.headers.forEach((v, k) => res.setHeader(k, v))
  res.end(await response.text())
}
