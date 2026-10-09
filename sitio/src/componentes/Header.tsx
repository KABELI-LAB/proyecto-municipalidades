import { Icon, Logo } from '@muni/design-system'
import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { MODULOS } from '../modulos'
import s from '../sitio.module.css'

/**
 * Header ciudadano del design system (franja institucional + logo Nivel B +
 * navegación). En pantallas angostas la navegación se abre con el botón Menú.
 */
export function Header() {
  const [abierto, setAbierto] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)
  // NavLink marca el enlace activo con aria-current="page"; el estilo sale de ahí.
  const linkClass = `hds-header__link ${s.navLink}`

  // Esc cierra el menú y devuelve el foco al botón.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && abierto) {
      setAbierto(false)
      botonRef.current?.focus()
    }
  }
  // Si el foco sale del header (Tab hacia el contenido), el menú se cierra.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (abierto && !e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false)
  }

  return (
    <header className={`hds-header ${s.header}`}>
      <div className="hds-header__gov">
        <div className={`hds-header__gov-in ${s.govIn}`}>
          {/* El design system oculta el primer texto bajo 1100px; el segundo es la versión corta. */}
          <span>Sitio oficial de la Ilustre Municipalidad de Hualañé · Región del Maule</span>
          <span className={s.govCorto}>Sitio oficial · Municipalidad de Hualañé</span>
        </div>
      </div>

      <div className={`hds-header__in ${s.headerIn}`} onKeyDown={onKeyDown} onBlur={onBlur}>
        <Link to="/" aria-label="Inicio, Municipalidad de Hualañé" className={s.brand}>
          <Logo variant="citizen" height={44} />
        </Link>

        <button
          ref={botonRef}
          type="button"
          className={`hds-btn hds-btn--tertiary ${s.menuBtn}`}
          aria-expanded={abierto}
          aria-controls="nav-principal"
          onClick={() => setAbierto((v) => !v)}
        >
          <Icon name={abierto ? 'x' : 'menu'} size={20} />
          <span>{abierto ? 'Cerrar' : 'Menú'}</span>
        </button>

        {/* El clic en cualquier enlace cierra el menú móvil. */}
        <nav
          id="nav-principal"
          aria-label="Secciones del sitio"
          className={`hds-header__nav ${s.nav} ${abierto ? s.navAbierto : ''}`}
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
