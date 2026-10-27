import { Icon } from '@muni/design-system'
import s from '../styles/paginas.module.css'

/**
 * Espacio reservado para contenido que el equipo aún está definiendo
 * (por ahora, los beneficios de la Tarjeta Hogar Preparado).
 */
export function PorDefinir({ titulo, texto, inverso = false }: { titulo: string; texto?: string; inverso?: boolean }) {
  return (
    <div className={`${s.porDefinir} ${inverso ? s.porDefinirInverso : ''}`}>
      <Icon name="construction" size={24} />
      <div>
        <p className={s.porDefinirTitulo}>{titulo}</p>
        <p>{texto ?? 'Por definir.'}</p>
      </div>
    </div>
  )
}
