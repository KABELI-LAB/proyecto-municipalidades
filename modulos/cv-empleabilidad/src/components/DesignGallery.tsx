import { useLayoutEffect, useRef, useState } from 'react'
import { descargar, generarArchivos, type ArchivoCv } from '../export'
import type { CvMailer } from '../services/mailer'
import type { CvData } from '../services/types'
import s from '../styles/ui.module.css'
import { TEMPLATES, type CvTemplate } from '../templates'
import { EnvioCorreo } from './EnvioCorreo'

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

export function DesignGallery({ cv, mailer }: { cv: CvData; mailer: CvMailer }) {
  const [activo, setActivo] = useState<CvTemplate['id']>('clasico')
  const [preparando, setPreparando] = useState<'pdf' | 'docx' | null>(null)
  const [errorDescarga, setErrorDescarga] = useState(false)
  const cache = useRef(new Map<string, Promise<ArchivoCv[]>>())
  const { ref, scale } = useFitScale()
  const template = TEMPLATES.find((t) => t.id === activo)!
  const { Component } = template

  // Un mismo diseño se genera una sola vez, tanto para descargar como para enviar.
  const generar = () => {
    let p = cache.current.get(activo)
    if (!p) {
      p = generarArchivos(cv, activo)
      p.catch(() => cache.current.delete(activo))
      cache.current.set(activo, p)
    }
    return p
  }

  async function bajar(tipo: 'pdf' | 'docx') {
    if (preparando) return
    setPreparando(tipo)
    setErrorDescarga(false)
    try {
      const archivo = (await generar()).find((a) => a.tipo === tipo)
      if (archivo) descargar(archivo)
    } catch (err) {
      console.error('[cv-empleabilidad] exportación', err)
      setErrorDescarga(true)
    } finally {
      setPreparando(null)
    }
  }

  return (
    <section className={s.panel} aria-labelledby="cv-designs-title">
      <h3 id="cv-designs-title">Su CV en 3 diseños</h3>
      <p className={s.nota}>Elija un diseño, descárguelo o recíbalo por correo. Los textos entre [corchetes] debe completarlos usted: el archivo Word le permite editarlos.</p>

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

      {/* aria-disabled (no disabled) para que el foco no se pierda mientras se prepara el archivo. */}
      <div className={s.actions}>
        <button type="button" className={s.btnSecondary} onClick={() => bajar('docx')} aria-disabled={preparando !== null || undefined}>
          {preparando === 'docx' ? 'Preparando…' : 'Descargar Word'}
        </button>
        <button type="button" className={s.btnPrimary} onClick={() => bajar('pdf')} aria-disabled={preparando !== null || undefined}>
          {preparando === 'pdf' ? 'Preparando…' : 'Descargar PDF'}
        </button>
      </div>
      <p aria-live="polite" className={s.nota}>
        {preparando && `Preparando el archivo ${preparando === 'pdf' ? 'PDF' : 'Word'}…`}
      </p>
      {errorDescarga && (
        <p className={s.alert} role="alert">
          No pudimos preparar el archivo. Inténtelo nuevamente.
        </p>
      )}

      {/* key: al cambiar de diseño, el formulario se reinicia con el nuevo nombre. */}
      <EnvioCorreo
        key={activo}
        mailer={mailer}
        diseno={activo}
        nombreDiseno={template.nombre}
        nombrePersona={cv.nombre}
        emailSugerido={cv.contacto.email}
        generar={generar}
      />
    </section>
  )
}
