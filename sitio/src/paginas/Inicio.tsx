import { Cauce, Icon } from '@muni/design-system'
import { Link } from 'react-router-dom'
import { MODULOS } from '../modulos'
import s from '../sitio.module.css'

export function Inicio() {
  return (
    <>
      <section className={s.hero}>
        <div className={s.contenedor}>
          <p className="hds-overline">Servicios en línea</p>
          <h1 className={s.heroTitulo}>
            Hola.
            <span>¿Cómo podemos ayudarte?</span>
          </h1>
          <p className={s.lead}>Encuentra los servicios de la Municipalidad de Hualañé en un solo lugar.</p>
        </div>
        <div className={s.heroCauce} aria-hidden="true">
          <Cauce colors={['var(--blue-100)', 'var(--green-100)', 'var(--yellow-100)']} thickness={14} gap={56} />
        </div>
      </section>

      <section className={s.contenedor} aria-labelledby="servicios-titulo">
        <h2 id="servicios-titulo" className={s.seccionTitulo}>
          ¿Qué necesitas hacer?
        </h2>
        <ul className={s.tarjetas}>
          {MODULOS.map(({ meta }) => (
            <li key={meta.id}>
              {/* Marcado de ServiceTile del design system, con Link del router. */}
              <Link to={meta.path} className={`hds-card hds-card--interactive ${s.tile}`}>
                <span className={`hds-tile-icon hds-tile-icon--${meta.tono ?? 'blue'}`}>
                  <Icon name={meta.icono ?? 'file-text'} size={24} />
                </span>
                <div className={s.tileTexto}>
                  <h3>{meta.label}</h3>
                  <p>{meta.descripcion}</p>
                </div>
                <Icon name="chevron-right" size={20} className={s.tileFlecha} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
