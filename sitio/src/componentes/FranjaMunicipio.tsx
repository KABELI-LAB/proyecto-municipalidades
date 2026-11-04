import { Icon, MUNICIPIOS, type MunicipioId } from '@muni/design-system'
import s from './FranjaMunicipio.module.css'

interface Props {
  municipio: MunicipioId
  onElegir: (m: MunicipioId) => void
}

/** Franja de demostración: el mismo sitio con el diseño de cada municipio. */
export function FranjaMunicipio({ municipio, onElegir }: Props) {
  return (
    <div className={s.franja} role="note">
      <p className={s.texto}>
        <Icon name="info" size={20} />
        <span>
          <b>Sitio de demostración.</b> Elige un municipio para ver el sitio con su diseño.
        </span>
      </p>
      <div className={s.selector} role="group" aria-label="Municipio de la demostración">
        <span aria-hidden="true">Ver municipio de</span>
        {Object.values(MUNICIPIOS).map((m) => (
          <button
            key={m.id}
            type="button"
            className={s.opcion}
            aria-pressed={m.id === municipio}
            onClick={() => onElegir(m.id)}
          >
            {m.nombre}
          </button>
        ))}
      </div>
      <p className="hds-visually-hidden" aria-live="polite">
        Estás viendo el sitio de {MUNICIPIOS[municipio].nombre}.
      </p>
    </div>
  )
}
