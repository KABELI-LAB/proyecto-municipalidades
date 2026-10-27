import { Switch } from '@muni/design-system'
import { useEmergencia } from '../lib/contexto'

/** Interruptor visible "Menos movimiento" (7.6). Se suma a prefers-reduced-motion. */
export function InterruptorMovimiento() {
  const { preferenciaMovimiento, setMenosMovimiento } = useEmergencia()
  return <Switch label="Menos movimiento" checked={preferenciaMovimiento} onChange={(e: { target: { checked: boolean } }) => setMenosMovimiento(e.target.checked)} />
}
