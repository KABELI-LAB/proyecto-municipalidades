import { Icon } from '@muni/design-system'
import { Link } from 'react-router-dom'
import { AVISO_CONFIANZA } from '../../shared/textos.ts'
import { PorDefinir } from '../componentes/PorDefinir'
import { TarjetaHogar } from '../componentes/TarjetaHogar'
import { ruta } from '../lib/rutas'
import { useResumen } from '../lib/useResumen'
import s from '../styles/paginas.module.css'

/** R1 · Landing: la Tarjeta Hogar Preparado es el héroe de la página. */
export function Landing() {
  const { resumen } = useResumen()
  const datos = resumen.estado === 'listo' ? resumen.datos : null

  return (
    <div className={s.pagina}>
      <section className={s.heroe} aria-labelledby="re-titulo">
        <div className={s.heroeTexto}>
          <p className={s.overlineInverso}>Registro de emergencia · Hualañé</p>
          <h1 id="re-titulo" className={s.heroeTitulo}>
            Inscribe a tu familia y recibe tu <span className={s.heroeBeneficio}>Tarjeta Hogar Preparado</span>
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
          <TarjetaHogar previa destacada datos={{ nombre: 'Tu familia', direccion: 'Hualañé', integrantes: null }} />
        </div>
      </section>

      <section className={s.seccion} aria-labelledby="re-beneficios">
        <div className={s.seccionCabecera}>
          <p className={s.rotulo}>Beneficios</p>
          <h2 id="re-beneficios" className={s.h2}>
            Lo que ganas con tu tarjeta
          </h2>
        </div>
        <PorDefinir titulo="Beneficios por definir" texto="Estamos definiendo los beneficios de la Tarjeta Hogar Preparado." />
      </section>

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
              <strong>Muéstrala en una emergencia</strong> y retira ayuda más rápido.
            </span>
          </li>
        </ol>
      </section>

      <section className={s.confianza} aria-label="Aviso de seguridad">
        <Icon name="shield-check" size={28} />
        <p>{AVISO_CONFIANZA}</p>
      </section>

      <nav className={s.enlaces} aria-label="Más opciones">
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
