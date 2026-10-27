/**
 * sessionStorage con tolerancia a fallos (modo privado, almacenamiento lleno).
 * Se usa sessionStorage y no localStorage porque muchos equipos son compartidos
 * (CESFAM, juntas de vecinos): al cerrar la pestaña no queda nada.
 */

const PREFIJO = 'emergencia:'

export function leer<T>(clave: string): T | null {
  try {
    const v = sessionStorage.getItem(PREFIJO + clave)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

export function guardar(clave: string, valor: unknown): void {
  try {
    sessionStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
  } catch {
    // Sin almacenamiento el flujo sigue funcionando; solo no se recupera al recargar.
  }
}

export function borrar(clave: string): void {
  try {
    sessionStorage.removeItem(PREFIJO + clave)
  } catch {
    // nada que hacer
  }
}

export const CLAVES = {
  borrador: 'borrador',
  sesion: 'sesion',
  resultado: 'resultado',
  menosMovimiento: 'menos-movimiento',
} as const
