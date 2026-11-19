import { Icon } from '@muni/design-system'
import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { sugerir, type IndiceLugares, type Sugerencia } from '../lib/lugares'
import s from '../styles/cuestionario.module.css'

interface Props {
  id: string
  valor: string
  onChange: (v: string) => void
  /** Se eligió una sugerencia (calle o lugar), con su punto en el mapa. */
  onElegir: (s: Sugerencia) => void
  /** Calles y lugares de la comuna; null mientras carga (el campo funciona igual). */
  indice: IndiceLugares | null
  error: string | null
}

/**
 * Dirección con sugerencias de calles y lugares de la comuna mientras se escribe
 * (patrón combobox de WAI-ARIA). Se puede escribir cualquier referencia: en el
 * campo hay casas sin calle con nombre, así que elegir una sugerencia es opcional.
 */
export function CampoDireccion({ id, valor, onChange, onElegir, indice, error }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [activa, setActiva] = useState(-1)
  const lista = useId()
  const sugerencias = useMemo(() => (indice && abierto ? sugerir(indice, valor) : []), [indice, abierto, valor])
  const visible = abierto && sugerencias.length > 0

  const elegir = (sug: Sugerencia) => {
    onElegir(sug)
    setAbierto(false)
    setActiva(-1)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!abierto) setAbierto(true)
      const n = sugerencias.length
      if (n) setActiva((i) => (e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n))
    } else if (e.key === 'Enter' && visible && activa >= 0) {
      // Con una sugerencia marcada, Enter la elige (y no avanza a la siguiente pregunta).
      e.preventDefault()
      elegir(sugerencias[activa]!)
    } else if (e.key === 'Escape' && visible) {
      e.stopPropagation()
      setAbierto(false)
      setActiva(-1)
    }
  }

  return (
    <div className={`hds-field ${s.campo}`}>
      <label className="hds-label" htmlFor={id}>
        Dirección
      </label>
      <div className={s.combo}>
        <input
          id={id}
          className={`hds-input ${s.input}`}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={lista}
          aria-activedescendant={visible && activa >= 0 ? `${lista}-${activa}` : undefined}
          autoComplete="off"
          placeholder="Ej: Arturo Prat 123"
          maxLength={200}
          value={valor}
          onChange={(e) => {
            onChange(e.target.value)
            setAbierto(true)
            setActiva(-1)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={onKeyDown}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <ul id={lista} role="listbox" aria-label="Direcciones sugeridas" className={s.sugerencias} hidden={!visible}>
          {sugerencias.map((sug, i) => (
            <li
              key={`${sug.tipo}-${sug.texto}-${sug.detalle}`}
              id={`${lista}-${i}`}
              role="option"
              aria-selected={i === activa}
              className={s.sugerencia}
              // mousedown (no click): elegir antes de que el campo pierda el foco y cierre la lista.
              onMouseDown={(e) => {
                e.preventDefault()
                elegir(sug)
              }}
            >
              <Icon name={sug.tipo === 'calle' ? 'map-pin' : 'house'} size={20} />
              <span className={s.sugerenciaTexto}>
                <span>{sug.texto}</span>
                <span className={s.sugerenciaDetalle}>{sug.detalle}</span>
              </span>
            </li>
          ))}
          <li role="presentation" className={s.sugerenciasFuente}>
            Calles de OpenStreetMap
          </li>
        </ul>
      </div>
      <span className={s.srOnly} aria-live="polite">
        {visible ? `${sugerencias.length} ${sugerencias.length === 1 ? 'sugerencia' : 'sugerencias'}. Usa las flechas para elegir.` : ''}
      </span>
      {error && (
        <span className="hds-error-msg" id={`${id}-error`} role="alert">
          <Icon name="circle-alert" size={18} />
          {error}
        </span>
      )}
    </div>
  )
}
