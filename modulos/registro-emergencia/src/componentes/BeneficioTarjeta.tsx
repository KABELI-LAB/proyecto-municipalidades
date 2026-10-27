import { Icon } from '@muni/design-system'
import type { Beneficio } from '../../shared/contrato.ts'
import { fechaCorta } from '../../shared/fechas.ts'
import { CATEGORIAS, NIVELES, type Nivel } from '../../shared/incentivos.ts'
import s from '../styles/paginas.module.css'

const ICONO_CATEGORIA: Record<Beneficio['categoria'], string> = {
  comercio: 'store',
  actividad: 'calendar-days',
  servicio_municipal: 'landmark',
  mascotas: 'paw-print',
  capacitacion: 'graduation-cap',
  barrio: 'users',
}

interface Props {
  beneficio: Beneficio
  /** Nivel del hogar; sin él (público) no se muestran candados. */
  nivelHogar?: Nivel
  compacta?: boolean
}

/** Beneficio como tarjeta blanca con insignia en amarillo señal (texto Blue 950). */
export function BeneficioTarjeta({ beneficio: b, nivelHogar, compacta = false }: Props) {
  const bloqueado = nivelHogar !== undefined && b.nivelRequerido > nivelHogar
  return (
    <article className={`${s.beneficio} ${compacta ? s.beneficioCompacto : ''}`} data-bloqueado={bloqueado || undefined}>
      <div className={s.beneficioCabecera}>
        <span className={s.beneficioIcono}>
          <Icon name={bloqueado ? 'lock' : ICONO_CATEGORIA[b.categoria]} size={22} />
        </span>
        <span className={s.insignia}>{CATEGORIAS[b.categoria]}</span>
      </div>
      <h3 className={s.beneficioTitulo}>{b.titulo}</h3>
      {b.aliado && <p className={s.beneficioAliado}>{b.aliado}</p>}
      <p className={s.beneficioDesc}>{b.descripcionCorta}</p>
      {!compacta && (
        <ul className={s.beneficioDatos}>
          <li>
            <Icon name={bloqueado ? 'lock' : 'check'} size={16} />
            {bloqueado ? `Llega al nivel ${b.nivelRequerido}: ${NIVELES[b.nivelRequerido].nombre.toLowerCase()}` : `Desde el nivel ${b.nivelRequerido}`}
          </li>
          {b.cuposRestantes !== null && (
            <li>
              <Icon name="users" size={16} />
              {b.cuposRestantes > 0 ? `Quedan ${b.cuposRestantes.toLocaleString('es-CL')} cupos` : 'Sin cupos por ahora'}
            </li>
          )}
          {b.vigenteHasta && (
            <li>
              <Icon name="calendar-days" size={16} />
              Hasta el {fechaCorta(b.vigenteHasta)}
            </li>
          )}
          {b.condiciones && (
            <li>
              <Icon name="info" size={16} />
              {b.condiciones}
            </li>
          )}
        </ul>
      )}
    </article>
  )
}
