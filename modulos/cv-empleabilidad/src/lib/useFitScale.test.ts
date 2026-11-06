import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PAGE_HEIGHT, PAGE_WIDTH, useFitScale } from './useFitScale'

/** Monta el hook sobre un contenedor de `ancho` px, con la ventana de `alto` px. */
function escala(ancho: number, alto: number, escritorio: boolean, ajustarAlto: boolean) {
  vi.stubGlobal('innerHeight', alto)
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: escritorio, media: q, addEventListener() {}, removeEventListener() {} }))
  const el = document.createElement('div')
  Object.defineProperty(el, 'clientWidth', { value: ancho })
  const { result } = renderHook(() => {
    const r = useFitScale(ajustarAlto)
    ;(r.ref as { current: HTMLDivElement | null }).current = el
    return r
  })
  return result.current.scale
}

afterEach(() => vi.unstubAllGlobals())

describe('useFitScale', () => {
  it('sin ajustarAlto, escala solo por el ancho', () => {
    expect(escala(PAGE_WIDTH / 2, 800, true, false)).toBeCloseTo(0.5)
  })

  it('en escritorio, la hoja cabe en el alto de la ventana', () => {
    expect(escala(700, 800, true, true)).toBeCloseTo((800 - 260) / PAGE_HEIGHT)
  })

  it('no baja de un alto mínimo legible ni aplica el alto en celular', () => {
    expect(escala(700, 500, true, true)).toBeCloseTo(480 / PAGE_HEIGHT)
    expect(escala(350, 500, false, true)).toBeCloseTo(350 / PAGE_WIDTH)
  })
})
