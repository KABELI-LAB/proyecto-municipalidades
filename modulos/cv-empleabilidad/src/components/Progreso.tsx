import { Icon } from '@muni/design-system'
import s from '../styles/ui.module.css'

type Etapa = 'leyendo' | 'analizando'

const PASOS: { id: Etapa | 'disenos'; texto: string }[] = [
  { id: 'leyendo', texto: 'Leyendo tu archivo' },
  { id: 'analizando', texto: 'Revisando tu CV' },
  { id: 'disenos', texto: 'Preparando tus diseños' },
]

/**
 * Pantalla de espera: la revisión puede tardar unos 20 segundos, así que se
 * muestra qué está pasando en vez de un spinner suelto.
 */
export function Progreso({ etapa, archivo }: { etapa: Etapa; archivo: string }) {
  const actual = PASOS.findIndex((p) => p.id === etapa)
  return (
    <section className={s.progreso} role="status" aria-live="polite" aria-label="Revisando tu CV">
      <div className="hds-progress hds-progress--lg hds-progress--indeterminate" aria-hidden="true">
        <div className="hds-progress__bar" />
      </div>
      <ol className={s.progresoPasos}>
        {PASOS.map((p, i) => {
          const estado = i < actual ? 'listo' : i === actual ? 'actual' : 'pendiente'
          return (
            <li key={p.id} data-estado={estado}>
              <span className={s.progresoMarca} aria-hidden="true">
                {estado === 'listo' ? <Icon name="check" size={16} /> : i + 1}
              </span>
              <span>
                {p.texto}
                {estado === 'actual' && '…'}
                {estado === 'listo' && <span className="hds-visually-hidden"> (listo)</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <p className={s.nota}>
        {archivo} · Puede tardar hasta 30 segundos.
      </p>
    </section>
  )
}
