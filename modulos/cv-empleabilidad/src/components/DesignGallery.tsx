import { Alert, Icon } from '@muni/design-system'
import { useRef, useState, type KeyboardEvent } from 'react'
import { descargar, generarArchivos, type ArchivoCv } from '../export'
import { PAGE_HEIGHT, useFitScale } from '../lib/useFitScale'
import type { CvFileKind } from '../lib/validateFile'
import type { CvMailer } from '../services/mailer'
import type { CvData } from '../services/types'
import s from '../styles/ui.module.css'
import { TEMPLATES, type CvTemplate } from '../templates'
import { Comparacion } from './Comparacion'
import { EnvioCorreo } from './EnvioCorreo'

interface Props {
  cv: CvData
  mailer: CvMailer
  /** Archivo que subió la persona, para compararlo con el diseño sugerido. */
  original: { archivo: File; tipo: CvFileKind }
}

export function DesignGallery({ cv, mailer, original }: Props) {
  const [activo, setActivo] = useState<CvTemplate['id']>('clasico')
  const [preparando, setPreparando] = useState<'pdf' | 'docx' | null>(null)
  const [errorDescarga, setErrorDescarga] = useState(false)
  const [comparando, setComparando] = useState(false)
  const [correoAbierto, setCorreoAbierto] = useState(false)
  const cache = useRef(new Map<string, Promise<ArchivoCv[]>>())
  const { ref, scale } = useFitScale()
  const template = TEMPLATES.find((t) => t.id === activo)!
  const { Component } = template
  const faltanDatos = JSON.stringify(cv).includes('[')

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

  // Pestañas WAI-ARIA: Tab entra a la pestaña activa; flechas, Inicio y Fin la cambian.
  const tabsRef = useRef<HTMLDivElement>(null)
  function onTabsKeyDown(e: KeyboardEvent) {
    const i = TEMPLATES.findIndex((t) => t.id === activo)
    const destino = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: TEMPLATES.length - 1 }[e.key]
    if (destino === undefined) return
    e.preventDefault()
    const t = TEMPLATES[(destino + TEMPLATES.length) % TEMPLATES.length]!
    setActivo(t.id)
    tabsRef.current?.querySelector<HTMLButtonElement>(`#cv-tab-${t.id}`)?.focus()
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
      <h2 id="cv-designs-title">Elige un diseño</h2>

      <div ref={tabsRef} className={s.designTabs} role="tablist" aria-labelledby="cv-designs-title" onKeyDown={onTabsKeyDown}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`cv-tab-${t.id}`}
            aria-selected={activo === t.id}
            aria-controls="cv-design-preview"
            tabIndex={activo === t.id ? 0 : -1}
            onClick={() => setActivo(t.id)}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      {/* En móvil la vista previa se recorta en altura; "Ver en grande" la muestra completa. */}
      <div id="cv-design-preview" role="tabpanel" aria-labelledby={`cv-tab-${activo}`} className={`${s.previewFrame} ${s.previewRecorte}`}>
        <div ref={ref} style={{ height: PAGE_HEIGHT * scale }}>
          <div className={s.previewPage} style={{ transform: `scale(${scale})` }}>
            <Component cv={cv} />
          </div>
        </div>
      </div>

      {faltanDatos && (
        <p className={s.notaIcono}>
          <Icon name="info" size={18} />
          Completa lo que está entre [ ] en el archivo Word.
        </p>
      )}

      {/* aria-disabled (no disabled) para que el foco no se pierda mientras se prepara el archivo. */}
      <div className={s.actions}>
        <button type="button" className="hds-btn hds-btn--primary" onClick={() => bajar('pdf')} aria-disabled={preparando !== null || undefined}>
          {preparando === 'pdf' ? <span className="hds-spinner" aria-hidden="true" /> : <Icon name="download" size={20} />}
          <span>{preparando === 'pdf' ? 'Preparando…' : 'Descargar PDF'}</span>
        </button>
        <button type="button" className="hds-btn hds-btn--secondary" onClick={() => bajar('docx')} aria-disabled={preparando !== null || undefined}>
          {preparando === 'docx' ? <span className="hds-spinner" aria-hidden="true" /> : <Icon name="file-text" size={20} />}
          <span>{preparando === 'docx' ? 'Preparando…' : 'Descargar Word'}</span>
        </button>
        <button type="button" className="hds-btn hds-btn--secondary" aria-expanded={correoAbierto} onClick={() => setCorreoAbierto((x) => !x)}>
          <Icon name="mail" size={20} />
          <span>Enviar a mi correo</span>
        </button>
        <button type="button" className="hds-btn hds-btn--ghost" onClick={() => setComparando(true)}>
          <Icon name="columns-2" size={20} />
          <span>Ver en grande</span>
        </button>
      </div>

      <p aria-live="polite" className="hds-visually-hidden">
        {preparando && `Preparando el archivo ${preparando === 'pdf' ? 'PDF' : 'Word'}…`}
      </p>
      {errorDescarga && (
        <Alert tone="error" title="No pudimos preparar el archivo">
          Inténtalo de nuevo en unos segundos.
        </Alert>
      )}

      {correoAbierto && (
        // key: al cambiar de diseño, el formulario se reinicia con el nuevo nombre.
        <EnvioCorreo
          key={activo}
          mailer={mailer}
          diseno={activo}
          nombreDiseno={template.nombre}
          nombrePersona={cv.nombre}
          emailSugerido={cv.contacto.email}
          generar={generar}
        />
      )}

      <Comparacion
        abierto={comparando}
        onCerrar={() => setComparando(false)}
        original={original}
        cv={cv}
        nombreDiseno={template.nombre}
        Diseno={Component}
      />
    </section>
  )
}
