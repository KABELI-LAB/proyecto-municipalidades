import '@muni/design-system/base.css'
import { Logo } from '@muni/design-system'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { RegistroEmergenciaTab, registroEmergenciaTabMeta } from '..'
import './dev.css'

/**
 * Anfitrión mínimo para desarrollar el módulo aislado (`npm run dev` en esta
 * carpeta). Reproduce cómo lo monta el sitio: BrowserRouter + `path/*`.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <header className="hds-header dev-host">
        <div className="hds-header__in">
          <Logo variant="citizen" height={40} />
          <nav className="hds-header__nav" aria-label="Secciones del sitio">
            <NavLink to={registroEmergenciaTabMeta.path} className="hds-header__link">
              {registroEmergenciaTabMeta.label}
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Routes>
          <Route path={`${registroEmergenciaTabMeta.path}/*`} element={<RegistroEmergenciaTab />} />
          <Route path="*" element={<Navigate to={registroEmergenciaTabMeta.path} replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  </StrictMode>,
)
