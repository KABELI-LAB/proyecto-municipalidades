import type { CvData } from '../services/types'
import type { CvTemplate } from '../templates'

export type DisenoId = CvTemplate['id']

/**
 * Colores para los archivos exportados. react-pdf y docx no leen variables
 * CSS, así que se copian de design-system/tokens.css (mantener en sincronía).
 */
export const COLOR = {
  azul: '#174A6E', // --muni-azul
  verde: '#4E7D52', // --muni-verde
  marfil: '#F5F1E8', // --muni-marfil
  grisTexto: '#263238', // --muni-gris-texto
  grisClaro: '#E8EDF0', // --muni-gris-claro
  grisMedio: '#5B6870', // tinte de gris-texto para fechas
} as const

export function contacto(cv: CvData): string[] {
  const { email, telefono, ubicacion, linkedin } = cv.contacto
  return [email, telefono, ubicacion, linkedin].filter((x): x is string => Boolean(x))
}

/** "María José Fuentes" + "moderno" → "CV-Maria-Jose-Fuentes-moderno" */
export function nombreBase(cv: CvData, diseno: DisenoId): string {
  const slug = cv.nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return ['CV', slug, diseno].filter(Boolean).join('-')
}

export const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const
