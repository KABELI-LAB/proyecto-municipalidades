import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { EmergenciaApi } from '../servicios/api'
import { CLAVES, guardar, leer } from './almacen'
import { ContextoEmergencia } from './contexto'

export function ProveedorEmergencia({ api, children }: { api: EmergenciaApi; children: ReactNode }) {
  const [preferencia, setPreferencia] = useState(() => leer<boolean>(CLAVES.menosMovimiento) ?? false)
  const [sistema, setSistema] = useState(() => consultaMovimiento()?.matches ?? false)

  useEffect(() => {
    const mq = consultaMovimiento()
    if (!mq) return
    const cambio = () => setSistema(mq.matches)
    mq.addEventListener('change', cambio)
    return () => mq.removeEventListener('change', cambio)
  }, [])

  const setMenosMovimiento = useCallback((v: boolean) => {
    setPreferencia(v)
    guardar(CLAVES.menosMovimiento, v)
  }, [])

  return (
    <ContextoEmergencia.Provider value={{ api, menosMovimiento: preferencia || sistema, preferenciaMovimiento: preferencia, setMenosMovimiento }}>
      {children}
    </ContextoEmergencia.Provider>
  )
}

function consultaMovimiento(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null
}
