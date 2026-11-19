import { Badge, Icon, useMunicipio } from '@muni/design-system'
import { Link } from 'react-router-dom'
import { ruta } from '../lib/rutas'
import s from '../styles/beneficio.module.css'

/*
 * Beneficio destacado de la Tarjeta Hogar Preparado: 30 % de descuento en farmacia.
 * Es el primer beneficio de la demostración; locales y condiciones están por confirmar
 * con la Municipalidad (lo dice la letra chica). El resto del catálogo sigue por definir.
 */

export const DESCUENTO_FARMACIA = 30

const CONDICIONES = 'Beneficio de demostración. Locales y condiciones por confirmar.'

/** Sello compacto para el héroe de la landing (sobre fondo de marca). */
export function SelloFarmacia() {
  return (
    <p className={s.sello}>
      <span className={s.selloPorcentaje}>{DESCUENTO_FARMACIA} %</span>
      <span className={s.selloTexto}>
        de descuento en farmacia
        <br />
        con tu tarjeta
      </span>
    </p>
  )
}

/**
 * Tarjeta del beneficio. `activo`: la familia ya tiene su tarjeta (pantalla de recompensa);
 * si no, invita a obtenerla.
 */
export function BeneficioFarmacia({ activo = false, tituloId }: { activo?: boolean; tituloId?: string }) {
  const { nombre } = useMunicipio()
  return (
    <article className={s.beneficio} aria-labelledby={tituloId}>
      <div className={s.porcentaje} aria-hidden="true">
        <Icon name="heart-pulse" size={28} />
        <span className={s.porcentajeNumero}>{DESCUENTO_FARMACIA} %</span>
        <span className={s.porcentajeTexto}>de descuento</span>
      </div>
      <div className={s.cuerpo}>
        {activo && (
          <Badge tone="green" icon="circle-check">
            Ya es tuyo
          </Badge>
        )}
        <h3 id={tituloId} className={s.titulo}>
          {DESCUENTO_FARMACIA} % de descuento en farmacia
        </h3>
        <p className={s.texto}>
          {activo
            ? 'Muestra tu Tarjeta Hogar Preparado al pagar en las farmacias adheridas y te hacen el descuento.'
            : `Obtén tu Tarjeta Hogar Preparado y accede al descuento en medicamentos en farmacias adheridas de ${nombre}.`}
        </p>
        {!activo && (
          <Link to={ruta('inscripcion')} className={`hds-btn hds-btn--primary ${s.cta}`}>
            Obtener mi tarjeta
            <Icon name="arrow-right" size={20} />
          </Link>
        )}
        <p className={s.condiciones}>{CONDICIONES}</p>
      </div>
    </article>
  )
}
