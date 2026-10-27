import { Icon } from '@muni/design-system'
import { Link } from 'react-router-dom'
import { AVISO_CONFIANZA } from '../../shared/textos.ts'
import { BeneficioTarjeta } from '../componentes/BeneficioTarjeta'
import { TarjetaHogar } from '../componentes/TarjetaHogar'
import { ruta } from '../lib/rutas'
import { useResumen } from '../lib/useResumen'
import s from '../styles/paginas.module.css'

/** R1 · Landing: el beneficio es el héroe de la página. */
export function Landing() {
  const { resumen } = useResumen()
  const datos = resumen.estado === 'listo' ? resumen.datos : null
  const destacado = datos?.beneficioDestacado
  const barrio = datos?.barrios[0]

  return (
    <div className={s.pagina}>
      <section className={s.heroe} aria-labelledby="re-titulo">
        <div className={s.heroeTexto}>
          <p className={s.overlineInverso}>Registro de emergencia · Hualañé</p>
          <h1 id="re-titulo" className={s.heroeTitulo}>
            Inscribe a tu familia y obtén{' '}
            <span className={s.heroeBeneficio}>{destacado ? destacado.titulo.toLowerCase() : 'beneficios en el comercio local'}</span>
          </h1>
          <p className={s.heroeSub}>2 minutos. Si hay una emergencia en Hualañé, la ayuda llega más rápido.</p>
          <Link to={ruta('inscripcion')} className={`hds-btn hds-btn--accent hds-btn--lg ${s.heroeCta}`}>
            Quiero mi Tarjeta Hogar Preparado
            <Icon name="arrow-right" size={20} />
          </Link>
          {/* Dato vivo; bajo el mínimo configurado no se muestra. */}
          {datos?.hogaresPreparados != null && (
            <p className={s.contadorHogares}>
              <strong>{datos.hogaresPreparados.toLocaleString('es-CL')}</strong> hogares de Hualañé ya están preparados
            </p>
          )}
        </div>
        <div className={s.heroeTarjeta} aria-hidden="true">
          <TarjetaHogar previa destacada datos={{ nombre: 'Tu familia', direccion: 'Hualañé', integrantes: null, nivel: 1 }} />
        </div>
      </section>

      {datos && datos.beneficios.length > 0 && (
        <section className={s.seccion} aria-labelledby="re-beneficios">
          <div className={s.seccionCabecera}>
            <p className={s.rotulo}>Beneficios</p>
            <h2 id="re-beneficios" className={s.h2}>
              Lo que ganas con tu tarjeta
            </h2>
          </div>
          <ul className={s.carrusel} aria-label="Beneficios disponibles">
            {datos.beneficios.map((b) => (
              <li key={b.id}>
                <BeneficioTarjeta beneficio={b} compacta />
              </li>
            ))}
          </ul>
          <Link to={ruta('beneficios')} className={s.enlaceFlecha}>
            Ver todos los beneficios
            <Icon name="arrow-right" size={18} />
          </Link>
        </section>
      )}

      <section className={s.seccion} aria-labelledby="re-como">
        <div className={s.seccionCabecera}>
          <p className={s.rotulo}>Cómo funciona</p>
          <h2 id="re-como" className={s.h2}>
            Tres pasos y listo
          </h2>
        </div>
        <ol className={s.pasos}>
          <li>
            <span className={s.pasoNumero}>1</span>
            <span>
              <strong>Responde</strong> unas preguntas sobre tu hogar. Toma 2 minutos.
            </span>
          </li>
          <li>
            <span className={s.pasoNumero}>2</span>
            <span>
              <strong>Recibe tu tarjeta</strong> con tu código familiar en el celular.
            </span>
          </li>
          <li>
            <span className={s.pasoNumero}>3</span>
            <span>
              <strong>Usa tus beneficios</strong> y, si hay una emergencia, retira ayuda más rápido.
            </span>
          </li>
        </ol>
      </section>

      {barrio && (
        <section className={s.seccion} aria-labelledby="re-barrios">
          <div className={s.seccionCabecera}>
            <p className={s.rotulo}>Termómetro de barrios</p>
            <h2 id="re-barrios" className={s.h2}>
              {barrio.nombre.replace(/^Junta de vecinos /, '')} va en {barrio.porcentaje} %
            </h2>
          </div>
          <p>Cuando tu junta de vecinos llega a la meta, el barrio gana un premio{barrio.premio ? `: ${barrio.premio.toLowerCase()}` : ''}.</p>
          <Link to={ruta('barrios')} className={s.enlaceFlecha}>
            Ver todos los barrios
            <Icon name="arrow-right" size={18} />
          </Link>
        </section>
      )}

      <section className={s.confianza} aria-label="Aviso de seguridad">
        <Icon name="shield-check" size={28} />
        <p>{AVISO_CONFIANZA}</p>
      </section>

      <nav className={s.enlaces} aria-label="Más opciones">
        <Link to={ruta('mi-hogar')} className={s.enlaceTarjeta}>
          <Icon name="house" size={24} />
          Ver mi hogar
        </Link>
        <Link to={ruta('recuperar')} className={s.enlaceTarjeta}>
          <Icon name="rotate-ccw" size={24} />
          Perdí mi código
        </Link>
        <p className={s.ayudaPresencial}>
          <Icon name="hand-heart" size={24} />
          ¿Necesitas ayuda? En el CESFAM o en tu junta de vecinos te inscriben.
        </p>
      </nav>
    </div>
  )
}
