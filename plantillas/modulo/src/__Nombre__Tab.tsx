import { Alert } from '@muni/design-system'
import s from './styles/ui.module.css'

/**
 * Pestaña "__LABEL__". Componente autocontenido: sin router propio ni estilos
 * globales; usa los tokens y componentes de @muni/design-system.
 */
export function __Nombre__Tab() {
  return (
    <div className={s.root}>
      <header className={s.intro}>
        <p className="hds-overline">__LABEL__</p>
        {/* El módulo aporta el <h1> de su página. */}
        <h1>__LABEL__</h1>
        <p className={s.lead}>__DESCRIPCION__</p>
      </header>

      <Alert tone="info" title="Sección en construcción">
        Reemplaza este contenido por tu sección.
      </Alert>
    </div>
  )
}
