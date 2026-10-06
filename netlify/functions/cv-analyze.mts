import { handleAnalyzeRequest } from '../../modulos/cv-empleabilidad/server/handler.ts'

/**
 * POST /api/cv/analyze → análisis de CV con IA. La lógica vive en el módulo
 * (modulos/cv-empleabilidad/server). Variables requeridas en Netlify:
 * AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT.
 */
export default (req: Request) => handleAnalyzeRequest(req, process.env)

export const config = {
  path: '/api/cv/analyze',
  method: 'POST',
}
