import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../design-system/base.css'
import { CvTab, cvTabMeta } from '..'
import './dev.css'

/**
 * Sitio anfitrión simulado, solo para desarrollo. Reproduce el contexto en que
 * la pestaña vivirá dentro del sitio completo. No se exporta.
 */
const TABS = ['Inicio', 'Trámites', cvTabMeta.label, 'Noticias', 'Contacto']

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <header className="dev-host-header">
      <div className="dev-host-brand">
        <span className="dev-host-escudo" aria-hidden="true" />
        <span>Municipalidad de Hualañé</span>
      </div>
      <nav aria-label="Secciones del sitio">
        {TABS.map((t) => (
          <a key={t} href="#" aria-current={t === cvTabMeta.label ? 'page' : undefined}>
            {t}
          </a>
        ))}
      </nav>
    </header>
    <main>
      <CvTab />
    </main>
  </StrictMode>,
)
