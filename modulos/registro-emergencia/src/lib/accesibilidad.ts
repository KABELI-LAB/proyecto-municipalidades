import { useCallback, useState } from 'react'
import a from '../styles/accesibilidad.module.css'

/*
 * Opciones de accesibilidad de la pestaña. Mismo archivo en cv-empleabilidad y
 * registro-emergencia (mantener en sincronía): ambos usan la misma clave, así las
 * preferencias siguen al cambiar de pestaña. sessionStorage y no localStorage:
 * muchos equipos son compartidos y al cerrar el navegador no queda nada.
 */

export type TamanoTexto = 'normal' | 'grande' | 'muyGrande'

export interface PreferenciasAccesibilidad {
  texto: TamanoTexto
  contraste: boolean
  subrayarEnlaces: boolean
  espaciado: boolean
  menosMovimiento: boolean
}

export const PREFERENCIAS_INICIALES: PreferenciasAccesibilidad = {
  texto: 'normal',
  contraste: false,
  subrayarEnlaces: false,
  espaciado: false,
  menosMovimiento: false,
}

const CLAVE = 'muni:accesibilidad'
const TAMANOS: TamanoTexto[] = ['normal', 'grande', 'muyGrande']

export function leerPreferencias(): PreferenciasAccesibilidad {
  try {
    const v = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as Partial<PreferenciasAccesibilidad> | null
    if (!v || typeof v !== 'object') return PREFERENCIAS_INICIALES
    return {
      texto: TAMANOS.includes(v.texto as TamanoTexto) ? (v.texto as TamanoTexto) : 'normal',
      contraste: v.contraste === true,
      subrayarEnlaces: v.subrayarEnlaces === true,
      espaciado: v.espaciado === true,
      menosMovimiento: v.menosMovimiento === true,
    }
  } catch {
    return PREFERENCIAS_INICIALES
  }
}

function guardarPreferencias(p: PreferenciasAccesibilidad): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(p))
  } catch {
    // Sin almacenamiento las opciones funcionan igual; solo no se recuerdan al recargar.
  }
}

export function usePreferenciasAccesibilidad() {
  const [preferencias, setPreferencias] = useState(leerPreferencias)
  const cambiar = useCallback((cambios: Partial<PreferenciasAccesibilidad>) => {
    setPreferencias((p) => {
      const nuevas = { ...p, ...cambios }
      guardarPreferencias(nuevas)
      return nuevas
    })
  }, [])
  return [preferencias, cambiar] as const
}

/** Cuántas opciones difieren de las iniciales. */
export function opcionesActivas(p: PreferenciasAccesibilidad): number {
  return (Object.keys(PREFERENCIAS_INICIALES) as (keyof PreferenciasAccesibilidad)[]).filter((k) => p[k] !== PREFERENCIAS_INICIALES[k]).length
}

/** Clases y tema para el contenedor raíz de la pestaña. */
export function propsRaiz(p: PreferenciasAccesibilidad): { className: string; 'data-theme'?: 'high-contrast' } {
  const className = [
    p.texto === 'grande' && a.textoGrande,
    p.texto === 'muyGrande' && a.textoMuyGrande,
    p.contraste && a.contraste,
    p.subrayarEnlaces && a.subrayarEnlaces,
    p.espaciado && a.espaciado,
    p.menosMovimiento && a.menosMovimiento,
  ]
    .filter(Boolean)
    .join(' ')
  return p.contraste ? { className, 'data-theme': 'high-contrast' } : { className }
}
