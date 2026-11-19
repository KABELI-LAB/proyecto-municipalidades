/**
 * Genera src/lib/lugares/<comuna>.ts: calles con nombre y lugares poblados (pueblos,
 * villas, sectores) de Hualañé, Curepto y Vichuquén, desde OpenStreetMap (Overpass).
 * Con esto el cuestionario sugiere direcciones mientras se escribe y completa la
 * dirección al tocar el mapa, sin enviar a terceros lo que escribe la persona.
 *
 *   npm run lugares                      # descarga de Overpass y genera
 *   npm run lugares -- --desde <carpeta>  # usa <comuna>.json ya descargados
 *
 * Datos © colaboradores de OpenStreetMap, licencia ODbL (se cita en la interfaz).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const COMUNAS = [
  { id: 'hualane', nombre: 'Hualañé' },
  { id: 'curepto', nombre: 'Curepto' },
  { id: 'vichuquen', nombre: 'Vichuquén' },
] as const

const SERVIDORES = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

type Punto = [number, number]
interface ElementoOsm {
  type: 'node' | 'way' | 'relation'
  tags?: Record<string, string>
  lat?: number
  lon?: number
  geometry?: { lat: number; lon: number }[]
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number }
}

const consulta = (nombre: string) =>
  `[out:json][timeout:180];rel["boundary"="administrative"]["admin_level"="8"]["name"="${nombre}"];out tags bb;` +
  `map_to_area->.a;(way(area.a)["highway"]["name"];node(area.a)["place"]["name"];);out tags geom;`

async function descargar(nombre: string): Promise<ElementoOsm[]> {
  for (let intento = 0; intento < 9; intento++) {
    const servidor = SERVIDORES[intento % SERVIDORES.length]!
    try {
      const r = await fetch(servidor, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'proyecto-municipalidades/1.0 (generar-lugares)' },
        body: new URLSearchParams({ data: consulta(nombre) }),
      })
      if (r.ok) return ((await r.json()) as { elements: ElementoOsm[] }).elements
      console.warn(`${nombre}: ${servidor} respondió ${r.status}`)
    } catch (e) {
      console.warn(`${nombre}: ${servidor} falló (${String(e)})`)
    }
    await new Promise((ok) => setTimeout(ok, 20_000 + intento * 15_000))
  }
  throw new Error(`No se pudo descargar ${nombre}. Los servidores de Overpass están ocupados: inténtalo más tarde.`)
}

const r5 = (v: number) => Math.round(v * 1e5) / 1e5

/** Distancia aproximada en metros (equirectangular: basta a escala de comuna). */
function metros(a: Punto, b: Punto): number {
  const x = (b[1] - a[1]) * Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180))
  const y = b[0] - a[0]
  return Math.sqrt(x * x + y * y) * 111_320
}

/** Douglas-Peucker: quita vértices que se desvían menos de `tol` metros. */
function simplificar(linea: Punto[], tol = 6): Punto[] {
  if (linea.length <= 2) return linea
  const [a, b] = [linea[0]!, linea.at(-1)!]
  let maxD = 0
  let idx = 0
  for (let i = 1; i < linea.length - 1; i++) {
    const d = distanciaASegmento(linea[i]!, a, b)
    if (d > maxD) [maxD, idx] = [d, i]
  }
  if (maxD <= tol) return [a, b]
  return [...simplificar(linea.slice(0, idx + 1), tol).slice(0, -1), ...simplificar(linea.slice(idx), tol)]
}

function distanciaASegmento(p: Punto, a: Punto, b: Punto): number {
  const k = Math.cos(p[0] * (Math.PI / 180))
  const [ax, ay, bx, by, px, py] = [a[1] * k, a[0], b[1] * k, b[0], p[1] * k, p[0]]
  const dx = bx - ax
  const dy = by - ay
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) * 111_320
}

const LUGARES_POBLADOS = new Set(['town', 'village', 'hamlet', 'neighbourhood', 'suburb', 'locality', 'isolated_dwelling', 'quarter'])

function generar(id: string, nombre: string, elementos: ElementoOsm[]): string {
  const rel = elementos.find((e) => e.type === 'relation' && e.bounds)
  if (!rel?.bounds) throw new Error(`${nombre}: falta el límite comunal en los datos`)
  const lugares = elementos
    .filter((e) => e.type === 'node' && e.tags?.name && LUGARES_POBLADOS.has(e.tags.place ?? ''))
    .map((e) => ({ n: e.tags!.name!, t: e.tags!.place!, c: [r5(e.lat!), r5(e.lon!)] as Punto }))
    .sort((a, b) => a.n.localeCompare(b.n, 'es'))

  // Localidad de una calle: el pueblo o localidad rural más cercano (a menos de 2,5 km).
  // Las villas y barrios (neighbourhood) no cuentan: una calle del pueblo cruza varias
  // y quedaría repetida ("Arturo Prat, Estadio" y "Arturo Prat, Hualañé").
  const localidades = lugares.filter((l) => !['neighbourhood', 'suburb', 'quarter'].includes(l.t))
  const localidad = (p: Punto) => {
    let mejor: { n: string; d: number } | null = null
    for (const l of localidades) {
      const d = metros(p, l.c)
      if (d < 2500 && (!mejor || d < mejor.d)) mejor = { n: l.n, d }
    }
    return mejor?.n ?? nombre
  }

  // Una calle = mismo nombre y misma localidad (hay "Calle 1" en varios pueblos).
  const calles = new Map<string, { n: string; l: string; g: Punto[][] }>()
  for (const w of elementos) {
    if (w.type !== 'way' || !w.tags?.name || !w.geometry?.length) continue
    const linea = simplificar(w.geometry.map((g) => [r5(g.lat), r5(g.lon)] as Punto))
    const l = localidad(linea[Math.floor(linea.length / 2)]!)
    const clave = `${w.tags.name}|${l}`
    const calle = calles.get(clave) ?? { n: w.tags.name, l, g: [] }
    calle.g.push(linea)
    calles.set(clave, calle)
  }

  const b = rel.bounds
  const pueblo = lugares.find((l) => l.n === nombre && (l.t === 'town' || l.t === 'village'))
  const indice = {
    comuna: id,
    nombre,
    limites: { sur: r5(b.minlat - 0.02), norte: r5(b.maxlat + 0.02), oeste: r5(b.minlon - 0.02), este: r5(b.maxlon + 0.02) },
    centro: pueblo?.c ?? [r5((b.minlat + b.maxlat) / 2), r5((b.minlon + b.maxlon) / 2)],
    calles: [...calles.values()].sort((a, b) => a.n.localeCompare(b.n, 'es') || a.l.localeCompare(b.l, 'es')),
    lugares,
  }
  console.log(`${nombre}: ${indice.calles.length} calles, ${lugares.length} lugares. Límites:`, JSON.stringify(indice.limites), 'Centro:', JSON.stringify(indice.centro))

  const json = (v: unknown) => JSON.stringify(v)
  return [
    `// GENERADO por scripts/generar-lugares.ts (npm run lugares). No editar a mano.`,
    `// Datos © colaboradores de OpenStreetMap, licencia ODbL. ${new Date().toISOString().slice(0, 10)}.`,
    `import type { IndiceLugares } from '../lugares.ts'`,
    ``,
    `const indice: IndiceLugares = {`,
    `  comuna: ${json(indice.comuna)},`,
    `  nombre: ${json(indice.nombre)},`,
    `  limites: ${json(indice.limites)},`,
    `  centro: ${json(indice.centro)},`,
    `  calles: [`,
    ...indice.calles.map((c) => `    ${json(c)},`),
    `  ],`,
    `  lugares: [`,
    ...indice.lugares.map((l) => `    ${json(l)},`),
    `  ],`,
    `}`,
    ``,
    `export default indice`,
    ``,
  ].join('\n')
}

const desde = process.argv.includes('--desde') ? process.argv[process.argv.indexOf('--desde') + 1] : null
const destino = fileURLToPath(new URL('../src/lib/lugares/', import.meta.url))
for (const c of COMUNAS) {
  if (desde && !existsSync(join(desde, `${c.id}.json`))) {
    console.warn(`${c.nombre}: no está ${c.id}.json en ${desde}; se mantiene el archivo actual.`)
    continue
  }
  const elementos = desde
    ? (JSON.parse(readFileSync(join(desde, `${c.id}.json`), 'utf8')) as { elements: ElementoOsm[] }).elements
    : await descargar(c.nombre)
  writeFileSync(join(destino, `${c.id}.ts`), generar(c.id, c.nombre, elementos))
}
