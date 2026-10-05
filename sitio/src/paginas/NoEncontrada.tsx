import { Link } from 'react-router-dom'
import s from '../sitio.module.css'

export function NoEncontrada() {
  return (
    <section className={`${s.contenedor} ${s.noEncontrada}`}>
      <h1>No encontramos esta página</h1>
      <p>Es posible que la dirección esté mal escrita o que la página ya no exista.</p>
      <Link to="/" className={s.tarjetaLink}>
        Volver al inicio
      </Link>
    </section>
  )
}
