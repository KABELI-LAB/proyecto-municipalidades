import type { CvData } from '../services/types'
import type { CvTemplate } from '../templates'

export type DisenoId = CvTemplate['id']

/**
 * Colores para los archivos exportados. react-pdf y docx no leen variables
 * CSS, así que se copian de design-system/tokens/colors.css (mantener en sincronía).
 */
export const COLOR = {
  azul: '#253786', // --blue-700
  verde: '#316B2C', // --green-700
  marfil: '#D9E4F5', // --blue-100 (texto claro sobre azul)
  grisTexto: '#1A1F2C', // --neutral-900
  grisClaro: '#ECEEF2', // --neutral-100
  grisMedio: '#585F70', // --neutral-600 (fechas)
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
