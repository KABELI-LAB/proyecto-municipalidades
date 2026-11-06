import { Icon, IconButton } from '@muni/design-system'
import type { ReactNode } from 'react'
import { PAGE_HEIGHT, PAGE_WIDTH, useFitScale } from '../lib/useFitScale'
import { NIVELES_ZOOM, type Zoom } from '../lib/zoom'
import s from '../styles/ui.module.css'

/** Botones Alejar / Acercar / Ajustar al ancho, con el porcentaje anunciado al cambiar. */
export function ControlZoom({ zoom, etiqueta = 'Zoom del CV' }: { zoom: Zoom; etiqueta?: string }) {
  const { nivel } = zoom
  return (
    <div className={s.zoom} role="group" aria-label={etiqueta}>
      <IconButton icon="minus" label="Alejar" variant="secondary" disabled={nivel === NIVELES_ZOOM[0]} onClick={zoom.alejar} />
      <output className={s.zoomValor} aria-live="polite">
        <span className="hds-visually-hidden">Tamaño: </span>
        {Math.round(nivel * 100)} %
      </output>
      <IconButton icon="plus" label="Acercar" variant="secondary" disabled={nivel === NIVELES_ZOOM.at(-1)} onClick={zoom.acercar} />
      {nivel > 1 && (
        <button type="button" className="hds-btn hds-btn--ghost" onClick={zoom.ajustar}>
          <Icon name="rotate-ccw" size={18} />
          <span>Ajustar al ancho</span>
        </button>
      )}
    </div>
  )
}

/**
 * Página A4 escalada al ancho del contenedor y multiplicada por el zoom. Con zoom,
 * el área se desplaza en ambos sentidos y recibe foco para moverse con las flechas.
 */
export function VistaPagina({ nivel, etiqueta, children }: { nivel: number; etiqueta: string; children: ReactNode }) {
  const { ref, scale } = useFitScale()
  const escala = scale * nivel
  const ampliada = nivel > 1
  return (
    <div
      ref={ref}
      className={`${s.zoomArea} ${ampliada ? s.zoomAmpliada : ''}`}
      {...(ampliada ? { tabIndex: 0, role: 'region', 'aria-label': `${etiqueta} ampliado. Usa las flechas para moverte.` } : {})}
    >
      <div style={{ width: PAGE_WIDTH * escala, height: PAGE_HEIGHT * escala }}>
        <div className={s.previewPage} style={{ transform: `scale(${escala})` }} data-a11y-fijo="">
          {children}
        </div>
      </div>
    </div>
  )
}
