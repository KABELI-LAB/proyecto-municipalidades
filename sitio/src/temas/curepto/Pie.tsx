import { Icon, Logo } from '@muni/design-system'
import { Link } from 'react-router-dom'
import { MODULOS } from '../../modulos'
import s from './sitio.module.css'

export function Pie() {
  return (
    <>
      {/* Footer del design system Curepto: azul-noche, columnas separadas por líneas punteadas. */}
      <footer className={s.footer}>
        <div className={s.footerIn}>
          <div className={s.footerMarca}>
            <Logo variant="combined" inverse height={64} />
            <p>Sitio en desarrollo</p>
          </div>
          <nav className={s.footerCol} aria-labelledby="footer-servicios">
            <h2 id="footer-servicios">Servicios en línea</h2>
            <Link to="/">Inicio</Link>
            {MODULOS.map(({ meta }) => (
              <Link key={meta.id} to={meta.path}>
                {meta.label}
              </Link>
            ))}
          </nav>
          <div className={s.footerCol}>
            <h2>Municipalidad</h2>
            <p className={s.footerDato}>
              <Icon name="map-pin" size={20} />
              <span>Plaza de Armas S/N, Curepto, Región del Maule</span>
            </p>
            <p className={s.footerDato}>
              <Icon name="phone" size={20} />
              <span>
                Central telefónica
                <strong className={s.footerTelefono}>(+56) 75-2552300</strong>
              </span>
            </p>
          </div>
        </div>
        <div className={s.footerBase}>
          <div className={s.footerBaseIn}>
            <span>© 2026 Ilustre Municipalidad de Curepto</span>
            <span>Curepto, contigo, mejor Comuna</span>
          </div>
        </div>
      </footer>
    </>
  )
}
