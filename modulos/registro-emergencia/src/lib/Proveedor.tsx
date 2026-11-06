import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { EmergenciaApi } from '../servicios/api'
import { usePreferenciasAccesibilidad } from './accesibilidad'
import { ContextoEmergencia } from './contexto'

export function ProveedorEmergencia({ api, children }: { api: EmergenciaApi; children: ReactNode }) {
  const [accesibilidad, cambiarAccesibilidad] = usePreferenciasAccesibilidad()
  const [sistema, setSistema] = useState(() => consultaMovimiento()?.matches ?? false)

  useEffect(() => {
    const mq = consultaMovimiento()
    if (!mq) return
    const cambio = () => setSistema(mq.matches)
    mq.addEventListener('change', cambio)
    return () => mq.removeEventListener('change', cambio)
  }, [])

  // "Menos movimiento" es una de las opciones de accesibilidad (el interruptor y el panel la comparten).
  const setMenosMovimiento = useCallback((v: boolean) => cambiarAccesibilidad({ menosMovimiento: v }), [cambiarAccesibilidad])

  return (
    <ContextoEmergencia.Provider value={{
        api,
        menosMovimiento: accesibilidad.menosMovimiento || sistema,
        preferenciaMovimiento: accesibilidad.menosMovimiento,
        setMenosMovimiento,
        accesibilidad,
        cambiarAccesibilidad,
      }}>
      {children}
    </ContextoEmergencia.Provider>
  )
}

function consultaMovimiento(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null
}
