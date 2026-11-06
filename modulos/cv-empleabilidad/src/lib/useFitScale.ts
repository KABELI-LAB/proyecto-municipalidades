import { useLayoutEffect, useRef, useState } from 'react'

export const PAGE_WIDTH = 794 // A4 a 96 dpi
export const PAGE_HEIGHT = 1123

/** Alto que ocupan, junto a la hoja, el título, las pestañas y los márgenes del panel. */
const MARGEN_ALTO = 260
/** Por debajo de este alto la hoja se vuelve ilegible: mejor bajar un poco. */
const ALTO_MIN = 480
const ESCRITORIO = '(min-width: 1024px)'

/**
 * Escala una página A4 para que quepa en el ancho del contenedor. Con ajustarAlto,
 * en escritorio también cabe entera en el alto de la ventana (así no hay que bajar
 * para ver la hoja completa; para leer el detalle está el zoom).
 */
export function useFitScale(ajustarAlto = false) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const porAncho = el.clientWidth / PAGE_WIDTH
      let porAlto = Infinity
      if (ajustarAlto && typeof window.matchMedia === 'function' && window.matchMedia(ESCRITORIO).matches) {
        // Con "Tamaño del texto" la pestaña tiene zoom: el alto disponible en px locales es menor.
        const zoom = (el as HTMLElement & { currentCSSZoom?: number }).currentCSSZoom ?? 1
        porAlto = Math.max(ALTO_MIN, window.innerHeight / zoom - MARGEN_ALTO) / PAGE_HEIGHT
      }
      setScale(Math.min(1, porAncho, porAlto) || 1)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ajustarAlto])
  return { ref, scale }
}
