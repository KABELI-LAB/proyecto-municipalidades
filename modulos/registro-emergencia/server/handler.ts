/**
 * Handler HTTP estándar (Request → Response) de `/api/emergencia/*`.
 * Lo usan netlify/functions/emergencia-api.mts y el plugin de Vite en desarrollo.
 *
 * Nunca se registran datos personales: los logs dicen la ruta y el tipo de error.
 */
import { z } from 'zod'
import type { CodigoError, ErrorApi } from '../shared/contrato.ts'
import { inscripcionSchema } from '../shared/esquemas.ts'
import { ConsoleProvider, type MessagingProvider } from './mensajeria.ts'
import type { Repositorio } from './repo.ts'
import { crearRepoMemoria } from './repoMemoria.ts'
import { crearRepoPostgres, TiempoAgotadoError } from './repoPostgres.ts'
import { pareceToken, sha256 } from './seguridad.ts'
import { inscribir, miHogar, resumenPublico, RutExistenteError, type Contexto } from './servicio.ts'

export const PREFIJO = '/api/emergencia'

type Env = Record<string, string | undefined>

let contextoCompartido: Contexto | null = null

/** Cadena de conexión a Supabase. `SUPABASEKEY` es el nombre usado en Netlify y en el .env local. */
export function urlBaseDatos(env: Env): string | undefined {
  return env.DATABASE_URL || env.SUPABASEKEY || undefined
}

/**
 * Con DATABASE_URL (o SUPABASEKEY) usa Supabase. Sin ella, solo fuera de producción, usa el
 * repositorio en memoria con datos de demostración.
 */
export function contextoDesdeEnv(env: Env): Contexto | null {
  if (contextoCompartido) return contextoCompartido
  let repo: Repositorio
  const url = urlBaseDatos(env)
  if (url) repo = crearRepoPostgres(url)
  else if (env.EMERGENCIA_DEMO === '1') repo = crearRepoMemoria()
  else return null
  contextoCompartido = {
    repo,
    mensajeria: proveedorMensajeria(),
    ahora: () => new Date(),
    urlBase: (env.EMERGENCIA_URL_BASE ?? 'http://localhost:5173/emergencia').replace(/\/$/, ''),
  }
  return contextoCompartido
}

/** Proveedor real de WhatsApp: pendiente de decisión (brief 13.7). */
function proveedorMensajeria(): MessagingProvider {
  return new ConsoleProvider()
}

export async function handleEmergenciaRequest(req: Request, env: Env, ctx = contextoDesdeEnv(env)): Promise<Response> {
  const ruta = new URL(req.url).pathname.replace(PREFIJO, '').replace(/\/$/, '') || '/'
  if (!ctx) {
    console.error('[emergencia] falta DATABASE_URL o SUPABASEKEY')
    return error(503, 'El registro no está disponible en este momento. Inténtalo más tarde.', 'no_disponible')
  }
  try {
    switch (`${req.method} ${ruta}`) {
      case 'GET /territorio':
        return json(200, await ctx.repo.territorio(), 300)
      case 'GET /resumen':
        return json(200, await resumenPublico(ctx), 60)
      case 'POST /inscripcion':
        return await postInscripcion(req, ctx)
      case 'POST /mi-hogar':
        return await postMiHogar(req, ctx)
      case 'POST /eventos':
        return await postEvento(req, ctx)
      default:
        return error(404, 'No encontramos lo que buscas.')
    }
  } catch (err) {
    console.error(`[emergencia] ${req.method} ${ruta}:`, err instanceof Error ? err.name : 'error')
    if (err instanceof TiempoAgotadoError) {
      return error(503, 'No pudimos conectarnos al registro. Inténtalo de nuevo en unos segundos.', 'no_disponible')
    }
    return error(500, 'Tuvimos un problema. Inténtalo de nuevo en unos minutos.')
  }
}

async function postInscripcion(req: Request, ctx: Contexto): Promise<Response> {
  const ip = ipDe(req)
  if (await superaLimite(ctx, `inscripcion:${ip ?? 'sin-ip'}`, 20)) {
    return error(429, 'Hiciste muchos intentos seguidos. Espera una hora e inténtalo de nuevo.', 'limite')
  }
  const cuerpo = await leerJson(req)
  const datos = inscripcionSchema.safeParse(cuerpo)
  if (!datos.success) return errorValidacion(datos.error)
  try {
    const creada = await inscribir(ctx, datos.data, { ip, userAgent: req.headers.get('user-agent') })
    return json(201, creada)
  } catch (err) {
    if (err instanceof RutExistenteError) {
      return error(409, 'Este RUT ya tiene su Tarjeta Hogar Preparado.', 'rut_existente')
    }
    throw err
  }
}

async function postMiHogar(req: Request, ctx: Contexto): Promise<Response> {
  const cuerpo = (await leerJson(req)) as { token?: unknown } | null
  if (!pareceToken(cuerpo?.token)) return tokenInvalido()
  const hogar = await miHogar(ctx, cuerpo.token)
  return hogar ? json(200, hogar) : tokenInvalido()
}

const eventoSchema = z.object({
  sesion: z.string().min(8).max(100),
  paso: z.string().regex(/^[a-z0-9-]{1,40}$/),
  evento: z.enum(['vista', 'completado', 'abandono', 'enviado']),
})

async function postEvento(req: Request, ctx: Contexto): Promise<Response> {
  const e = eventoSchema.safeParse(await leerJson(req))
  if (!e.success) return new Response(null, { status: 204 })
  // Métrica anónima: si la base falla, se pierde el evento y la persona no lo nota.
  try {
    await ctx.repo.registrarEventoCuestionario(await sha256(e.data.sesion), e.data.paso, e.data.evento)
  } catch (err) {
    console.error('[emergencia] evento no registrado:', err instanceof Error ? err.name : 'error')
  }
  return new Response(null, { status: 204 })
}

// ── utilidades ───────────────────────────────────────────────────────────────

/** Ventana fija de una hora. La clave se guarda como hash (puede contener una IP o un RUT). */
async function superaLimite(ctx: Contexto, clave: string, maximo: number): Promise<boolean> {
  const ahora = ctx.ahora()
  const ventana = new Date(Math.floor(ahora.getTime() / 3_600_000) * 3_600_000)
  return (await ctx.repo.contarIntento(await sha256(clave), ventana)) > maximo
}

function ipDe(req: Request): string | null {
  return (
    req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null
  )
}

async function leerJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return null
  }
}

function errorValidacion(e: z.ZodError): Response {
  const campos: Record<string, string> = {}
  for (const issue of e.issues) {
    const clave = issue.path.filter((p) => typeof p === 'string' && p !== 'hogar').join('.')
    if (clave && !campos[clave]) campos[clave] = issue.message
  }
  return json<ErrorApi>(400, { error: 'Revisa los datos marcados.', codigo: 'validacion', campos })
}

function tokenInvalido(): Response {
  return error(401, 'Tu link ya no es válido. Pide uno nuevo desde "Perdí mi código".', 'token_invalido')
}

function error(status: number, mensaje: string, codigo?: CodigoError): Response {
  return json<ErrorApi>(status, codigo ? { error: mensaje, codigo } : { error: mensaje })
}

function json<T>(status: number, cuerpo: T, maxAgeSeg?: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': maxAgeSeg ? `public, max-age=${maxAgeSeg}` : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
