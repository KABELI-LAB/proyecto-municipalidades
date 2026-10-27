import { Icon } from '@muni/design-system'
import { useState } from 'react'
import type { PlanFamiliar } from '../../shared/tarjeta.ts'
import s from '../styles/paginas.module.css'

/** Plan familiar en pantalla: punto de encuentro, mochila (marcable) y teléfonos. */
export function PlanFamiliarVista({ plan }: { plan: PlanFamiliar }) {
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const alternar = (item: string) =>
    setMarcados((m) => {
      const n = new Set(m)
      if (n.has(item)) n.delete(item)
      else n.add(item)
      return n
    })

  return (
    <div className={s.plan}>
      <div className={s.planBloque}>
        <h3 className={s.h3}>
          <Icon name="map-pin" size={22} />
          Punto de encuentro
        </h3>
        <p className={s.planDestacado}>{plan.puntoEncuentro}</p>
        {plan.puntoEncuentroEsSugerido && <p className={s.ayuda}>Sugerido para tu sector. Puedes acordar otro con tu familia.</p>}
      </div>

      <div className={s.planBloque}>
        <h3 className={s.h3}>
          <Icon name="backpack" size={22} />
          Mochila de emergencia
        </h3>
        {plan.mochila.map((g) => (
          <fieldset key={g.titulo} className={s.mochilaGrupo}>
            <legend className={s.mochilaTitulo}>{g.titulo}</legend>
            {g.items.map((i) => (
              <label key={i} className={s.mochilaItem}>
                <input type="checkbox" checked={marcados.has(i)} onChange={() => alternar(i)} />
                <span>{i}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      <div className={s.planBloque}>
        <h3 className={s.h3}>
          <Icon name="phone" size={22} />
          Teléfonos de emergencia
        </h3>
        <ul className={s.telefonos}>
          {plan.telefonos.map((t) => (
            <li key={t.nombre}>
              <span>{t.nombre}</span>
              <a href={`tel:${t.numero}`} className={s.telefono}>
                {t.numero}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
