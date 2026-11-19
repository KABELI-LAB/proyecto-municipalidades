import { Badge, Icon, useMunicipio } from '@muni/design-system'
import { Link } from 'react-router-dom'
import { ruta } from '../lib/rutas'
import s from '../styles/beneficio.module.css'

/*
 * Beneficio de EJEMPLO de la Tarjeta Hogar Preparado: 15 % de descuento en farmacia.
 * Solo muestra cómo se verían los beneficios en esta demostración: no es real, no hay
 * farmacias adheridas ni descuentos vigentes. Todas sus versiones lo dicen a la vista
 * (etiqueta "Beneficio de ejemplo", textos en condicional y letra chica).
 */

export const DESCUENTO_FARMACIA = 15

const AVISO_EJEMPLO = 'Beneficio de ejemplo para esta demostración. No es real: no hay farmacias adheridas ni descuentos vigentes.'

/** Sello compacto para el héroe de la landing (sobre fondo de marca). */
export function SelloFarmacia() {
  return (
    <p className={s.sello}>
      <span className={s.selloEtiqueta}>Ejemplo</span>
      <span className={s.selloPorcentaje}>{DESCUENTO_FARMACIA} %</span>
      <span className={s.selloTexto}>
        de descuento en farmacia
        <br />
        con tu tarjeta
        <span className={s.srOnly}> (beneficio de ejemplo, no es real)</span>
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
        <Badge tone="yellow" icon="info">
          Beneficio de ejemplo
        </Badge>
        <h3 id={tituloId} className={s.titulo}>
          {DESCUENTO_FARMACIA} % de descuento en farmacia
        </h3>
        <p className={s.texto}>
          {activo
            ? 'Así podría funcionar un beneficio de tu tarjeta: la mostrarías al pagar y te harían el descuento. Por ahora es solo un ejemplo.'
            : `Así podría ser un beneficio de la Tarjeta Hogar Preparado en ${nombre}. Por ahora es solo un ejemplo.`}
        </p>
        {!activo && (
          <Link to={ruta('inscripcion')} className={`hds-btn hds-btn--primary ${s.cta}`}>
            Obtener mi tarjeta
            <Icon name="arrow-right" size={20} />
          </Link>
        )}
        <p className={s.condiciones}>{AVISO_EJEMPLO}</p>
      </div>
    </article>
  )
}
