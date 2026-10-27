/**
 * Datos FICTICIOS de demostración (brief, hito 0). Los usan el seed de Supabase
 * (scripts/generar-seed.ts) y el repositorio en memoria (desarrollo y tests).
 *
 * Ningún nombre, RUT ni teléfono corresponde a una persona real: los RUT usan
 * cuerpos de 40 a 49 millones (fuera del rango de personas naturales), válidos
 * solo en su dígito verificador, y los celulares el rango 9 0000 xxxx.
 */
import { generarCodigoFamiliar } from '../shared/codigo.ts'
import { vigenteHasta } from '../shared/incentivos.ts'
import { digitoVerificador } from '../shared/rut.ts'

/** Genera el set completo. Determinista salvo las fechas, relativas a `hoy`. */
export function datosDemo(hoy: Date = new Date()) {
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

  const juntas = [
    { id: uuid(2, 1), nombre: 'Junta de vecinos Villa Los Aromos', sector: 0, estimados: 40, premio: 'Señalética de evacuación para la villa' },
    { id: uuid(2, 2), nombre: 'Junta de vecinos Población Centro', sector: 0, estimados: 60, premio: 'Caja comunitaria de emergencia' },
    { id: uuid(2, 3), nombre: 'Junta de vecinos El Molino', sector: 1, estimados: 30, premio: 'Mejora de la plaza del sector' },
    { id: uuid(2, 4), nombre: 'Junta de vecinos Las Viñas', sector: 1, estimados: 25, premio: 'Nuevas luminarias en el pasaje principal' },
    { id: uuid(2, 5), nombre: 'Junta de vecinos Ribera Alta', sector: 2, estimados: 20, premio: 'Caja comunitaria de emergencia' },
    { id: uuid(2, 6), nombre: 'Junta de vecinos Los Canales', sector: 2, estimados: 15, premio: 'Señalética de evacuación' },
  ]

  const puntos = [
    { id: uuid(3, 1), nombre: 'Gimnasio municipal', direccion: 'Calle ficticia 100, Hualañé', sector: 0 },
    { id: uuid(3, 2), nombre: 'Sede social La Huerta', direccion: 'Camino ficticio s/n, La Huerta', sector: 1 },
  ]

  const aliados = [
    { id: uuid(4, 1), nombre: 'Almacén Don Ficticio', tipo: 'comercio', direccion: 'Calle ficticia 210, Hualañé' },
    { id: uuid(4, 2), nombre: 'Panadería La Espiga (ficticia)', tipo: 'comercio', direccion: 'Calle ficticia 45, Hualañé' },
    { id: uuid(4, 3), nombre: 'Cuerpo de Bomberos (ejemplo)', tipo: 'institucion', direccion: 'Calle ficticia 1, Hualañé' },
    { id: uuid(4, 4), nombre: 'Ferretería El Clavo (ficticia)', tipo: 'comercio', direccion: 'Calle ficticia 330, Hualañé' },
  ]

  const beneficios = [
    { titulo: '10 % de descuento en tu compra', desc: 'En productos de despensa, una vez al mes.', aliado: 0, cat: 'comercio', nivel: 1, cupos: null, orden: 1 },
    { titulo: 'Pan amasado de regalo', desc: 'Media docena al mostrar tu tarjeta.', aliado: 1, cat: 'comercio', nivel: 1, cupos: 100, orden: 2 },
    { titulo: 'Prioridad en operativo de mascotas', desc: 'Chip y vacuna antirrábica con hora reservada.', aliado: null, cat: 'mascotas', nivel: 1, cupos: 80, orden: 3 },
    { titulo: 'Taller de primeros auxilios', desc: 'Cupo reservado en el taller de la temporada.', aliado: 2, cat: 'capacitacion', nivel: 1, cupos: 40, orden: 4 },
    { titulo: 'Entrada a actividades municipales', desc: 'Acceso preferente a eventos con cupo.', aliado: null, cat: 'actividad', nivel: 1, cupos: null, orden: 5 },
    { titulo: '15 % en artículos de emergencia', desc: 'Linternas, pilas y extintores.', aliado: 3, cat: 'comercio', nivel: 2, cupos: null, orden: 6 },
    { titulo: 'Visita de revisión de tu casa', desc: 'Bomberos revisa riesgos de incendio en tu casa.', aliado: 2, cat: 'servicio_municipal', nivel: 3, cupos: 20, orden: 7 },
    { titulo: 'Premio para tu barrio', desc: 'Si tu junta llega a la meta, el barrio gana su premio.', aliado: null, cat: 'barrio', nivel: 1, cupos: null, orden: 8 },
  ].map((b, i) => ({ ...b, id: uuid(5, i + 1) }))

  const usuarios = [
    { id: uuid(6, 1), email: 'admin.demo@example.cl', nombre: 'Administración (demo)', rol: 'admin' },
    { id: uuid(6, 2), email: 'funcionaria.demo@example.cl', nombre: 'Funcionaria demo', rol: 'funcionario' },
    { id: uuid(6, 3), email: 'funcionario.demo@example.cl', nombre: 'Funcionario demo', rol: 'funcionario' },
  ]

  const items = ['Agua embotellada', 'Caja de alimentos', 'Kit de higiene', 'Frazada', 'Colchón', 'Pañales', 'Alimento para mascotas']

  const nombres = ['Camila', 'Javiera', 'Constanza', 'Francisca', 'Valentina', 'Matías', 'Benjamín', 'Vicente', 'Tomás', 'Joaquín', 'Rosa', 'Luis', 'Carmen', 'Pedro']
  const apellidos = ['Ficticia', 'Ejemplo', 'Demostración', 'Prueba', 'Muestra', 'Ensayo', 'Simulada', 'Modelo']
  const calles = ['Pasaje Uno', 'Pasaje Dos', 'Calle Larga', 'Camino Interior', 'Calle Nueva', 'Avenida Principal']

  const hogares = Array.from({ length: 20 }, (_, i) => {
    const cuerpo = String(entre(40_000_000, 49_999_999))
    const sinRut = i === 19 // un caso sin RUT
    const junta = elegir(juntas)
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
      whatsapp: `+5690000${String(1000 + i).padStart(4, '0')}`,
      sector: sectores[junta.sector]!.id,
      junta: junta.id,
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
      nivel: i % 5 === 0 ? 2 : 1,
      confirmado: confirmado.toISOString(),
      vigente: vigenteHasta(confirmado),
      recordatorios: azar() < 0.8,
    }
  })

  return { uuid, sectores, juntas, puntos, aliados, beneficios, usuarios, items, hogares }
}

export type DatosDemo = ReturnType<typeof datosDemo>
