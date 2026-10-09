import '@muni/design-system/base.css'
import { Logo } from '@muni/design-system'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CvTab, cvTabMeta } from '..'
import './dev.css'

/**
 * Anfitrión mínimo para desarrollar el módulo aislado (`npm run dev` en esta
 * carpeta). Para verlo dentro del sitio completo: `npm run dev` en la raíz.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <header className="hds-header dev-host">
      <div className="hds-header__in">
        <Logo variant="citizen" height={40} />
        <nav className="hds-header__nav" aria-label="Secciones del sitio">
          <a href="#" className="hds-header__link" aria-current="page">
            {cvTabMeta.label}
          </a>
        </nav>
      </div>
    </header>
    <main>
      <CvTab />
    </main>
  </StrictMode>,
)
