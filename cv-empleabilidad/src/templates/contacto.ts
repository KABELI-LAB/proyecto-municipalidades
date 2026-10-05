import type { CvData } from '../services/types'

export function contactoItems(cv: CvData): string[] {
  const { email, telefono, ubicacion, linkedin } = cv.contacto
  return [email, telefono, ubicacion, linkedin].filter((x): x is string => Boolean(x))
}
