import { Alert, Button, Loader } from '@muni/design-system'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DesignGallery } from './components/DesignGallery'
import { FeedbackPanel } from './components/FeedbackPanel'
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
  const resultRef = useRef<HTMLHeadingElement>(null)
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
    <div className={s.root}>
      <header className={s.intro}>
        <p className="hds-overline">Empleabilidad</p>
        <h1>Revisa y mejora tu currículum</h1>
        <p className={s.lead}>Sube tu CV y recibe sugerencias concretas para mejorarlo, junto con tres diseños listos para descargar.</p>
        <ol className={s.steps}>
          <li>
            <span aria-hidden="true">1</span>Sube tu CV en PDF o Word
          </li>
          <li>
            <span aria-hidden="true">2</span>Revisa las sugerencias
          </li>
          <li>
            <span aria-hidden="true">3</span>Elige un diseño y recíbelo por correo
          </li>
        </ol>
      </header>

      {estado.tipo !== 'listo' && (
        <>
          <UploadZone onFile={procesar} disabled={ocupado} />
          <p className={s.nota}>{activeAnalyzer.avisoPrivacidad ?? 'No guardamos tu CV.'}</p>
        </>
      )}

      {/* Loader y Alert ya anuncian su contenido (role=status / role=alert). */}
      <div className={s.status}>
        {estado.tipo === 'leyendo' && <Loader label={`Leyendo ${estado.archivo}…`} />}
        {estado.tipo === 'analizando' && <Loader label="Revisando tu CV. Puede tardar hasta un minuto…" />}
        {estado.tipo === 'noCv' && (
          <Alert tone="warning" title={`“${estado.archivo}” no parece ser un currículum`}>
            {estado.motivo} Si es tu CV, revisa que tenga tus datos de contacto, tu experiencia y tu formación. También puedes subir otro archivo.
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
          <div className={s.resultBar}>
            <h2 ref={resultRef} tabIndex={-1}>
              Resultados para <span className={s.fileName}>{estado.archivo}</span>
            </h2>
            <Button variant="secondary" iconLeft="rotate-ccw" onClick={reiniciar}>
              Revisar otro CV
            </Button>
          </div>
          {estado.analysis.origen === 'mock' && (
            <Alert tone="info" title="Modo demostración">
              Este análisis usa reglas automáticas, no inteligencia artificial.
            </Alert>
          )}
          <div className={s.results}>
            <FeedbackPanel analysis={estado.analysis} />
            <DesignGallery cv={estado.analysis.cvMejorado} mailer={activeMailer} original={estado.original} />
          </div>
        </>
      )}
    </div>
  )
}
