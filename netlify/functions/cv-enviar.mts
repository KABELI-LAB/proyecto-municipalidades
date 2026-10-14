import { handleEnviarRequest } from '../../modulos/cv-empleabilidad/server/email.ts'

/**
 * POST /api/cv/enviar → envía el CV (PDF + Word) al correo de la persona vía SMTP.
 * Variables en Netlify: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (secreta) y,
 * opcionales, CV_EMAIL_FROM_NAME y CV_EMAIL_REPLY_TO.
 */
export default (req: Request) => handleEnviarRequest(req, process.env)

export const config = {
  path: '/api/cv/enviar',
  method: 'POST',
}
