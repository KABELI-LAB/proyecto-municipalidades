import { useLayoutEffect, useRef, useState } from 'react'

export const PAGE_WIDTH = 794 // A4 a 96 dpi
export const PAGE_HEIGHT = 1123

/** Escala una página A4 para que quepa en el ancho del contenedor. */
export function useFitScale() {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / PAGE_WIDTH) || 1)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, scale }
}
