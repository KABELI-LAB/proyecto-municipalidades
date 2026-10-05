import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { MODULOS } from '../modulos'
import s from '../sitio.module.css'

export function Header({ nombreSitio }: { nombreSitio: string }) {
  const [abierto, setAbierto] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? `${s.navLink} ${s.navLinkActivo}` : s.navLink)

  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Link to="/" className={s.brand}>
          {/* TODO: reemplazar por el escudo oficial (versión negativo) desde los archivos originales. */}
          <span className={s.escudo} aria-hidden="true" />
          <span>{nombreSitio}</span>
        </Link>

        <button
          type="button"
          className={s.menuBtn}
          aria-expanded={abierto}
          aria-controls="nav-principal"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? 'Cerrar' : 'Menú'}
        </button>

        {/* El clic en cualquier enlace cierra el menú móvil. */}
        <nav
          id="nav-principal"
          aria-label="Secciones del sitio"
          className={`${s.nav} ${abierto ? s.navAbierto : ''}`}
          onClick={() => setAbierto(false)}
        >
          <NavLink to="/" end className={linkClass}>
            Inicio
          </NavLink>
          {MODULOS.map(({ meta }) => (
            <NavLink key={meta.id} to={meta.path} className={linkClass}>
              {meta.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
