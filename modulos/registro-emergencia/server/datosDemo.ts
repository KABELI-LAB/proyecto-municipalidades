/**
 * Datos FICTICIOS de demostración. Los usan el seed de Supabase
 * (scripts/generar-seed.ts) y el repositorio en memoria (desarrollo y tests).
 *
 * Ningún nombre, RUT ni teléfono corresponde a una persona real: los RUT usan
 * cuerpos de 40 a 49 millones (fuera del rango de personas naturales), válidos
 * solo en su dígito verificador, y los celulares el rango 9 0000 xxxx.
 */
import { generarCodigoFamiliar } from '../shared/codigo.ts'
import { digitoVerificador } from '../shared/rut.ts'
import { vigenteHasta } from '../shared/tarjeta.ts'

/**
 * Genera el set completo. Determinista para la misma `cantidad` (mismos
 * nombres, RUT y códigos); las fechas son relativas a `hoy`.
 */
export function datosDemo(hoy: Date = new Date(), cantidad = 20) {
  // PRNG determinista (mulberry32) para que el seed sea reproducible.
  let semilla = 20261027
  function azar(): number {
    semilla |= 0
    semilla = (semilla + 0x6d2b79f5) | 0
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const entre = (min: number, max: number) => min + Math.floor(azar() * (max - min + 1))
  const elegir = <T>(xs: readonly T[]): T => xs[Math.floor(azar() * xs.length)] as T
  const bytes = (n: number) => Uint8Array.from({ length: n }, () => Math.floor(azar() * 256))

  // UUID fijos para poder relacionar filas en el SQL.
  const uuid = (grupo: number, n: number) => `00000000-0000-4000-8000-${String(grupo).padStart(4, '0')}${String(n).padStart(8, '0')}`

  const sectores = [
    { id: uuid(1, 1), nombre: 'Hualañé urbano', punto: 'Plaza de Armas de Hualañé' },
    { id: uuid(1, 2), nombre: 'La Huerta', punto: 'Cancha de La Huerta' },
    { id: uuid(1, 3), nombre: 'Sector rural ribera norte', punto: 'Escuela rural ribera norte' },
  ]

  // Beneficios y aliados: por definir con el equipo. Estos son solo de ejemplo.
  const aliados = [
    { id: uuid(4, 1), nombre: 'Almacén Don Ficticio', tipo: 'comercio', direccion: 'Calle ficticia 210, Hualañé' },
    { id: uuid(4, 2), nombre: 'Panadería La Espiga (ficticia)', tipo: 'comercio', direccion: 'Calle ficticia 45, Hualañé' },
    { id: uuid(4, 3), nombre: 'Cuerpo de Bomberos (ejemplo)', tipo: 'institucion', direccion: 'Calle ficticia 1, Hualañé' },
    { id: uuid(4, 4), nombre: 'Ferretería El Clavo (ficticia)', tipo: 'comercio', direccion: 'Calle ficticia 330, Hualañé' },
  ]

  const beneficios = [
    { titulo: '10 % de descuento en tu compra', desc: 'En productos de despensa, una vez al mes.', aliado: 0, cat: 'comercio', cupos: null, orden: 1 },
    { titulo: 'Pan amasado de regalo', desc: 'Media docena al mostrar tu tarjeta.', aliado: 1, cat: 'comercio', cupos: 100, orden: 2 },
    { titulo: 'Prioridad en operativo de mascotas', desc: 'Chip y vacuna antirrábica con hora reservada.', aliado: null, cat: 'mascotas', cupos: 80, orden: 3 },
    { titulo: 'Taller de primeros auxilios', desc: 'Cupo reservado en el taller de la temporada.', aliado: 2, cat: 'capacitacion', cupos: 40, orden: 4 },
  ].map((b, i) => ({ ...b, id: uuid(5, i + 1) }))

  const nombres = ['Camila', 'Javiera', 'Constanza', 'Francisca', 'Valentina', 'Matías', 'Benjamín', 'Vicente', 'Tomás', 'Joaquín', 'Rosa', 'Luis', 'Carmen', 'Pedro']
  const apellidos = ['Ficticia', 'Ejemplo', 'Demostración', 'Prueba', 'Muestra', 'Ensayo', 'Simulada', 'Modelo']
  const calles = ['Pasaje Uno', 'Pasaje Dos', 'Calle Larga', 'Camino Interior', 'Calle Nueva', 'Avenida Principal']

  const rutUsados = new Set<string>()
  const hogares = Array.from({ length: cantidad }, (_, i) => {
    let cuerpo = String(entre(40_000_000, 49_999_999))
    while (rutUsados.has(cuerpo)) cuerpo = String(entre(40_000_000, 49_999_999))
    rutUsados.add(cuerpo)
    const sinRut = i % 20 === 19 // uno de cada 20, sin RUT
    const total = entre(1, 6)
    const menores = Math.min(total - 1, entre(0, 3))
    const mayores = Math.min(total - menores, entre(0, 2))
    const bebes = menores > 0 ? entre(0, Math.min(1, menores)) : 0
    const confirmado = new Date(hoy.getTime() - entre(0, 200) * 86_400_000)
    return {
      id: uuid(7, i + 1),
      codigo: generarCodigoFamiliar(bytes),
      nombre: `${elegir(nombres)} ${elegir(apellidos)} ${elegir(apellidos)}`,
      rut: sinRut ? null : `${cuerpo}-${digitoVerificador(cuerpo)}`,
      provisorio: sinRut ? `PROV-DEMO-${String(i + 1).padStart(4, '0')}` : null,
      whatsapp: `+569000${String(10000 + i).padStart(5, '0')}`,
      sector: elegir(sectores).id,
      tenencia: elegir(['propia', 'arrendada', 'cedida', 'allegados'] as const),
      direccion: `${elegir(calles)} ${entre(1, 999)}, Hualañé`,
      total,
      menores,
      bebes,
      mayores,
      mascotas: entre(0, 3),
      ganado: azar() < 0.2 ? `${entre(2, 6)} gallinas` : null,
      origen: i % 7 === 0 ? 'asistido' : 'autorregistro',
      verificado: i % 3 === 0,
      confirmado: confirmado.toISOString(),
      vigente: vigenteHasta(confirmado),
      recordatorios: azar() < 0.8,
    }
  })

  return { uuid, sectores, aliados, beneficios, hogares }
}

export type DatosDemo = ReturnType<typeof datosDemo>
