import { Icon, useMunicipio } from '@muni/design-system'
import { Link } from 'react-router-dom'
import { TEMAS } from '../temas'

export function NoEncontrada() {
  const s = TEMAS[useMunicipio().id].estilos
  return (
    <section className={`${s.contenedor} ${s.noEncontrada}`}>
      <span className="hds-tile-icon hds-tile-icon--blue">
        <Icon name="map-pin" size={24} />
      </span>
      <h1>No encontramos esta página</h1>
      <p>Puede que la dirección esté mal escrita o que la página ya no exista.</p>
      <Link to="/" className="hds-btn hds-btn--primary">
        <Icon name="arrow-left" size={20} />
        <span>Volver al inicio</span>
      </Link>
    </section>
  )
}
