import { Icon, IconButton, Loader, Tabs } from '@muni/design-system'
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { renderOriginal, type VistaOriginal } from '../lib/renderOriginal'
import { PAGE_HEIGHT, useFitScale } from '../lib/useFitScale'
import type { CvFileKind } from '../lib/validateFile'
import type { CvData } from '../services/types'
import s from '../styles/ui.module.css'
import type { TemplateProps } from '../templates'

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
      </div>

      {/* aria-live: en móvil, avisa qué lado se muestra al cambiar de pestaña. */}
      {abierto && (
        <div className={s.comparacionCuerpo} aria-live="polite">
          <section className={`${s.comparacionCol} ${lado === 'original' ? s.colActiva : ''}`} aria-label="Tu CV original">
            <h3 className={s.comparacionColTitulo}>
              <Icon name="file" size={18} /> Tu CV original
              <span className={s.fileName}>{original.archivo.name}</span>
            </h3>
            <Original archivo={original.archivo} tipo={original.tipo} />
          </section>
          <section className={`${s.comparacionCol} ${lado === 'mejorado' ? s.colActiva : ''}`} aria-label={`Diseño ${nombreDiseno} sugerido`}>
            <h3 className={s.comparacionColTitulo}>
              <Icon name="sparkles" size={18} /> Diseño {nombreDiseno} sugerido
            </h3>
            <Pagina>
              <Diseno cv={cv} />
            </Pagina>
          </section>
        </div>
      )}
    </dialog>
  )
}

function Pagina({ children }: { children: ReactNode }) {
  const { ref, scale } = useFitScale()
  return (
    <div className={s.previewFrame}>
      <div ref={ref} style={{ height: PAGE_HEIGHT * scale }}>
        <div className={s.previewPage} style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Original({ archivo, tipo }: { archivo: File; tipo: CvFileKind }) {
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

  return (
    <div ref={ref} className={s.previewFrame}>
      {vista === null && <Loader label="Abriendo tu CV…" />}
      {vista === 'error' && <p className={s.nota}>No pudimos mostrar tu archivo original.</p>}
      {vista && vista !== 'error' && vista.tipo === 'pdf' &&
        vista.paginas.map((src, i) => (
          <img key={i} src={src} alt={`Página ${i + 1} de ${vista.paginas.length} de tu CV original`} className={s.paginaOriginal} />
        ))}
      {vista && vista !== 'error' && vista.tipo === 'docx' && (
        // sandbox="" : el documento no puede ejecutar scripts ni acceder al sitio.
        <iframe title="Tu CV original" sandbox="" srcDoc={vista.html} className={s.docxOriginal} />
      )}
    </div>
  )
}
