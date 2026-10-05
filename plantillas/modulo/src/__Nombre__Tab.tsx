import s from './styles/ui.module.css'

/**
 * Pestaña "__LABEL__". Componente autocontenido: sin router propio ni estilos
 * globales; solo usa las variables CSS del design system (--muni-*).
 */
export function __Nombre__Tab() {
  return (
    <div className={s.root}>
      <header className={s.intro}>
        <p className={s.eyebrow}>
          <span className={s.eyebrowBar} aria-hidden="true" />
          __LABEL__
        </p>
        <h2>__LABEL__</h2>
        <p className={s.lead}>__DESCRIPCION__</p>
      </header>

      <section className={s.panel}>
        <p>Este módulo está en construcción. Reemplace este contenido por su sección.</p>
      </section>
    </div>
  )
}
