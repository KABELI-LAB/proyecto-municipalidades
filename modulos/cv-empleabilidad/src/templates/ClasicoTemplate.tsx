import type { TemplateProps } from '.'
import { contactoItems } from './contacto'
import { Educaciones, Experiencias } from './parts'
import s from './templates.module.css'

export function ClasicoTemplate({ cv }: TemplateProps) {
  return (
    <div className={`${s.page} ${s.clasico}`}>
      <header className={s.clasicoHeader}>
        <h1>{cv.nombre}</h1>
        <p className={s.titular}>{cv.titular}</p>
        <p className={s.contacto}>{contactoItems(cv).join('  ·  ')}</p>
      </header>

      <section>
        <h2>Perfil profesional</h2>
        <p>{cv.perfil}</p>
      </section>

      {cv.experiencia.length > 0 && (
        <section>
          <h2>Experiencia laboral</h2>
          <Experiencias cv={cv} className={s.item} />
        </section>
      )}

      {cv.educacion.length > 0 && (
        <section>
          <h2>Formación</h2>
          <Educaciones cv={cv} className={s.item} />
        </section>
      )}

      {cv.habilidades.length > 0 && (
        <section>
          <h2>Habilidades</h2>
          <p>{cv.habilidades.join(' · ')}</p>
        </section>
      )}

      <section>
        <h2>Idiomas</h2>
        <p>{cv.idiomas.join(' · ')}</p>
      </section>
    </div>
  )
}
