import { Icon, Logo, Trazo } from '@muni/design-system'
import { useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { MODULOS } from '../../modulos'
import s from './sitio.module.css'

/**
 * SiteHeader del design system Vichuquén: franja de utilidades en teal
 * (surface-brand) + barra principal con el logo horizontal y la navegación.
 * El ítem actual va en primario con el Trazo debajo. En pantallas angostas la
 * navegación se abre con el botón Menú.
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
          <span>Sitio oficial de la Ilustre Municipalidad de Vichuquén · Región del Maule</span>
          <span className={s.govCorto}>Sitio oficial · Municipalidad de Vichuquén</span>
          <a href="tel:+56752555501" className={s.govTelefono}>
            <Icon name="phone" size={16} />
            <span>+56 75 255 5501</span>
          </a>
        </div>
      </div>

      <div className={`hds-header__in ${s.headerIn}`} onKeyDown={onKeyDown} onBlur={onBlur}>
        <Link to="/" aria-label="Inicio, Municipalidad de Vichuquén" className={s.brand}>
          <Logo variant="horizontal" height={52} />
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
            {({ isActive }) => <ConTrazo activo={isActive}>Inicio</ConTrazo>}
          </NavLink>
          {MODULOS.map(({ meta }) => (
            <NavLink key={meta.id} to={meta.path} className={linkClass}>
              {({ isActive }) => <ConTrazo activo={isActive}>{meta.label}</ConTrazo>}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

/** Texto del enlace con el Trazo debajo cuando es la página actual. */
function ConTrazo({ activo, children }: { activo: boolean; children: ReactNode }) {
  return (
    <>
      {children}
      {activo && <Trazo width={56} className={s.navTrazo} />}
    </>
  )
}
