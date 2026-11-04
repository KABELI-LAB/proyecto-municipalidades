import { Logo } from '@muni/design-system'
import s from './sitio.module.css'

export function Pie() {
  return (
    <footer className={s.footer}>
      <div className={s.footerIn}>
        <Logo variant="combined" inverse height={120} />
        <p>Sitio en desarrollo</p>
      </div>
      <div className={s.footerBase}>
        <div className={s.footerIn}>
          <span>© 2026 Ilustre Municipalidad de Hualañé</span>
          <span>Hualañé somos tod@s</span>
        </div>
      </div>
    </footer>
  )
}
