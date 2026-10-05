import type { CvData } from '../services/types'

/** Piezas compartidas por las plantillas. */

export function Experiencias({ cv, className }: { cv: CvData; className?: string }) {
  return (
    <>
      {cv.experiencia.map((e, i) => (
        <article key={i} className={className}>
          <header>
            <strong>{e.cargo}</strong>
            {e.organizacion && <span> · {e.organizacion}</span>}
            {e.periodo && <em>{e.periodo}</em>}
          </header>
          {e.logros.length > 0 && (
            <ul>
              {e.logros.map((l, j) => (
                <li key={j}>{l}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </>
  )
}

export function Educaciones({ cv, className }: { cv: CvData; className?: string }) {
  return (
    <>
      {cv.educacion.map((e, i) => (
        <article key={i} className={className}>
          <header>
            <strong>{e.titulo}</strong>
            {e.periodo && <em>{e.periodo}</em>}
          </header>
          {e.institucion && <p>{e.institucion}</p>}
        </article>
      ))}
    </>
  )
}
