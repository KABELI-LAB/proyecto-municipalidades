/**
 * Límites aproximados de cada comuna (caja del límite comunal de OpenStreetMap
 * con ~2 km de margen; ver scripts/generar-lugares.ts). La ubicación de la casa
 * es opcional, pero si viene debe estar dentro de la comuna del municipio elegido
 * en el sitio: el GPS de alguien que se inscribe desde otra ciudad no sirve para
 * llegar a su casa.
 */
export const COMUNAS = {
  hualane: {
    nombre: 'Hualañé',
    limites: { sur: -35.12479, norte: -34.79786, oeste: -71.96832, este: -71.4379 },
    /** Centro del pueblo (Plaza de Armas). */
    centro: [-34.97749, -71.80121] as [number, number],
  },
  curepto: {
    nombre: 'Curepto',
    limites: { sur: -35.36684, norte: -34.9509, oeste: -72.2322, este: -71.65143 },
    centro: [-35.09372, -72.01808] as [number, number],
  },
  vichuquen: {
    nombre: 'Vichuquén',
    limites: { sur: -34.99455, norte: -34.66452, oeste: -72.17826, este: -71.84849 },
    centro: [-34.88402, -71.99237] as [number, number],
  },
} as const

export type ComunaId = keyof typeof COMUNAS
export const COMUNA_IDS = Object.keys(COMUNAS) as ComunaId[]

export function dentroDeComuna(comuna: ComunaId, lat: number, lng: number): boolean {
  const l = COMUNAS[comuna].limites
  return lat >= l.sur && lat <= l.norte && lng >= l.oeste && lng <= l.este
}

export const mensajeFuera = (comuna: ComunaId) =>
  `Esa ubicación está fuera de ${COMUNAS[comuna].nombre}. Toca tu casa en el mapa o deja solo la dirección.`
