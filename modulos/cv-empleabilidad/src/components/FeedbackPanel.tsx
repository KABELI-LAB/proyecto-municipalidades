import { Badge, Icon } from '@muni/design-system'
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

// Lógica de color del design system: rojo = urgente, amarillo = atención, azul = información.
const PRIORIDAD: Record<Prioridad, { label: string; tone: 'red' | 'yellow' | 'blue' }> = {
  alta: { label: 'Prioridad alta', tone: 'red' },
  media: { label: 'Prioridad media', tone: 'yellow' },
  baja: { label: 'Prioridad baja', tone: 'blue' },
}

type Filtro = 'todas' | Prioridad
const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'alta', label: 'Alta' },
  { id: 'media', label: 'Media' },
  { id: 'baja', label: 'Baja' },
]

function nivel(puntaje: number) {
  if (puntaje >= 80) return { texto: 'Casi listo', tone: 'green' as const }
  if (puntaje >= 60) return { texto: 'Buena base', tone: 'blue' as const }
  return { texto: 'Necesita mejoras', tone: 'yellow' as const }
}

export function FeedbackPanel({ analysis }: { analysis: CvAnalysis }) {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const visibles = analysis.sugerencias.filter((x) => filtro === 'todas' || x.prioridad === filtro)
  const n = nivel(analysis.puntaje)

  return (
    <section className={s.panel} aria-labelledby="cv-feedback-title">
      <h2 id="cv-feedback-title">Resultado del análisis</h2>

      <div className={s.puntaje}>
        <div className={s.puntajeFila}>
          <span className={s.puntajeValor} aria-hidden="true">
            {analysis.puntaje}
            <span>/100</span>
          </span>
          <Badge tone={n.tone}>{n.texto}</Badge>
        </div>
        <div
          className="hds-progress hds-progress--lg"
          role="progressbar"
          aria-label="Puntaje del CV"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={analysis.puntaje}
        >
          <div className="hds-progress__bar" style={{ width: `${analysis.puntaje}%` }} />
        </div>
        <p>{analysis.resumen}</p>
      </div>

      {analysis.fortalezas.length > 0 && (
        <div className={s.fortalezas}>
          <h3>Lo que ya haces bien</h3>
          <ul className="hds-list">
            {analysis.fortalezas.map((f) => (
              <li key={f}>
                <Icon name="circle-check" size={20} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={s.sugHeader}>
        <h3>Sugerencias ({analysis.sugerencias.length})</h3>
        <div className="hds-chips" role="group" aria-label="Filtrar por prioridad">
          {FILTROS.map((f) => (
            <button key={f.id} type="button" className={`hds-chip ${s.chip}`} aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="hds-visually-hidden" aria-live="polite">
        {filtro === 'todas'
          ? `Mostrando las ${visibles.length} sugerencias`
          : `Mostrando ${visibles.length} ${visibles.length === 1 ? 'sugerencia' : 'sugerencias'} de prioridad ${filtro}`}
      </p>

      {visibles.length === 0 ? (
        <p className={s.nota}>No hay sugerencias con esta prioridad.</p>
      ) : (
        <ol className={s.sugList}>
          {visibles.map((x) => (
            <li key={x.id} className={s.sug}>
              <div className={s.sugMeta}>
                <Badge tone={PRIORIDAD[x.prioridad].tone}>{PRIORIDAD[x.prioridad].label}</Badge>
                <Badge>{SECCION_LABEL[x.seccion]}</Badge>
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
