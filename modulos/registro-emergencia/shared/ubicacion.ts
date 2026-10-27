/**
 * Límites aproximados de la comuna de Hualañé (con margen). La ubicación de la
 * casa es opcional, pero si viene debe estar dentro: el GPS de alguien que se
 * inscribe desde otra ciudad no sirve para llegar a su casa.
 */
export const LIMITES_HUALANE = {
  sur: -35.2,
  norte: -34.8,
  oeste: -72.1,
  este: -71.45,
} as const

/** Centro aproximado (Plaza de Armas). */
export const CENTRO_HUALANE: [number, number] = [-34.9766, -71.8044]

export function dentroDeHualane(lat: number, lng: number): boolean {
  const l = LIMITES_HUALANE
  return lat >= l.sur && lat <= l.norte && lng >= l.oeste && lng <= l.este
}

export const MENSAJE_FUERA = 'Esa ubicación está fuera de Hualañé. Toca tu casa en el mapa o deja solo la dirección.'
