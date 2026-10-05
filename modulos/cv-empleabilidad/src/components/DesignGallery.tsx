import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CvData } from '../services/types'
import s from '../styles/ui.module.css'
import { TEMPLATES, type CvTemplate } from '../templates'

const PAGE_WIDTH = 794

/** Escala la página A4 para que quepa en el ancho disponible. */
function useFitScale() {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / PAGE_WIDTH))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, scale }
}

export function DesignGallery({ cv }: { cv: CvData }) {
  const [activo, setActivo] = useState<CvTemplate['id']>('clasico')
  const [imprimiendo, setImprimiendo] = useState(false)
  const { ref, scale } = useFitScale()
  const template = TEMPLATES.find((t) => t.id === activo)!
  const { Component } = template

  // Imprime solo la plantilla: se monta en un portal y una clase en <body>
  // oculta el resto del sitio anfitrión durante la impresión.
  useEffect(() => {
    if (!imprimiendo) return
    document.body.classList.add('cv-print-mode')
    const done = () => setImprimiendo(false)
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 50)
    return () => {
      clearTimeout(t)
      window.removeEventListener('afterprint', done)
      document.body.classList.remove('cv-print-mode')
    }
  }, [imprimiendo])

  return (
    <section className={s.panel} aria-labelledby="cv-designs-title">
      <h3 id="cv-designs-title">Su CV en 3 diseños</h3>
      <p className={s.nota}>Revise el contenido sugerido, elija un diseño y descárguelo en PDF. Los textos entre [corchetes] debe completarlos usted.</p>

      <div className={s.designTabs} role="tablist" aria-label="Diseños de CV">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`cv-tab-${t.id}`}
            aria-selected={activo === t.id}
            aria-controls="cv-design-preview"
            onClick={() => setActivo(t.id)}
          >
            <span className={s.designName}>{t.nombre}</span>
            <span className={s.designDesc}>{t.descripcion}</span>
          </button>
        ))}
      </div>

      <div id="cv-design-preview" role="tabpanel" aria-labelledby={`cv-tab-${activo}`} className={s.previewFrame}>
        <div ref={ref} style={{ height: 1123 * scale }}>
          <div className={s.previewPage} style={{ transform: `scale(${scale})` }}>
            <Component cv={cv} />
          </div>
        </div>
      </div>

      <div className={s.actions}>
        <button type="button" className={s.btnPrimary} onClick={() => setImprimiendo(true)}>
          Descargar diseño {template.nombre} (PDF)
        </button>
      </div>

      {imprimiendo &&
        createPortal(
          <div className="cv-print-root">
            <Component cv={cv} />
          </div>,
          document.body,
        )}
    </section>
  )
}
