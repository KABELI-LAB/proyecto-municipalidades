import { handleEmergenciaRequest } from '../../modulos/registro-emergencia/server/handler.ts'

/**
 * /api/emergencia/* → Registro de emergencia. La lógica vive en el módulo
 * (modulos/registro-emergencia/server). Variables en Netlify:
 * DATABASE_URL o SUPABASEKEY (secreta, pooler de Supabase) y EMERGENCIA_URL_BASE.
 */
export default (req: Request) => handleEmergenciaRequest(req, process.env)

export const config = {
  path: '/api/emergencia/*',
}
