import { Icon, Logo, Oleaje } from '@muni/design-system'
import s from './sitio.module.css'

export function Pie() {
  return (
    <footer className={s.footer}>
      <div className={s.footerOleaje} aria-hidden="true">
        <Oleaje tone="onBrand" height={32} />
      </div>
      <div className={s.footerIn}>
        <Logo variant="vertical" inverse height={120} />
        <div className={s.footerContacto}>
          <p className={s.footerDato}>
            <Icon name="map-pin" size={20} />
            <span>Manuel Rodríguez 90, Vichuquén</span>
          </p>
          <p className={s.footerDato}>
            <Icon name="phone" size={20} />
            <a href="tel:+56752555501">+56 75 255 5501</a>
          </p>
          <p className={s.footerDato}>
            <Icon name="clock" size={20} />
            <span>Lunes a jueves de 8:30 a 14:00 y de 15:00 a 17:30. Viernes hasta las 16:30.</span>
          </p>
          <p>Sitio en desarrollo</p>
        </div>
      </div>
      <div className={s.footerBase}>
        <div className={s.footerIn}>
          <span>© 2026 Ilustre Municipalidad de Vichuquén</span>
        </div>
      </div>
    </footer>
  )
}
