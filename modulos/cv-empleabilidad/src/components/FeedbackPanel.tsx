import { Icon } from '@muni/design-system'
import { useState } from 'react'
import type { CvAnalysis, Prioridad } from '../services/types'
import s from '../styles/ui.module.css'

/**
 * Resultado pensado para personas que leen poco o usan poco la tecnología.
 * Se divide en dos piezas: el veredicto (va arriba, en una línea) y las ideas
 * para mejorar (van después del CV mejorado, que es lo principal).
 */

const VISIBLES = 3
const ORDEN: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 }

function veredicto(puntaje: number) {
  if (puntaje >= 80) return { texto: 'Tu CV va muy bien', icono: 'circle-check', tono: 'green' as const }
  if (puntaje >= 60) return { texto: 'Tu CV va bien', icono: 'circle-check', tono: 'blue' as const }
  return { texto: 'Tu CV necesita mejoras', icono: 'circle-alert', tono: 'yellow' as const }
}

/** Veredicto en palabras (sin puntaje numérico) y la frase de qué hacer primero. */
export function Veredicto({ analysis }: { analysis: CvAnalysis }) {
  const v = veredicto(analysis.puntaje)
  return (
    <section className={s.veredicto} aria-labelledby="cv-veredicto-title">
      <span className={`hds-tile-icon hds-tile-icon--${v.tono}`}>
        <Icon name={v.icono} size={24} />
      </span>
      <div>
        <h2 id="cv-veredicto-title">{v.texto}</h2>
        <p className={s.textoSecundario}>{analysis.resumen}</p>
      </div>
    </section>
  )
}

/** Lo que ya hace bien + máximo 3 ideas a la vista; el resto a un toque. */
export function Sugerencias({ analysis }: { analysis: CvAnalysis }) {
  const [verTodas, setVerTodas] = useState(false)
  const sugerencias = [...analysis.sugerencias].sort((a, b) => ORDEN[a.prioridad] - ORDEN[b.prioridad])
  const visibles = verTodas ? sugerencias : sugerencias.slice(0, VISIBLES)
  const ocultas = sugerencias.length - VISIBLES

  if (sugerencias.length === 0 && analysis.fortalezas.length === 0) return null

  return (
    <section className={`${s.panel} ${s.ideas}`} aria-labelledby="cv-ideas-title">
      <h2 id="cv-ideas-title">Ideas para mejorarlo más</h2>

      {analysis.fortalezas.length > 0 && (
        <ul className={`hds-list ${s.fortalezas}`} aria-label="Lo que ya haces bien">
          {analysis.fortalezas.slice(0, 2).map((f) => (
            <li key={f}>
              <Icon name="check" size={20} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {sugerencias.length > 0 && (
        <div className={s.mejoras}>
          <ol className={s.sugList}>
            {visibles.map((x, i) => (
              <li key={x.id} className={s.sug}>
                <span className={s.sugNumero} aria-hidden="true">
                  {i + 1}
                </span>
                <div className={s.sugCuerpo}>
                  <p>
                    <strong>{x.titulo}.</strong> {x.detalle}
                  </p>
                  {x.ejemplo && (
                    <details className={s.ejemplo}>
                      <summary>Ver ejemplo</summary>
                      <p>{x.ejemplo}</p>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {ocultas > 0 && (
            <button type="button" className="hds-btn hds-btn--ghost" aria-expanded={verTodas} onClick={() => setVerTodas((x) => !x)}>
              <Icon name={verTodas ? 'chevron-up' : 'chevron-down'} size={20} />
              <span>{verTodas ? 'Ver menos' : `Ver ${ocultas} ${ocultas === 1 ? 'idea más' : 'ideas más'}`}</span>
            </button>
          )}
        </div>
      )}
    </section>
  )
}
