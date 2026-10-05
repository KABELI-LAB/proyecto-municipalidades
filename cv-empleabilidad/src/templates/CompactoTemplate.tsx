import type { TemplateProps } from '.'
import { contactoItems } from './contacto'
import { Educaciones, Experiencias } from './parts'
import s from './templates.module.css'

export function CompactoTemplate({ cv }: TemplateProps) {
  return (
    <div className={`${s.page} ${s.compacto}`}>
      <header className={s.compactoHeader}>
        <div>
          <h1>{cv.nombre}</h1>
          <p className={s.titular}>{cv.titular}</p>
        </div>
        <ul className={s.plain}>
          {contactoItems(cv).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </header>

      <p className={s.compactoPerfil}>{cv.perfil}</p>

      {cv.experiencia.length > 0 && (
        <section className={s.compactoRow}>
          <h2>Experiencia</h2>
          <div>
            <Experiencias cv={cv} className={s.item} />
          </div>
        </section>
      )}

      {cv.educacion.length > 0 && (
        <section className={s.compactoRow}>
          <h2>Formación</h2>
          <div>
            <Educaciones cv={cv} className={s.item} />
          </div>
        </section>
      )}

      <section className={s.compactoRow}>
        <h2>Habilidades</h2>
        <div className={s.chips}>
          {cv.habilidades.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      </section>

      <section className={s.compactoRow}>
        <h2>Idiomas</h2>
        <p>{cv.idiomas.join(' · ')}</p>
      </section>
    </div>
  )
}
