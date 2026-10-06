import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'
import { handleAnalyzeRequest } from './handler.ts'

/**
 * Sirve `POST /api/cv/analyze` en el dev server de Vite, igual que la función
 * de Netlify en producción. Lee las variables AZURE_OPENAI_* del `.env` de la
 * raíz del repo (`envDir`). Solo para desarrollo.
 */
export function cvApiDevPlugin(envDir: string): Plugin {
  return {
    name: 'muni-cv-api-dev',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, envDir, 'AZURE_OPENAI_')
      server.middlewares.use('/api/cv/analyze', (req, res) => {
        void forward(req, res, env)
      })
    },
  }
}

async function forward(req: IncomingMessage, res: ServerResponse, env: Record<string, string>) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const request = new Request('http://localhost/api/cv/analyze', {
    method: req.method,
    headers: { 'Content-Type': req.headers['content-type'] ?? 'application/json' },
    body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
  })
  const response = await handleAnalyzeRequest(request, env)
  res.statusCode = response.status
  response.headers.forEach((v, k) => res.setHeader(k, v))
  res.end(await response.text())
}
