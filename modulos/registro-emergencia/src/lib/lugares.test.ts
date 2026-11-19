import { describe, expect, it } from 'vitest'
import { direccionCercana, normalizar, sugerir, type IndiceLugares } from './lugares'

// Índice de prueba (nombres y puntos inventados).
const INDICE: IndiceLugares = {
  comuna: 'hualane',
  nombre: 'Hualañé',
  limites: { sur: -35.1, norte: -34.8, oeste: -72, este: -71.4 },
  centro: [-34.977, -71.801],
  calles: [
    { n: 'Arturo Prat', l: 'Hualañé', g: [[[-34.977, -71.803], [-34.977, -71.799]]] },
    { n: 'Los Aromos', l: 'Villa España', g: [[[-34.98, -71.81], [-34.981, -71.81]]] },
    { n: 'Calle 1', l: 'La Huerta', g: [[[-34.95, -71.75], [-34.95, -71.749]]] },
  ],
  lugares: [
    { n: 'Hualañé', t: 'town', c: [-34.977, -71.801] },
    { n: 'La Huerta', t: 'hamlet', c: [-34.951, -71.75] },
    { n: 'Villa España', t: 'neighbourhood', c: [-34.98, -71.81] },
  ],
}

describe('sugerir', () => {
  it('encuentra calles sin tildes ni mayúsculas y conserva el número de casa', () => {
    const [primera] = sugerir(INDICE, 'arturo prat 123')
    expect(primera).toMatchObject({ tipo: 'calle', texto: 'Arturo Prat 123', detalle: 'Hualañé' })
  })

  it('busca por el comienzo de cualquier palabra e incluye la localidad', () => {
    expect(sugerir(INDICE, 'aromos')[0]).toMatchObject({ texto: 'Los Aromos', detalle: 'Villa España, Hualañé' })
  })

  it('sugiere lugares poblados (pueblos, villas)', () => {
    expect(sugerir(INDICE, 'huerta').map((s) => s.texto)).toContain('La Huerta')
  })

  it('no sugiere con menos de 2 letras ni cuando nada coincide', () => {
    expect(sugerir(INDICE, 'a')).toEqual([])
    expect(sugerir(INDICE, 'zzz')).toEqual([])
  })

  it('normaliza tildes y signos', () => {
    expect(normalizar('  Hualañé, Plaza  ')).toBe('hualane  plaza')
  })
})

describe('direccionCercana', () => {
  it('en el pueblo devuelve la calle más cercana', () => {
    expect(direccionCercana(INDICE, -34.9771, -71.801)).toEqual({ tipo: 'calle', texto: 'Arturo Prat' })
  })

  it('en el campo agrega la localidad a la calle', () => {
    expect(direccionCercana(INDICE, -34.9501, -71.7495)).toEqual({ tipo: 'calle', texto: 'Calle 1, La Huerta' })
  })

  it('lejos de las calles usa el lugar poblado más cercano, como referencia si está lejos, y nada a más de 10 km', () => {
    expect(direccionCercana(INDICE, -34.96, -71.75)).toEqual({ tipo: 'lugar', texto: 'Sector La Huerta' })
    expect(direccionCercana(INDICE, -34.99, -71.71)).toEqual({ tipo: 'lugar', texto: 'Cerca de La Huerta' })
    expect(direccionCercana(INDICE, -34.85, -71.5)).toBeNull()
  })
})
