import { useState } from 'react'

/** Niveles de zoom sobre el tamaño "ajustado al ancho" (100 %). */
export const NIVELES_ZOOM = [1, 1.25, 1.5, 2, 2.5, 3] as const

export interface Zoom {
  nivel: number
  acercar: () => void
  alejar: () => void
  ajustar: () => void
}

export function useZoom(): Zoom {
  const [i, setI] = useState(0)
  return {
    nivel: NIVELES_ZOOM[i]!,
    acercar: () => setI((n) => Math.min(n + 1, NIVELES_ZOOM.length - 1)),
    alejar: () => setI((n) => Math.max(n - 1, 0)),
    ajustar: () => setI(0),
  }
}
