import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@muni/design-system/base.css'
import { __Nombre__Tab, __nombre__TabMeta } from '..'
import './dev.css'

/**
 * Anfitrión mínimo para desarrollar el módulo aislado (`npm run dev` en esta
 * carpeta). Para verlo dentro del sitio completo: `npm run dev` en la raíz.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <header className="dev-host-header">
      <div className="dev-host-brand">
        <span className="dev-host-escudo" aria-hidden="true" />
        <span>Municipalidad de Hualañé</span>
      </div>
      <nav aria-label="Secciones del sitio">
        <a href="#" aria-current="page">
          {__nombre__TabMeta.label}
        </a>
      </nav>
    </header>
    <main>
      <__Nombre__Tab />
    </main>
  </StrictMode>,
)
