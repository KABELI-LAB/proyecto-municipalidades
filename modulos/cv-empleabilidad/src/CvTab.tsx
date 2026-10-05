import { useEffect, useMemo, useRef, useState } from 'react'
import { DesignGallery } from './components/DesignGallery'
import { FeedbackPanel } from './components/FeedbackPanel'
import { UploadZone } from './components/UploadZone'
import { extractText } from './lib/extractText'
import { validateCvFile } from './lib/validateFile'
import { createDefaultAnalyzer } from './services/analyzer'
import type { CvAnalysis, CvAnalyzer } from './services/types'
import './styles/print.css'
import s from './styles/ui.module.css'

export interface CvTabProps {
  /** Analizador a usar. Por defecto: backend si VITE_CV_API_URL existe, si no el mock. */
  analyzer?: CvAnalyzer
}

type Estado =
  | { tipo: 'inicio' }
  | { tipo: 'leyendo'; archivo: string }
  | { tipo: 'analizando'; archivo: string }
  | { tipo: 'listo'; archivo: string; analysis: CvAnalysis }
  | { tipo: 'error'; mensaje: string }

const MIN_PALABRAS = 30

/**
 * Pestaña "Revisa tu CV". Componente autocontenido: no asume router ni estilos
 * globales del sitio anfitrión, solo las variables CSS del design system.
 */
export function CvTab({ analyzer }: CvTabProps) {
  const activeAnalyzer = useMemo(() => analyzer ?? createDefaultAnalyzer(), [analyzer])
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicio' })
  const abortRef = useRef<AbortController | null>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (estado.tipo === 'listo') resultRef.current?.focus()
  }, [estado.tipo])

  async function procesar(file: File) {
    const check = validateCvFile(file)
    if (!check.ok) {
      setEstado({ tipo: 'error', mensaje: check.error })
      return
    }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      setEstado({ tipo: 'leyendo', archivo: file.name })
      const texto = await extractText(file, check.kind)
      if (texto.split(/\s+/).filter(Boolean).length < MIN_PALABRAS) {
        setEstado({
          tipo: 'error',
          mensaje: 'No pudimos leer texto en el archivo. Si es un documento escaneado o una imagen, súbalo en Word o como PDF generado desde un procesador de texto.',
        })
        return
      }
      setEstado({ tipo: 'analizando', archivo: file.name })
      const analysis = await activeAnalyzer.analyze({ texto, nombreArchivo: file.name }, ctrl.signal)
      setEstado({ tipo: 'listo', archivo: file.name, analysis })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('[cv-empleabilidad]', err)
      setEstado({ tipo: 'error', mensaje: 'Ocurrió un problema al procesar su CV. Inténtelo nuevamente en unos minutos.' })
    }
  }

  const reiniciar = () => {
    abortRef.current?.abort()
    setEstado({ tipo: 'inicio' })
  }

  const ocupado = estado.tipo === 'leyendo' || estado.tipo === 'analizando'

  return (
    <div className={s.root}>
      <header className={s.intro}>
        <p className={s.eyebrow}>
          <span className={s.eyebrowBar} aria-hidden="true" />
          Empleabilidad
        </p>
        <h2>Revise y mejore su currículum</h2>
        <p className={s.lead}>Suba su CV y reciba sugerencias concretas para mejorarlo, junto con tres diseños listos para descargar.</p>
        <ol className={s.steps}>
          <li><span>1</span>Suba su CV en PDF o Word</li>
          <li><span>2</span>Revise las sugerencias</li>
          <li><span>3</span>Elija un diseño y descárguelo</li>
        </ol>
      </header>

      {estado.tipo !== 'listo' && (
        <>
          <UploadZone onFile={procesar} disabled={ocupado} />
          <p className={s.nota}>
            Su CV se procesa en su navegador y no se almacena.
            {/* TODO(ia): al conectar el backend, actualizar este aviso: el texto se enviará al servicio de análisis. */}
          </p>
        </>
      )}

      <div aria-live="polite" className={s.status}>
        {estado.tipo === 'leyendo' && <p className={s.loading}>Leyendo {estado.archivo}…</p>}
        {estado.tipo === 'analizando' && <p className={s.loading}>Analizando su CV…</p>}
        {estado.tipo === 'error' && (
          <div className={s.alert} role="alert">
            <strong>No pudimos analizar el archivo.</strong> {estado.mensaje}
          </div>
        )}
      </div>

      {estado.tipo === 'listo' && (
        <>
          <div className={s.resultBar}>
            <h3 ref={resultRef} tabIndex={-1}>
              Resultados para <span className={s.fileName}>{estado.archivo}</span>
            </h3>
            <button type="button" className={s.btnSecondary} onClick={reiniciar}>
              Analizar otro CV
            </button>
          </div>
          {estado.analysis.origen === 'mock' && (
            <p className={s.mockBanner}>Modo demostración: el análisis usa reglas automáticas, no inteligencia artificial.</p>
          )}
          <div className={s.results}>
            <FeedbackPanel analysis={estado.analysis} />
            <DesignGallery cv={estado.analysis.cvMejorado} />
          </div>
        </>
      )}
    </div>
  )
}
