import { useState } from 'react'
import type { CvAnalysis, Prioridad, Seccion } from '../services/types'
import s from '../styles/ui.module.css'

const SECCION_LABEL: Record<Seccion, string> = {
  contacto: 'Contacto',
  perfil: 'Perfil',
  experiencia: 'Experiencia',
  educacion: 'Formación',
  habilidades: 'Habilidades',
  idiomas: 'Idiomas',
  formato: 'Formato',
}

const PRIORIDAD_LABEL: Record<Prioridad, string> = { alta: 'Prioridad alta', media: 'Prioridad media', baja: 'Prioridad baja' }

type Filtro = 'todas' | Prioridad

export function FeedbackPanel({ analysis }: { analysis: CvAnalysis }) {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const visibles = analysis.sugerencias.filter((x) => filtro === 'todas' || x.prioridad === filtro)
  const nivel = analysis.puntaje >= 80 ? s.scoreAlto : analysis.puntaje >= 60 ? s.scoreMedio : s.scoreBajo

  return (
    <section className={s.panel} aria-labelledby="cv-feedback-title">
      <div className={s.scoreRow}>
        <div className={`${s.score} ${nivel}`} role="img" aria-label={`Puntaje ${analysis.puntaje} de 100`}>
          <span>{analysis.puntaje}</span>
          <small>/100</small>
        </div>
        <div>
          <h3 id="cv-feedback-title">Resultado del análisis</h3>
          <p>{analysis.resumen}</p>
        </div>
      </div>

      {analysis.fortalezas.length > 0 && (
        <div className={s.fortalezas}>
          <h4>Lo que ya hace bien</h4>
          <ul>
            {analysis.fortalezas.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={s.sugHeader}>
        <h4>Sugerencias ({analysis.sugerencias.length})</h4>
        <div className={s.segmented} role="group" aria-label="Filtrar por prioridad">
          {(['todas', 'alta', 'media', 'baja'] as Filtro[]).map((f) => (
            <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
              {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className={s.nota}>No hay sugerencias con esta prioridad.</p>
      ) : (
        <ol className={s.sugList}>
          {visibles.map((x) => (
            <li key={x.id} className={s.sug} data-prioridad={x.prioridad}>
              <div className={s.sugMeta}>
                <span className={s.chip} data-prioridad={x.prioridad}>
                  {PRIORIDAD_LABEL[x.prioridad]}
                </span>
                <span className={s.chipNeutral}>{SECCION_LABEL[x.seccion]}</span>
              </div>
              <p className={s.sugTitle}>{x.titulo}</p>
              <p>{x.detalle}</p>
              {x.ejemplo && (
                <p className={s.ejemplo}>
                  <strong>Ejemplo: </strong>
                  {x.ejemplo}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
