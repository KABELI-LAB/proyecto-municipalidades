import { useCallback, useEffect, useState } from 'react'
import type { ResumenPublico } from '../../shared/contrato.ts'
import { useEmergencia } from './contexto'

export type EstadoCarga<T> = { estado: 'cargando' } | { estado: 'listo'; datos: T } | { estado: 'error' }

/** Datos públicos agregados (contador, beneficios, barrios). */
export function useResumen() {
  const { api } = useEmergencia()
  const [r, setR] = useState<EstadoCarga<ResumenPublico>>({ estado: 'cargando' })
  const pedir = useCallback(() => {
    api.resumen().then(
      (datos) => setR({ estado: 'listo', datos }),
      () => setR({ estado: 'error' }),
    )
  }, [api])
  useEffect(pedir, [pedir])
  const recargar = () => {
    setR({ estado: 'cargando' })
    pedir()
  }
  return { resumen: r, recargar }
}
