import { Icon } from '@muni/design-system'
import { Link } from 'react-router-dom'
import { PorDefinir } from '../componentes/PorDefinir'
import { ruta } from '../lib/rutas'
import s from '../styles/paginas.module.css'

/** B1 · Beneficios: el catálogo lo está definiendo el equipo. */
export function Beneficios() {
  return (
    <div className={s.pagina}>
      <header className={s.seccionCabecera}>
        <p className={s.rotulo}>Tarjeta Hogar Preparado</p>
        <h1 className={s.h1}>Beneficios</h1>
      </header>
      <PorDefinir titulo="Beneficios por definir" texto="Estamos definiendo los beneficios de la Tarjeta Hogar Preparado." />
      <div className={s.cta}>
        <p>¿Aún no tienes tu tarjeta?</p>
        <Link to={ruta('inscripcion')} className="hds-btn hds-btn--primary hds-btn--lg">
          Quiero mi Tarjeta Hogar Preparado
          <Icon name="arrow-right" size={20} />
        </Link>
      </div>
    </div>
  )
}
