import type { ComponentType } from 'react'
import type { CvData } from '../services/types'
import { ClasicoTemplate } from './ClasicoTemplate'
import { CompactoTemplate } from './CompactoTemplate'
import { ModernoTemplate } from './ModernoTemplate'

export interface TemplateProps {
  cv: CvData
}

export interface CvTemplate {
  id: 'clasico' | 'moderno' | 'compacto'
  nombre: string
  descripcion: string
  Component: ComponentType<TemplateProps>
}

export const TEMPLATES: CvTemplate[] = [
  { id: 'clasico', nombre: 'Clásico', descripcion: 'Una columna, sobrio y fácil de leer por sistemas de selección (ATS).', Component: ClasicoTemplate },
  { id: 'moderno', nombre: 'Moderno', descripcion: 'Barra lateral con contacto y habilidades; destaca su perfil.', Component: ModernoTemplate },
  { id: 'compacto', nombre: 'Compacto', descripcion: 'Denso y ordenado; ideal para trayectorias largas en una página.', Component: CompactoTemplate },
]
