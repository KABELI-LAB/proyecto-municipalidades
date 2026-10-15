import { Alert, Button } from '@muni/design-system'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DesignGallery } from './components/DesignGallery'
import { Sugerencias, Veredicto } from './components/FeedbackPanel'
import { Progreso } from './components/Progreso'
import { UploadZone } from './components/UploadZone'
import { extractText } from './lib/extractText'
import { validateCvFile, type CvFileKind } from './lib/validateFile'
import { createDefaultAnalyzer } from './services/analyzer'
import { createDefaultMailer, type CvMailer } from './services/mailer'
import { AnalisisError, type CvAnalysis, type CvAnalyzer } from './services/types'
import s from './styles/ui.module.css'

export interface CvTabProps {
  /** Analizador a usar. Por defecto: backend si VITE_CV_API_URL existe, si no el mock. */
  analyzer?: CvAnalyzer
  /** Envío del CV por correo. Por defecto: backend si VITE_CV_API_URL existe, si no uno simulado. */
  mailer?: CvMailer
}

type Estado =
  | { tipo: 'inicio' }
  | { tipo: 'leyendo'; archivo: string }
  | { tipo: 'analizando'; archivo: string }
  /** original: el archivo subido se conserva en memoria solo para compararlo. */
  | { tipo: 'listo'; archivo: string; analysis: CvAnalysis; original: { archivo: File; tipo: CvFileKind } }
  | { tipo: 'noCv'; archivo: string; motivo: string }
  | { tipo: 'error'; mensaje: string }

const MIN_PALABRAS = 30

/**
 * Pestaña "Revisa tu CV". Componente autocontenido: no asume router ni estilos
 * globales del sitio anfitrión; usa los tokens y componentes del design system.
 */
export function CvTab({ analyzer, mailer }: CvTabProps) {
  const activeAnalyzer = useMemo(() => analyzer ?? createDefaultAnalyzer(), [analyzer])
  const activeMailer = useMemo(() => mailer ?? createDefaultMailer(), [mailer])
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicio' })
  const abortRef = useRef<AbortController | null>(null)
  const resultRef = useRef<HTMLParagraphElement>(null)
  // El módulo aporta el <h1> de su página: el sitio anfitrión no agrega otro.

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
      const { texto, imagenes } = await extractText(file, check.kind)
      if (texto.split(/\s+/).filter(Boolean).length < MIN_PALABRAS) {
        setEstado({
          tipo: 'error',
          mensaje: 'No encontramos texto en tu archivo. Si es un documento escaneado o una foto, súbelo en Word o como PDF creado desde un procesador de texto.',
        })
        return
      }
      setEstado({ tipo: 'analizando', archivo: file.name })
      const resultado = await activeAnalyzer.analyze({ texto, nombreArchivo: file.name, imagenes }, ctrl.signal)
      if (!resultado.esCv) {
        setEstado({ tipo: 'noCv', archivo: file.name, motivo: resultado.motivo })
        return
      }
      setEstado({ tipo: 'listo', archivo: file.name, analysis: resultado, original: { archivo: file, tipo: check.kind } })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (err instanceof AnalisisError) {
        setEstado({ tipo: 'error', mensaje: err.message })
        return
      }
      console.error('[cv-empleabilidad]', err)
      setEstado({ tipo: 'error', mensaje: 'Tuvimos un problema al revisar tu CV. Inténtalo de nuevo en unos minutos.' })
    }
  }

  const reiniciar = () => {
    abortRef.current?.abort()
    setEstado({ tipo: 'inicio' })
  }

  const ocupado = estado.tipo === 'leyendo' || estado.tipo === 'analizando'

  return (
    <div className={`${s.root} ${estado.tipo === 'listo' ? s.rootCompacto : ''}`}>
      {estado.tipo === 'listo' ? (
        // Con resultados, la cabecera se reduce a una línea para que el contenido quede arriba.
        <header className={s.cabeceraCompacta}>
          <h1>Mejora tu CV</h1>
          {/* Destino del foco al terminar: anuncia que hay resultados. */}
          <p ref={resultRef} tabIndex={-1} className={s.resultArchivo}>
            {estado.archivo}
          </p>
          <Button variant="ghost" size="sm" iconLeft="rotate-ccw" onClick={reiniciar}>
            Otro CV
          </Button>
        </header>
      ) : (
        <header className={s.intro}>
          <p className="hds-overline">Empleabilidad</p>
          <h1>Mejora tu CV</h1>
          <p className={s.lead}>Súbelo y te decimos qué mejorar. Es gratis.</p>
        </header>
      )}

      {/* Mientras se revisa, la zona de carga se reemplaza por una pantalla de espera con pasos. */}
      {(estado.tipo === 'leyendo' || estado.tipo === 'analizando') && <Progreso etapa={estado.tipo} archivo={estado.archivo} />}

      {(estado.tipo === 'inicio' || estado.tipo === 'noCv' || estado.tipo === 'error') && (
        <>
          <UploadZone onFile={procesar} disabled={ocupado} />
          <p className={s.nota}>{activeAnalyzer.avisoPrivacidad ?? 'No guardamos tu CV.'}</p>
        </>
      )}

      {/* Loader y Alert ya anuncian su contenido (role=status / role=alert). */}
      <div className={s.status}>
        {estado.tipo === 'noCv' && (
          <Alert tone="warning" title="Este archivo no parece un CV">
            {estado.motivo} Prueba con otro archivo.
          </Alert>
        )}
        {estado.tipo === 'error' && (
          <Alert tone="error" title="No pudimos revisar tu archivo">
            {estado.mensaje}
          </Alert>
        )}
      </div>

      {estado.tipo === 'listo' && (
        <>
          {estado.analysis.origen === 'mock' && (
            <p className={s.notaDemo}>Modo demostración: análisis con reglas automáticas, sin inteligencia artificial.</p>
          )}
          {/* Orden: veredicto → CV mejorado (lo principal) → ideas. En escritorio, el CV va a la izquierda. */}
          <div className={s.results}>
            <div className={s.areaVeredicto}>
              <Veredicto analysis={estado.analysis} />
            </div>
            <div className={s.areaCv}>
              <DesignGallery cv={estado.analysis.cvMejorado} mailer={activeMailer} original={estado.original} />
            </div>
            <div className={s.areaIdeas}>
              <Sugerencias analysis={estado.analysis} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
