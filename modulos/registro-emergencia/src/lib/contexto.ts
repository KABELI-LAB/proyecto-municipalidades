import { createContext, useContext } from 'react'
import type { EmergenciaApi } from '../servicios/api'

export interface CtxEmergencia {
  api: EmergenciaApi
  /** Preferencia "Menos movimiento" o prefers-reduced-motion del sistema. */
  menosMovimiento: boolean
  preferenciaMovimiento: boolean
  setMenosMovimiento: (v: boolean) => void
}

export const ContextoEmergencia = createContext<CtxEmergencia | null>(null)

export function useEmergencia(): CtxEmergencia {
  const c = useContext(ContextoEmergencia)
  if (!c) throw new Error('useEmergencia fuera de ProveedorEmergencia')
  return c
}
