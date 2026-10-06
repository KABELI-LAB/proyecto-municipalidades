import { handleEnviarRequest } from '../../modulos/cv-empleabilidad/server/email.ts'

/**
 * POST /api/cv/enviar → envía el CV (PDF + Word) al correo de la persona vía
 * Resend. Variables requeridas en Netlify: RESEND_API_KEY, CV_EMAIL_FROM.
 */
export default (req: Request) => handleEnviarRequest(req, process.env)

export const config = {
  path: '/api/cv/enviar',
  method: 'POST',
}
