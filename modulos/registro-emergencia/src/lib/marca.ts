/**
 * Marca de cada municipio para lo que se dibuja fuera del CSS (tarjeta PNG en canvas,
 * PDF y QR): hex copiados de design-system/tokens (colors.css y temas/*.css),
 * fuentes y escudo. Mantener en sincronía con el design system.
 */
import escudoCurepto from '@muni/design-system/assets/logo/curepto-escudo-azul-noche.png'
import escudoHualane from '@muni/design-system/assets/logo/escudo.png'
import escudoVichuquen from '@muni/design-system/assets/logo/vichuquen-escudo-color.png'
import type { MunicipioId } from '@muni/design-system'

export interface Marca {
  nombre: string
  escudo: string
  colores: {
    blue500: string
    blue700: string
    blue950: string
    neutral200: string
    neutral600: string
    texto: string
  }
  /** Las tres ondas al pie de la tarjeta, de arriba abajo. */
  ondas: [string, string, string]
  fuente: string
  fuenteMono: string
}

export const MARCAS: Record<MunicipioId, Marca> = {
  hualane: {
    nombre: 'Hualañé',
    escudo: escudoHualane,
    colores: { blue500: '#1270B7', blue700: '#253786', blue950: '#0D1533', neutral200: '#DCDFE6', neutral600: '#585F70', texto: '#0E121B' },
    // Cauce: azul río, blanco y verde valle
    ondas: ['#1270B7', 'rgba(255,255,255,.55)', '#3AAA35'],
    fuente: '"Atkinson Hyperlegible Next", system-ui, sans-serif',
    fuenteMono: '"Atkinson Hyperlegible Mono", monospace',
  },
  curepto: {
    nombre: 'Curepto',
    escudo: escudoCurepto,
    colores: { blue500: '#1A63AA', blue700: '#00468C', blue950: '#09121B', neutral200: '#DCDFE6', neutral600: '#585F70', texto: '#122536' },
    ondas: ['#1A63AA', 'rgba(255,255,255,.55)', '#FFCC00'],
    fuente: 'Roboto, system-ui, sans-serif',
    fuenteMono: '"Roboto Mono", monospace',
  },
  vichuquen: {
    nombre: 'Vichuquén',
    escudo: escudoVichuquen,
    colores: { blue500: '#007E84', blue700: '#00626B', blue950: '#00282C', neutral200: '#D3DCDD', neutral600: '#4A5758', texto: '#172324' },
    // Oleaje: blanco, teal-300 y hilo dorado
    ondas: ['rgba(255,255,255,.9)', '#5FAAB1', '#CA893E'],
    fuente: 'Lexend, system-ui, sans-serif',
    fuenteMono: '"IBM Plex Mono", monospace',
  },
}
