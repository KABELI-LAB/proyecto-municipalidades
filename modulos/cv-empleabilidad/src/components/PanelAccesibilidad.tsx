import { Button, Icon, IconButton, Switch } from '@muni/design-system'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { opcionesActivas, PREFERENCIAS_INICIALES, type PreferenciasAccesibilidad, type TamanoTexto } from '../lib/accesibilidad'
import a from '../styles/accesibilidad.module.css'

/*
 * Botón "Accesibilidad" con un panel desplegable (no modal). Mismo archivo en
 * cv-empleabilidad y registro-emergencia (mantener en sincronía).
 */

interface Props {
  preferencias: PreferenciasAccesibilidad
  onCambiar: (cambios: Partial<PreferenciasAccesibilidad>) => void
  /** Botón más bajo (área táctil de 48px igual) para filas apretadas, como la del cuestionario en celular. */
  compacto?: boolean
}

const TAMANOS: { id: TamanoTexto; nombre: string }[] = [
  { id: 'normal', nombre: 'Normal' },
  { id: 'grande', nombre: 'Grande' },
  { id: 'muyGrande', nombre: 'Muy grande' },
]

type CambioSwitch = { target: { checked: boolean } }

export function PanelAccesibilidad({ preferencias: p, onCambiar, compacto = false }: Props) {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const ids = { panel: useId(), titulo: useId(), tamano: useId() }
  const activas = opcionesActivas(p)

  const cerrar = (devolverFoco = true) => {
    setAbierto(false)
    if (devolverFoco) botonRef.current?.focus()
  }

  // Tocar fuera del panel lo cierra (sin mover el foco).
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: PointerEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [abierto])

  const [anuncio, setAnuncio] = useState('')
  const restablecer = () => {
    onCambiar(PREFERENCIAS_INICIALES)
    setAnuncio('Restablecimos las opciones de accesibilidad.')
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && abierto) {
      e.stopPropagation()
      cerrar()
    }
  }

  const interruptor = (clave: 'contraste' | 'subrayarEnlaces' | 'espaciado' | 'menosMovimiento', etiqueta: string) => (
    <Switch label={etiqueta} checked={p[clave]} onChange={(e: CambioSwitch) => onCambiar({ [clave]: e.target.checked })} />
  )

  return (
    <div ref={contenedorRef} className={a.contenedor} onKeyDown={onKeyDown}>
      <button
        ref={botonRef}
        type="button"
        className={`hds-btn hds-btn--secondary ${compacto ? a.botonCompacto : ''}`}
        aria-expanded={abierto}
        aria-controls={ids.panel}
        onClick={() => setAbierto((v) => !v)}
      >
        <Icon name="accessibility" size={20} />
        <span className={a.etiqueta}>Accesibilidad</span>{' '}
        {activas > 0 && (
          <>
            <span className={a.contador} aria-hidden="true">
              {activas}
            </span>
            <span className="hds-visually-hidden">{`${activas} ${activas === 1 ? 'opción activa' : 'opciones activas'}`}</span>
          </>
        )}
      </button>

      <section id={ids.panel} aria-labelledby={ids.titulo} className={a.panel} hidden={!abierto}>
        <div className={a.cabecera}>
          <p id={ids.titulo} className={a.titulo}>
            Opciones de accesibilidad
          </p>
          <IconButton icon="x" label="Cerrar opciones de accesibilidad" onClick={() => cerrar()} />
        </div>

        <fieldset className={a.grupo}>
          <legend className={a.leyenda}>Tamaño del texto</legend>
          <div className={a.tamanos}>
            {TAMANOS.map((t, i) => (
              <label key={t.id} className={a.tamano}>
                <input type="radio" name={ids.tamano} value={t.id} checked={p.texto === t.id} onChange={() => onCambiar({ texto: t.id })} />
                <span className={a.muestra} style={{ fontSize: 16 + i * 4 }} aria-hidden="true">
                  A
                </span>
                <span>{t.nombre}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={a.interruptores}>
          {interruptor('contraste', 'Alto contraste')}
          {interruptor('subrayarEnlaces', 'Subrayar enlaces')}
          {interruptor('espaciado', 'Más espacio entre letras y líneas')}
          {interruptor('menosMovimiento', 'Menos movimiento')}
        </div>

        {/* Siempre visible: si desapareciera al usarlo, el foco se perdería. */}
        <Button variant="ghost" iconLeft="rotate-ccw" onClick={restablecer}>
          Restablecer opciones
        </Button>
        <p className="hds-visually-hidden" aria-live="polite">
          {anuncio}
        </p>
      </section>
    </div>
  )
}
