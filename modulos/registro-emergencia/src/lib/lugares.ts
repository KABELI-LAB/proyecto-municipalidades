/**
 * Calles y lugares poblados de cada comuna (generados desde OpenStreetMap con
 * `npm run lugares`). Todo se busca en el navegador: lo que escribe la persona
 * no sale del sitio.
 */
import type { MunicipioId } from '@muni/design-system'

type Punto = [number, number]

export interface IndiceLugares {
  comuna: string
  nombre: string
  limites: { sur: number; norte: number; oeste: number; este: number }
  centro: Punto
  /** n: nombre, l: localidad, g: tramos de la calle (líneas de puntos lat, lng). */
  calles: { n: string; l: string; g: Punto[][] }[]
  /** n: nombre, t: tipo OSM (town, village, hamlet, neighbourhood…), c: punto. */
  lugares: { n: string; t: string; c: Punto }[]
}

export interface Sugerencia {
  tipo: 'calle' | 'lugar'
  /** Lo que queda escrito en el campo al elegirla. */
  texto: string
  /** Línea secundaria (localidad o tipo de lugar). */
  detalle: string
  lat: number
  lng: number
}

/** Carga bajo demanda: el índice de cada comuna pesa decenas de KB. */
export function cargarLugares(municipio: MunicipioId): Promise<IndiceLugares> {
  const cargas: Record<MunicipioId, () => Promise<{ default: IndiceLugares }>> = {
    hualane: () => import('./lugares/hualane.ts'),
    curepto: () => import('./lugares/curepto.ts'),
    vichuquen: () => import('./lugares/vichuquen.ts'),
  }
  return cargas[municipio]().then((m) => m.default)
}

/** Sin tildes ni mayúsculas, para comparar. */
export const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .trim()

const TIPOS: Record<string, string> = {
  town: 'Ciudad',
  village: 'Pueblo',
  hamlet: 'Localidad',
  neighbourhood: 'Villa o población',
  suburb: 'Barrio',
  quarter: 'Barrio',
  locality: 'Sector',
  isolated_dwelling: 'Sector',
}

/** Punto medio del tramo más largo: donde se pone el pin al elegir una calle. */
function puntoDeCalle(g: Punto[][]): Punto {
  const tramo = g.reduce((a, b) => (b.length > a.length ? b : a))
  return tramo[Math.floor(tramo.length / 2)]!
}

/**
 * Sugerencias para lo que se lleva escrito. El número de casa se separa y se
 * conserva: "aromos 123" → "Los Aromos 123".
 */
export function sugerir(indice: IndiceLugares, consulta: string, max = 6): Sugerencia[] {
  const numero = consulta.match(/(?:^|\s|#)(\d{1,5})\s*$/)?.[1] ?? ''
  const palabras = normalizar(numero ? consulta.slice(0, consulta.lastIndexOf(numero)) : consulta)
    .split(' ')
    .filter(Boolean)
  if (!palabras.length || palabras.join('').length < 2) return []

  // Puntaje: 0 = el nombre empieza con lo escrito, 1 = todas las palabras empiezan igual, 2 = aparecen dentro.
  const puntaje = (nombre: string): number | null => {
    const n = normalizar(nombre)
    if (n.startsWith(palabras.join(' '))) return 0
    const pal = n.split(' ')
    if (palabras.every((p) => pal.some((w) => w.startsWith(p)))) return 1
    if (palabras.every((p) => n.includes(p))) return 2
    return null
  }

  const candidatas: (Sugerencia & { p: number })[] = []
  for (const c of indice.calles) {
    const p = puntaje(c.n)
    if (p === null) continue
    const [lat, lng] = puntoDeCalle(c.g)
    candidatas.push({ tipo: 'calle', texto: `${c.n}${numero ? ` ${numero}` : ''}`, detalle: c.l === indice.nombre ? indice.nombre : `${c.l}, ${indice.nombre}`, lat, lng, p })
  }
  for (const l of indice.lugares) {
    const p = puntaje(l.n)
    if (p === null) continue
    candidatas.push({ tipo: 'lugar', texto: l.n, detalle: TIPOS[l.t] ?? 'Sector', lat: l.c[0], lng: l.c[1], p })
  }
  return candidatas
    .sort((a, b) => a.p - b.p || a.texto.length - b.texto.length || a.texto.localeCompare(b.texto, 'es'))
    .slice(0, max)
    .map((c) => ({ tipo: c.tipo, texto: c.texto, detalle: c.detalle, lat: c.lat, lng: c.lng }))
}

function metros(a: Punto, b: Punto): number {
  const x = (b[1] - a[1]) * Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180))
  return Math.hypot(x, b[0] - a[0]) * 111_320
}

function distanciaASegmento(p: Punto, a: Punto, b: Punto): number {
  const k = Math.cos(p[0] * (Math.PI / 180))
  const [ax, ay, bx, by, px, py] = [a[1] * k, a[0], b[1] * k, b[0], p[1] * k, p[0]]
  const dx = bx - ax
  const dy = by - ay
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) * 111_320
}

/**
 * Dirección aproximada de un punto del mapa: la calle más cercana (a menos de
 * 120 m) o, en el campo, el lugar poblado más cercano (sector a menos de 3 km;
 * "Cerca de…" hasta 10 km).
 */
export function direccionCercana(indice: IndiceLugares, lat: number, lng: number): { texto: string; tipo: 'calle' | 'lugar' } | null {
  const p: Punto = [lat, lng]
  let calle: { n: string; l: string; d: number } | null = null
  for (const c of indice.calles)
    for (const tramo of c.g)
      for (let i = 0; i < tramo.length - 1; i++) {
        const d = distanciaASegmento(p, tramo[i]!, tramo[i + 1]!)
        if (d < 120 && (!calle || d < calle.d)) calle = { n: c.n, l: c.l, d }
      }
  if (calle) {
    // En el campo, la localidad ayuda a llegar ("Calle 1, La Huerta"); en el pueblo basta la calle.
    const tipo = indice.lugares.find((l) => l.n === calle.l)?.t
    const rural = tipo === 'village' || tipo === 'hamlet' || tipo === 'locality' || tipo === 'isolated_dwelling'
    return { tipo: 'calle', texto: rural ? `${calle.n}, ${calle.l}` : calle.n }
  }

  let lugar: { n: string; d: number } | null = null
  for (const l of indice.lugares) {
    const d = metros(p, l.c)
    if (d < 10_000 && (!lugar || d < lugar.d)) lugar = { n: l.n, d }
  }
  if (!lugar) return null
  // A menos de 3 km es su sector ("Sector La Huerta", sin repetir si el nombre ya dice
  // "Sector…" o "Villa…"); más lejos, en pleno campo, solo una referencia ("Cerca de Gualleco").
  if (lugar.d >= 3000) return { tipo: 'lugar', texto: `Cerca de ${lugar.n}` }
  return { tipo: 'lugar', texto: /^(sector|villa|poblaci[oó]n)\b/i.test(lugar.n) ? lugar.n : `Sector ${lugar.n}` }
}
