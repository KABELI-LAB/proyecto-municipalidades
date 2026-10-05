/**
 * API pública del módulo. El sitio anfitrión solo importa desde aquí:
 *   import { __Nombre__Tab, __nombre__TabMeta } from '@muni/__NOMBRE__'
 */
export { __Nombre__Tab } from './__Nombre__Tab'

/** Metadatos para registrar la pestaña en el navbar y en el inicio. */
export const __nombre__TabMeta = {
  id: '__NOMBRE__',
  label: '__LABEL__',
  path: '/__NOMBRE__',
  descripcion: '__DESCRIPCION__',
} as const
