import { createContext, useContext } from 'react'
import type { EmergenciaApi } from '../servicios/api'
import type { PreferenciasAccesibilidad } from './accesibilidad'

export interface CtxEmergencia {
  api: EmergenciaApi
  /** Preferencia "Menos movimiento" o prefers-reduced-motion del sistema. */
  menosMovimiento: boolean
  preferenciaMovimiento: boolean
  setMenosMovimiento: (v: boolean) => void
  /** Opciones del panel "Accesibilidad" (incluye menosMovimiento). */
  accesibilidad: PreferenciasAccesibilidad
  cambiarAccesibilidad: (cambios: Partial<PreferenciasAccesibilidad>) => void
}

export const ContextoEmergencia = createContext<CtxEmergencia | null>(null)

export function useEmergencia(): CtxEmergencia {
  const c = useContext(ContextoEmergencia)
  if (!c) throw new Error('useEmergencia fuera de ProveedorEmergencia')
  return c
}
