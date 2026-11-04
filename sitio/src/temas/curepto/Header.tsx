import { Icon, Logo } from '@muni/design-system'
import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { MODULOS } from '../../modulos'
import s from './sitio.module.css'

/**
 * Header del design system Curepto, en tres franjas:
 * 1. Barra de avisos (azul-municipal): logotipo blanco + aviso con flechas.
 * 2. Barra de utilidades (degradado gris → negro): identificación del sitio.
 * 3. Menú principal (azul-noche): Inicio + un enlace por módulo.
 * En pantallas angostas el menú se abre con el botón Menú.
 */
export function Header() {
  const [abierto, setAbierto] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)

  // Esc cierra el menú y devuelve el foco al botón.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && abierto) {
      setAbierto(false)
      botonRef.current?.focus()
    }
  }
  // Si el foco sale del menú (Tab hacia el contenido), se cierra.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (abierto && !e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false)
  }

  return (
    <header className={s.header}>
      <div className={s.avisos}>
        <div className={s.avisosIn}>
          <Link to="/" aria-label="Inicio, Municipalidad de Curepto" className={s.brand}>
            <Logo variant="combined" inverse height={52} />
          </Link>
          <Avisos />
        </div>
      </div>

      <div className={s.utilidades}>
        <div className={s.utilidadesIn}>
          <span>Sitio oficial de la Ilustre Municipalidad de Curepto · Región del Maule</span>
        </div>
      </div>

      <div className={s.menu} onKeyDown={onKeyDown} onBlur={onBlur}>
        <div className={s.menuIn}>
          <button
            ref={botonRef}
            type="button"
            className={s.menuBtn}
            aria-expanded={abierto}
            aria-controls="nav-principal"
            onClick={() => setAbierto((v) => !v)}
          >
            <Icon name={abierto ? 'x' : 'menu'} size={22} />
            <span>{abierto ? 'Cerrar' : 'Menú'}</span>
          </button>

          {/* El clic en cualquier enlace cierra el menú móvil. */}
          <nav
            id="nav-principal"
            aria-label="Secciones del sitio"
            className={`${s.nav} ${abierto ? s.navAbierto : ''}`}
            onClick={() => setAbierto(false)}
          >
            <NavLink to="/" end className={s.navLink}>
              Inicio
            </NavLink>
            {MODULOS.map(({ meta }) => (
              <NavLink key={meta.id} to={meta.path} className={s.navLink}>
                {meta.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

/**
 * Aviso de la barra superior: un servicio a la vez, con flechas para cambiar.
 * No avanza solo, así nadie pierde el texto mientras lo lee.
 */
function Avisos() {
  const [i, setI] = useState(0)
  const total = MODULOS.length
  if (total === 0) return null
  const actual = MODULOS[i % total]!.meta
  const mover = (paso: number) => setI((n) => (n + paso + total) % total)

  return (
    <div className={s.aviso} role="group" aria-roledescription="carrusel" aria-label="Avisos">
      {total > 1 && (
        <button type="button" className={s.avisoFlecha} aria-label="Aviso anterior" onClick={() => mover(-1)}>
          <Icon name="chevron-left" size={24} />
        </button>
      )}
      <p className={s.avisoTexto} aria-live="polite">
        <span className={s.avisoEtiqueta}>Aviso {(i % total) + 1} - </span>
        <Link to={actual.path} className={s.avisoTitular}>
          {actual.descripcion}
        </Link>
      </p>
      {total > 1 && (
        <button type="button" className={s.avisoFlecha} aria-label="Aviso siguiente" onClick={() => mover(1)}>
          <Icon name="chevron-right" size={24} />
        </button>
      )}
    </div>
  )
}
