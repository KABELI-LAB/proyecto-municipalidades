import { Icon } from '@muni/design-system'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { esRutValido, formatearRut, limpiarRut } from '../../shared/rut.ts'
import s from '../styles/cuestionario.module.css'

// ── Contador − / + ───────────────────────────────────────────────────────────

interface ContadorProps {
  etiqueta: string
  valor: number
  onChange: (v: number) => void
  min?: number
  max?: number
  /** Texto bajo la etiqueta, ej. "Incluyéndote a ti". */
  ayuda?: string
}

/** Contador grande (objetivo táctil ≥ 56px). Las flechas del teclado también cambian el valor. */
export function Contador({ etiqueta, valor, onChange, min = 0, max = 20, ayuda }: ContadorProps) {
  const id = useId()
  const cambiar = (d: number) => onChange(Math.min(max, Math.max(min, valor + d)))
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      cambiar(1)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      cambiar(-1)
    }
  }
  return (
    <div className={s.contador}>
      <div className={s.contadorTexto}>
        <span id={id} className={s.contadorEtiqueta}>
          {etiqueta}
        </span>
        {ayuda && <span className={s.ayuda}>{ayuda}</span>}
      </div>
      <div className={s.contadorControles} role="group" aria-labelledby={id} onKeyDown={onKeyDown}>
        <button type="button" className={s.contadorBtn} onClick={() => cambiar(-1)} disabled={valor <= min} aria-label={`Quitar uno: ${etiqueta}`}>
          <Icon name="minus" size={28} />
        </button>
        {/* key: el número "salta" al cambiar (animación CSS). */}
        <output key={valor} className={s.contadorValor} aria-live="polite" aria-label={`${etiqueta}: ${valor}`}>
          {valor}
        </output>
        <button type="button" className={s.contadorBtn} onClick={() => cambiar(1)} disabled={valor >= max} aria-label={`Agregar uno: ${etiqueta}`}>
          <Icon name="plus" size={28} />
        </button>
      </div>
    </div>
  )
}

// ── Tarjetas de opción ───────────────────────────────────────────────────────

export interface Opcion<T extends string> {
  valor: T
  etiqueta: string
  descripcion?: string
  icono?: string
}

interface OpcionesProps<T extends string> {
  nombre: string
  opciones: Opcion<T>[]
  valor: T | null
  /** `avanzar` es false cuando se eligió con las flechas del teclado (solo mueve la selección). */
  onElegir: (v: T, avanzar: boolean) => void
  etiquetaGrupo: string
  columnas?: 1 | 2
}

const FLECHAS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

/** Opción única como tarjetas grandes (radio nativo, navegable con flechas). */
export function Opciones<T extends string>({ nombre, opciones, valor, onElegir, etiquetaGrupo, columnas = 1 }: OpcionesProps<T>) {
  const conFlechas = useRef(false)
  return (
    <fieldset
      className={s.opciones}
      data-columnas={columnas}
      onKeyDown={(e) => {
        conFlechas.current = FLECHAS.includes(e.key)
      }}
    >
      <legend className={s.srOnly}>{etiquetaGrupo}</legend>
      {opciones.map((o) => (
        <label key={o.valor} className={s.opcion} data-elegida={valor === o.valor || undefined}>
          <input
            type="radio"
            name={nombre}
            value={o.valor}
            checked={valor === o.valor}
            onChange={() => {
              onElegir(o.valor, !conFlechas.current)
              conFlechas.current = false
            }}
            // Un clic sobre la opción ya elegida también avanza.
            onClick={() => valor === o.valor && onElegir(o.valor, true)}
            className={s.opcionInput}
          />
          {o.icono && (
            <span className={s.opcionIcono}>
              <Icon name={o.icono} size={24} />
            </span>
          )}
          <span className={s.opcionTexto}>
            <span className={s.opcionEtiqueta}>{o.etiqueta}</span>
            {o.descripcion && <span className={s.ayuda}>{o.descripcion}</span>}
          </span>
          <span className={s.opcionCheck} aria-hidden="true">
            <Icon name="check" size={20} />
          </span>
        </label>
      ))}
    </fieldset>
  )
}

/** Casilla múltiple con el mismo aspecto que las tarjetas de opción. */
export function OpcionMultiple({ etiqueta, descripcion, icono, marcada, onChange, children }: {
  etiqueta: string
  descripcion?: string
  icono?: string
  marcada: boolean
  onChange: (v: boolean) => void
  children?: ReactNode
}) {
  return (
    <div className={s.opcionMultiple} data-elegida={marcada || undefined}>
      <label className={s.opcion} data-elegida={marcada || undefined}>
        <input type="checkbox" checked={marcada} onChange={(e) => onChange(e.target.checked)} className={s.opcionInput} />
        {icono && (
          <span className={s.opcionIcono}>
            <Icon name={icono} size={24} />
          </span>
        )}
        <span className={s.opcionTexto}>
          <span className={s.opcionEtiqueta}>{etiqueta}</span>
          {descripcion && <span className={s.ayuda}>{descripcion}</span>}
        </span>
        <span className={s.opcionCheck} aria-hidden="true">
          <Icon name="check" size={20} />
        </span>
      </label>
      {marcada && children}
    </div>
  )
}

// ── Campo de texto grande ────────────────────────────────────────────────────

interface CampoProps {
  id: string
  etiqueta: string
  valor: string
  onChange: (v: string) => void
  error?: string | null
  ayuda?: string
  tipo?: 'text' | 'tel'
  inputMode?: 'text' | 'numeric' | 'tel'
  autoComplete?: string
  placeholder?: string
  /** Contenido a la derecha dentro del campo (ej. check de RUT válido). */
  sufijo?: ReactNode
  opcional?: boolean
  maxLength?: number
}

export function Campo({ id, etiqueta, valor, onChange, error, ayuda, tipo = 'text', inputMode, autoComplete, placeholder, sufijo, opcional, maxLength }: CampoProps) {
  const desc = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`hds-field ${s.campo}`}>
      <label className="hds-label" htmlFor={id}>
        {etiqueta}
        {opcional && <span className="hds-label__opt"> (opcional)</span>}
      </label>
      {ayuda && (
        <span className="hds-hint" id={`${id}-ayuda`}>
          {ayuda}
        </span>
      )}
      <div className={`hds-control ${s.control}`}>
        <input
          id={id}
          className={`hds-input ${s.input}`}
          type={tipo}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={valor}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={desc}
        />
        {sufijo && <span className={s.sufijo}>{sufijo}</span>}
      </div>
      {error && (
        <span className="hds-error-msg" id={`${id}-error`} role="alert">
          <Icon name="circle-alert" size={18} />
          {error}
        </span>
      )}
    </div>
  )
}

/** RUT con formato y validación del dígito verificador mientras se escribe. */
export function CampoRut({ id, valor, onChange, intentoAvanzar }: { id: string; valor: string; onChange: (v: string) => void; intentoAvanzar: boolean }) {
  const [tocado, setTocado] = useState(false)
  const limpio = limpiarRut(valor)
  const valido = esRutValido(valor)
  const completo = limpio.length >= 8
  const mostrarError = !valido && (intentoAvanzar || (tocado && completo))
  return (
    <Campo
      id={id}
      etiqueta="RUT del jefe o jefa de hogar"
      ayuda="Con dígito verificador. Ej: 12.345.678-5"
      valor={valor}
      onChange={(v) => {
        setTocado(true)
        onChange(formatearRut(v))
      }}
      inputMode="text"
      autoComplete="off"
      placeholder="12.345.678-5"
      maxLength={12}
      error={mostrarError ? 'Revisa tu RUT: el dígito verificador no coincide.' : null}
      sufijo={
        valido ? (
          <span className={s.rutOk} role="status">
            <Icon name="circle-check" size={24} />
            <span className={s.srOnly}>RUT válido</span>
          </span>
        ) : null
      }
    />
  )
}
