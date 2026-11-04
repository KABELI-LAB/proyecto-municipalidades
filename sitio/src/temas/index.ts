import type { MunicipioId } from '@muni/design-system'
import type { ComponentType } from 'react'
import * as curepto from './curepto'
import * as hualane from './hualane'
import * as vichuquen from './vichuquen'

/**
 * Lo que cambia del sitio según el municipio: header, inicio, footer y su hoja de
 * estilos (copiados de cada proyecto). Los colores, fuentes y formas salen de los
 * tokens del design system (data-tema en <html>); los módulos son los mismos.
 */
export interface TemaSitio {
  Header: ComponentType
  Inicio: ComponentType
  Pie: ComponentType
  estilos: Record<string, string>
}

export const TEMAS: Record<MunicipioId, TemaSitio> = { hualane, curepto, vichuquen }
