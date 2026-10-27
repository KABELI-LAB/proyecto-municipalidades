/**
 * Cliente de `/api/emergencia/*` (contrato en shared/contrato.ts). La pestaña
 * recibe una implementación por props; por defecto usa HTTP contra el mismo sitio.
 */
import type { CodigoError, ErrorApi, InscripcionCreada, MiHogar, ResumenPublico, Territorio } from '../../shared/contrato.ts'
import type { InscripcionEntrada } from '../../shared/esquemas.ts'

export interface EmergenciaApi {
  territorio(): Promise<Territorio>
  resumen(): Promise<ResumenPublico>
  inscribir(datos: InscripcionEntrada): Promise<InscripcionCreada>
  miHogar(token: string): Promise<MiHogar>
  /** Métrica anónima del cuestionario. Nunca falla hacia la UI. */
  evento(sesion: string, paso: string, evento: 'vista' | 'completado' | 'abandono' | 'enviado'): void
}

export class ApiError extends Error {
  readonly status: number
  readonly codigo: CodigoError | undefined
  readonly campos: Record<string, string>
  constructor(status: number, cuerpo: Partial<ErrorApi>) {
    super(cuerpo.error ?? 'Tuvimos un problema. Inténtalo de nuevo en unos minutos.')
    this.status = status
    this.codigo = cuerpo.codigo
    this.campos = cuerpo.campos ?? {}
  }
}

export function crearApiHttp(base = '/api/emergencia', fetchImpl: typeof fetch = (...a) => fetch(...a)): EmergenciaApi {
  async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
    let r: Response
    try {
      r = await fetchImpl(`${base}${ruta}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      })
    } catch {
      throw new ApiError(0, { error: 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.' })
    }
    const cuerpo = (await r.json().catch(() => ({}))) as unknown
    if (!r.ok) throw new ApiError(r.status, cuerpo as Partial<ErrorApi>)
    return cuerpo as T
  }
  const post = <T>(ruta: string, cuerpo: unknown) => pedir<T>(ruta, { method: 'POST', body: JSON.stringify(cuerpo) })

  return {
    territorio: () => pedir('/territorio'),
    resumen: () => pedir('/resumen'),
    inscribir: (datos) => post('/inscripcion', datos),
    miHogar: (token) => post('/mi-hogar', { token }),
    evento(sesion, paso, evento) {
      // keepalive: el evento "abandono" se envía al cerrar la página.
      void fetchImpl(`${base}/eventos`, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion, paso, evento }),
      }).catch(() => undefined)
    },
  }
}
