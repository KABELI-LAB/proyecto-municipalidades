import { Link } from 'react-router-dom'
import { MODULOS } from '../modulos'
import s from '../sitio.module.css'

export function Inicio() {
  return (
    <>
      <section className={s.hero}>
        <div className={s.contenedor}>
          <p className={s.eyebrow}>
            <span className={s.eyebrowBar} aria-hidden="true" />
            Servicios en línea
          </p>
          <h1>Le damos la bienvenida al portal de la Municipalidad de Hualañé</h1>
          <p className={s.lead}>Realice trámites, encuentre información y acceda a los servicios municipales desde un solo lugar.</p>
        </div>
      </section>

      <section className={s.contenedor} aria-labelledby="servicios-titulo">
        <h2 id="servicios-titulo" className={s.seccionTitulo}>
          Servicios disponibles
        </h2>
        <ul className={s.tarjetas}>
          {MODULOS.map(({ meta }) => (
            <li key={meta.id} className={s.tarjeta}>
              <h3>{meta.label}</h3>
              <p>{meta.descripcion}</p>
              <Link to={meta.path} className={s.tarjetaLink}>
                Ir a {meta.label}
                <span aria-hidden="true"> →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
