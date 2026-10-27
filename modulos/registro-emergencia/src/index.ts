/**
 * API pública del módulo. El sitio anfitrión solo importa desde aquí:
 *   import { RegistroEmergenciaTab, registroEmergenciaTabMeta } from '@muni/registro-emergencia'
 */
export { RegistroEmergenciaTab, type RegistroEmergenciaTabProps } from './RegistroEmergenciaTab'
export { crearApiHttp, type EmergenciaApi } from './servicios/api'

/** Metadatos para registrar la pestaña en el navbar y en el inicio. */
export const registroEmergenciaTabMeta = {
  id: 'registro-emergencia',
  label: 'Registro de emergencia',
  // Debe coincidir con BASE en src/lib/rutas.ts.
  path: '/emergencia',
  descripcion: 'Inscribe a tu familia, recibe tu Tarjeta Hogar Preparado y accede a beneficios.',
  icono: 'siren',
  tono: 'green',
} as const
