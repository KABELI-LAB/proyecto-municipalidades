import type { TemplateProps } from '.'
import { contactoItems } from './contacto'
import { Educaciones, Experiencias } from './parts'
import s from './templates.module.css'

export function ModernoTemplate({ cv }: TemplateProps) {
  return (
    <div className={`${s.page} ${s.moderno}`}>
      <aside className={s.modernoSide}>
        <h1>{cv.nombre}</h1>
        <p className={s.titular}>{cv.titular}</p>

        <h2>Contacto</h2>
        <ul className={s.plain}>
          {contactoItems(cv).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>

        {cv.habilidades.length > 0 && (
          <>
            <h2>Habilidades</h2>
            <ul className={s.plain}>
              {cv.habilidades.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        )}

        <h2>Idiomas</h2>
        <ul className={s.plain}>
          {cv.idiomas.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </aside>

      <main className={s.modernoMain}>
        <section>
          <h2>Perfil</h2>
          <p>{cv.perfil}</p>
        </section>
        {cv.experiencia.length > 0 && (
          <section>
            <h2>Experiencia</h2>
            <Experiencias cv={cv} className={s.item} />
          </section>
        )}
        {cv.educacion.length > 0 && (
          <section>
            <h2>Formación</h2>
            <Educaciones cv={cv} className={s.item} />
          </section>
        )}
      </main>
    </div>
  )
}
