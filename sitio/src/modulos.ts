import type { ComponentType } from 'react'
import { CvTab, cvTabMeta } from '@muni/cv-empleabilidad'
// <nuevo-modulo:imports> (no borrar: `npm run nuevo-modulo` inserta aquí)

/**
 * Registro de pestañas del sitio. Cada módulo de `modulos/` aporta una entrada:
 * aparece en el navbar, en las tarjetas del inicio y como ruta propia.
 * El orden de este arreglo es el orden del navbar.
 */

export interface ModuloMeta {
  id: string
  label: string
  /** Ruta absoluta, ej. '/empleabilidad/cv'. Debe ser única. */
  path: string
  /** Una frase para la tarjeta del inicio. */
  descripcion: string
}

export interface Modulo {
  meta: ModuloMeta
  Component: ComponentType
}

export const MODULOS: Modulo[] = [
  { meta: cvTabMeta, Component: CvTab },
  // <nuevo-modulo:registro> (no borrar)
]
