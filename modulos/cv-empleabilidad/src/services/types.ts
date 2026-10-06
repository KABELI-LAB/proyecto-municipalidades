/**
 * Contrato de datos del módulo. Es la misma forma que deberá devolver el
 * backend de IA (ver docs/contrato-ia.md). Si cambias algo aquí, actualiza
 * ese documento y el mock.
 */

export type Seccion =
  | 'contacto'
  | 'perfil'
  | 'experiencia'
  | 'educacion'
  | 'habilidades'
  | 'idiomas'
  | 'formato'

export type Prioridad = 'alta' | 'media' | 'baja'

export interface Sugerencia {
  id: string
  seccion: Seccion
  prioridad: Prioridad
  titulo: string
  detalle: string
  /** Reescritura o ejemplo concreto, opcional. */
  ejemplo?: string
}

export interface Experiencia {
  cargo: string
  organizacion: string
  periodo: string
  logros: string[]
}

export interface Educacion {
  titulo: string
  institucion: string
  periodo: string
}

export interface CvData {
  nombre: string
  titular: string
  contacto: {
    email?: string
    telefono?: string
    ubicacion?: string
    linkedin?: string
  }
  perfil: string
  experiencia: Experiencia[]
  educacion: Educacion[]
  habilidades: string[]
  idiomas: string[]
}

export interface CvAnalysis {
  /** 0–100 */
  puntaje: number
  resumen: string
  fortalezas: string[]
  sugerencias: Sugerencia[]
  /** CV reestructurado y mejorado; alimenta los 3 diseños. */
  cvMejorado: CvData
  origen: 'mock' | 'ia'
}

export interface CvInput {
  texto: string
  nombreArchivo: string
}

export interface CvAnalyzer {
  analyze(input: CvInput, signal?: AbortSignal): Promise<CvAnalysis>
  /** Texto que explica a la persona qué pasa con su CV. */
  avisoPrivacidad?: string
}

/** Error con un mensaje apto para mostrar en pantalla. */
export class AnalisisError extends Error {}
