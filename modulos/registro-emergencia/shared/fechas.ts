/**
 * Fechas en es-CL y zona America/Santiago (brief 3): legibles en textos
 * ("sábado 15 de noviembre") y `DD.MM.AA` en tablas.
 */

const ZONA = 'America/Santiago'

/** "sábado 15 de noviembre". Con `conAnio`, "sábado 15 de noviembre de 2026". */
export function fechaLegible(fecha: Date | string, conAnio = false): string {
  const d = aFecha(fecha)
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(conAnio ? { year: 'numeric' } : {}),
  })
    .format(d)
    .replace(',', '')
}

/** "15 de noviembre de 2026". */
export function fechaCorta(fecha: Date | string): string {
  return new Intl.DateTimeFormat('es-CL', { timeZone: ZONA, day: 'numeric', month: 'long', year: 'numeric' }).format(
    aFecha(fecha),
  )
}

/** `15.11.26` para datos tabulares. */
export function fechaTabla(fecha: Date | string): string {
  const partes = new Intl.DateTimeFormat('es-CL', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).formatToParts(aFecha(fecha))
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? ''
  return `${v('day')}.${v('month')}.${v('year')}`
}

/** `14:05` en hora de Santiago. */
export function horaTabla(fecha: Date | string): string {
  return new Intl.DateTimeFormat('es-CL', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false }).format(
    aFecha(fecha),
  )
}

/** Fecha calendario (YYYY-MM-DD) en Santiago para un instante. */
export function diaSantiago(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha)
}

/** Suma meses a una fecha calendario `YYYY-MM-DD` (el 31 cae al último día del mes). */
export function sumarMeses(dia: string, meses: number): string {
  const [a, m, d] = dia.split('-').map(Number) as [number, number, number]
  const base = new Date(Date.UTC(a, m - 1 + meses, 1))
  const ultimo = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()
  base.setUTCDate(Math.min(d, ultimo))
  return base.toISOString().slice(0, 10)
}

/** Días completos desde `hoy` hasta `dia` (negativo si ya pasó). */
export function diasHasta(dia: string, hoy: Date = new Date()): number {
  const a = Date.parse(`${diaSantiago(hoy)}T00:00:00Z`)
  const b = Date.parse(`${dia}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

function aFecha(fecha: Date | string): Date {
  if (fecha instanceof Date) return fecha
  // Una fecha calendario sola se interpreta a mediodía para no cambiar de día por la zona.
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? new Date(`${fecha}T12:00:00-03:00`) : new Date(fecha)
}
