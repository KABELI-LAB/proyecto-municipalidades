import type { MunicipioId } from '@muni/design-system'
import type { CvData } from '../services/types'
import type { CvTemplate } from '../templates'

export type DisenoId = CvTemplate['id']

/**
 * Colores para los archivos exportados, según el municipio (tema). react-pdf y docx
 * no leen variables CSS, así que se copian de design-system/tokens/colors.css y
 * tokens/temas/*.css (mantener en sincronía).
 */
export interface ColoresExport {
  azul: string
  verde: string
  marfil: string
  grisTexto: string
  grisClaro: string
  grisMedio: string
}

const COLORES: Record<MunicipioId, ColoresExport> = {
  hualane: {
    azul: '#253786', // --blue-700
    verde: '#316B2C', // --green-700
    marfil: '#D9E4F5', // --blue-100 (texto claro sobre azul)
    grisTexto: '#1A1F2C', // --neutral-900
    grisClaro: '#ECEEF2', // --neutral-100
    grisMedio: '#585F70', // --neutral-600 (fechas)
  },
  curepto: {
    azul: '#00468C', // --blue-700 (azul-municipal)
    verde: '#122536', // --blue-900 (azul-noche; segundo color de los diseños)
    marfil: '#D6E4F3', // --blue-100
    grisTexto: '#1A1F2C',
    grisClaro: '#ECEEF2',
    grisMedio: '#585F70',
  },
  vichuquen: {
    azul: '#00626B', // --teal-700 (primary)
    verde: '#003B40', // --teal-900 (segundo color de los diseños)
    marfil: '#C9E4E6', // --teal-100
    grisTexto: '#172324',
    grisClaro: '#E7EEEE',
    grisMedio: '#4A5758',
  },
}

/** Colores vigentes. Los cambia usarColoresDe() justo antes de generar los archivos. */
export const COLOR: ColoresExport = { ...COLORES.hualane }

export function usarColoresDe(municipio: MunicipioId): void {
  Object.assign(COLOR, COLORES[municipio])
}

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
