import { Alert, Button, Icon, Loader } from '@muni/design-system'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIAS, type Categoria } from '../../shared/incentivos.ts'
import { BeneficioTarjeta } from '../componentes/BeneficioTarjeta'
import { ruta } from '../lib/rutas'
import { useResumen } from '../lib/useResumen'
import s from '../styles/paginas.module.css'

/** B1 · Catálogo de beneficios. Público: no requiere inscripción para verlo. */
export function Beneficios() {
  const { resumen, recargar } = useResumen()
  const [filtro, setFiltro] = useState<Categoria | 'todas'>('todas')

  return (
    <div className={s.pagina}>
      <header className={s.seccionCabecera}>
        <p className={s.rotulo}>Tarjeta Hogar Preparado</p>
        <h1 className={s.h1}>Beneficios</h1>
        <p className={s.lead}>Muestra tu tarjeta vigente para usarlos. Algunos se desbloquean al preparar tu mochila o practicar tu plan.</p>
      </header>

      {resumen.estado === 'cargando' && <Loader label="Cargando beneficios…" />}
      {resumen.estado === 'error' && (
        <Alert tone="error" title="No pudimos cargar los beneficios" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Revisa tu conexión e inténtalo de nuevo.
        </Alert>
      )}

      {resumen.estado === 'listo' && (
        <>
          {resumen.datos.campana && resumen.datos.beneficioDestacado && (
            <section className={s.destacado} aria-labelledby="re-destacado">
              <p className={s.overlineInverso}>{resumen.datos.campana.nombre}</p>
              <h2 id="re-destacado" className={s.h2Inverso}>
                {resumen.datos.beneficioDestacado.titulo}
              </h2>
              <p>{resumen.datos.campana.mensaje ?? resumen.datos.beneficioDestacado.descripcionCorta}</p>
            </section>
          )}

          <div className={s.filtros} role="group" aria-label="Filtrar por categoría">
            {(['todas', ...Object.keys(CATEGORIAS)] as (Categoria | 'todas')[]).map((c) => (
              <button key={c} type="button" className="hds-chip" aria-pressed={filtro === c} onClick={() => setFiltro(c)}>
                {c === 'todas' ? 'Todas' : CATEGORIAS[c]}
              </button>
            ))}
          </div>

          <ul className={s.grilla} aria-live="polite">
            {resumen.datos.beneficios
              .filter((b) => filtro === 'todas' || b.categoria === filtro)
              .map((b) => (
                <li key={b.id}>
                  <BeneficioTarjeta beneficio={b} />
                </li>
              ))}
          </ul>

          <div className={s.cta}>
            <p>¿Aún no tienes tu tarjeta?</p>
            <Link to={ruta('inscripcion')} className="hds-btn hds-btn--primary hds-btn--lg">
              Quiero mi Tarjeta Hogar Preparado
              <Icon name="arrow-right" size={20} />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
