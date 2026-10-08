/**
 * API pública del módulo. La app anfitriona solo debe importar desde aquí:
 *   import { CvTab } from '@muni/cv-empleabilidad'
 */
export { CvTab, type CvTabProps } from './CvTab'
export { mockAnalyzer } from './services/mockAnalyzer'
export { createHttpAnalyzer } from './services/httpAnalyzer'
export { createHttpMailer, mockMailer, type CvMailer } from './services/mailer'
export { AnalisisError, type CvAnalysis, type CvAnalyzer, type CvData, type CvInput, type Sugerencia } from './services/types'

/** Metadatos para registrar la pestaña en el sitio anfitrión. */
export const cvTabMeta = {
  id: 'cv',
  label: 'Revisa tu CV',
  path: '/empleabilidad/cv',
  descripcion: 'Sube tu currículum, recibe sugerencias para mejorarlo y descárgalo en tres diseños.',
  icono: 'file-user',
  tono: 'green',
} as const
