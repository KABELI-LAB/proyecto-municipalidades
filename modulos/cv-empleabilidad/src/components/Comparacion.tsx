import { Icon, IconButton, Loader, Tabs } from '@muni/design-system'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { renderOriginal, type VistaOriginal } from '../lib/renderOriginal'
import type { CvFileKind } from '../lib/validateFile'
import type { CvData } from '../services/types'
import s from '../styles/ui.module.css'
import type { TemplateProps } from '../templates'
import { useZoom } from '../lib/zoom'
import { ControlZoom, VistaPagina } from './Zoom'

interface Props {
  abierto: boolean
  onCerrar: () => void
  original: { archivo: File; tipo: CvFileKind }
  cv: CvData
  nombreDiseno: string
  Diseno: ComponentType<TemplateProps>
}

type Lado = 'original' | 'mejorado'

/**
 * Compara el CV que subió la persona con el diseño sugerido: lado a lado en
 * pantallas anchas y con pestañas en móvil. Diálogo nativo: Esc cierra, el foco
 * queda dentro y el resto de la página queda inactivo.
 */
export function Comparacion({ abierto, onCerrar, original, cv, nombreDiseno, Diseno }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [lado, setLado] = useState<Lado>('original')
  const zoom = useZoom()

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (abierto && !d.open) {
      if (typeof d.showModal === 'function') d.showModal()
      else d.setAttribute('open', '') // jsdom y navegadores antiguos
    } else if (!abierto && d.open) {
      if (typeof d.close === 'function') d.close()
      else d.removeAttribute('open')
    }
  }, [abierto])

  return (
    <dialog ref={dialogRef} className={s.comparacion} aria-labelledby="cv-comparacion-titulo" onClose={onCerrar} onCancel={onCerrar}>
      {/* Encabezado y pestañas en un solo bloque sticky: no se superponen si el título se parte. */}
      <div className={s.comparacionTop}>
        <div className={s.comparacionHead}>
          <div>
            <p className="hds-overline">Antes y después</p>
            <h2 id="cv-comparacion-titulo">Compara tu CV</h2>
          </div>
          <IconButton icon="x" label="Cerrar comparación" variant="ghost" onClick={onCerrar} />
        </div>

        <div className={s.comparacionTabs}>
        <Tabs
          items={[
            { id: 'original', label: 'Tu CV original', icon: 'file' },
            { id: 'mejorado', label: `Diseño ${nombreDiseno}`, icon: 'sparkles' },
          ]}
          value={lado}
          onChange={(id) => setLado(id as Lado)}
        />
        </div>
        <div className={s.comparacionZoom}>
          <ControlZoom zoom={zoom} etiqueta="Zoom de ambos CV" />
        </div>
      </div>

      {/* aria-live: en móvil, avisa qué lado se muestra al cambiar de pestaña. */}
      {abierto && (
        <div className={s.comparacionCuerpo} aria-live="polite">
          <section className={`${s.comparacionCol} ${lado === 'original' ? s.colActiva : ''}`} aria-label="Tu CV original">
            <h3 className={s.comparacionColTitulo}>
              <Icon name="file" size={18} /> Tu CV original
              <span className={s.fileName}>{original.archivo.name}</span>
            </h3>
            <Original archivo={original.archivo} tipo={original.tipo} nivel={zoom.nivel} />
          </section>
          <section className={`${s.comparacionCol} ${lado === 'mejorado' ? s.colActiva : ''}`} aria-label={`Diseño ${nombreDiseno} sugerido`}>
            <h3 className={s.comparacionColTitulo}>
              <Icon name="sparkles" size={18} /> Diseño {nombreDiseno} sugerido
            </h3>
            <div className={s.previewFrame}>
              <VistaPagina nivel={zoom.nivel} etiqueta={`Diseño ${nombreDiseno}`}>
                <Diseno cv={cv} />
              </VistaPagina>
            </div>
          </section>
        </div>
      )}
    </dialog>
  )
}

function Original({ archivo, tipo, nivel }: { archivo: File; tipo: CvFileKind; nivel: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState<VistaOriginal | 'error' | null>(null)

  useEffect(() => {
    let vivo = true
    const ancho = ref.current?.clientWidth ?? 600
    renderOriginal(archivo, tipo, ancho)
      .then((v) => vivo && setVista(v))
      .catch((err) => {
        console.error('[cv-empleabilidad] vista original', err)
        if (vivo) setVista('error')
      })
    return () => {
      vivo = false
    }
  }, [archivo, tipo])

  const ampliada = nivel > 1
  return (
    <div ref={ref} className={s.previewFrame}>
      {vista === null && <Loader label="Abriendo tu CV…" />}
      {vista === 'error' && <p className={s.nota}>No pudimos mostrar tu archivo original.</p>}
      {vista && vista !== 'error' && vista.tipo === 'pdf' && (
        <div
          className={`${s.zoomArea} ${ampliada ? s.zoomAmpliada : ''}`}
          {...(ampliada ? { tabIndex: 0, role: 'region', 'aria-label': 'Tu CV original ampliado. Usa las flechas para moverte.' } : {})}
        >
          {vista.paginas.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Página ${i + 1} de ${vista.paginas.length} de tu CV original`}
              className={s.paginaOriginal}
              style={ampliada ? { width: `${nivel * 100}%`, maxWidth: 'none' } : undefined}
            />
          ))}
        </div>
      )}
      {vista && vista !== 'error' && vista.tipo === 'docx' && (
        // sandbox="" : el documento no puede ejecutar scripts ni acceder al sitio. El zoom va como CSS dentro del documento.
        <iframe title="Tu CV original" sandbox="" srcDoc={conZoom(vista.html, nivel)} className={s.docxOriginal} />
      )}
    </div>
  )
}

const conZoom = (html: string, nivel: number) => (nivel === 1 ? html : html.replace('</head>', `<style>html{zoom:${nivel}}</style></head>`))
