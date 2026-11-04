// Distancias sobre coordenadas aproximadas (demo/coordenadas.json).

export type Punto = { lat: number; lng: number };

const RADIO_TIERRA_KM = 6371;

/** Distancia en kilómetros entre dos puntos (fórmula del haversine). */
export function distanciaKm(a: Punto, b: Punto): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

/** Punto válido solo si trae ambas coordenadas. */
export function punto(lat: number | null | undefined, lng: number | null | undefined): Punto | null {
  return lat == null || lng == null ? null : { lat, lng };
}
