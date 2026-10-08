import { parseCv } from '../lib/parseCv'
import type { CvAnalysis, CvAnalyzer, CvData, CvInput, CvResultado, Prioridad, Sugerencia } from './types'

/**
 * Analizador sin IA: reglas heurísticas sobre el texto extraído. Sirve para
 * desarrollar la UI y como respaldo. Devuelve exactamente el mismo contrato
 * que la IA real.
 */

const PESO: Record<Prioridad, number> = { alta: 14, media: 7, baja: 3 }
const FRASES_DEBILES = /^(encargad[oa] de|responsable de|a cargo de|funciones?:?|tareas?:?|apoyo en|ayudar? (a|en))\s*/i
const DATOS_SENSIBLES = /(\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b|estado civil|fecha de nacimiento|\bedad\b|\bnacionalidad\b|\breligi[oó]n\b)/i
const PLACEHOLDER_PERFIL =
  '[Escribe aquí 3 o 4 líneas: quién eres, en qué tienes experiencia, qué logros te destacan y qué trabajo buscas.]'

function mejorarLogro(logro: string): string {
  let l = logro.replace(/\.$/, '').trim()
  if (FRASES_DEBILES.test(l)) {
    l = 'Gestioné ' + l.replace(FRASES_DEBILES, '')
  }
  return l.charAt(0).toUpperCase() + l.slice(1)
}

export function analizarTexto({ texto, imagenes = 0 }: CvInput): CvAnalysis {
  const cv = parseCv(texto)
  const palabras = texto.split(/\s+/).filter(Boolean).length
  const sugerencias: Sugerencia[] = []
  const fortalezas: string[] = []
  const add = (s: Omit<Sugerencia, 'id'>) => sugerencias.push({ ...s, id: `s${sugerencias.length + 1}` })

  // Contacto
  if (!cv.contacto.email) {
    add({ seccion: 'contacto', prioridad: 'alta', titulo: 'Agrega un correo electrónico', detalle: 'Es la forma principal en que una empresa te contactará. Usa un correo con tu nombre, sin apodos.', ejemplo: 'nombre.apellido@gmail.com' })
  }
  if (!cv.contacto.telefono) {
    add({ seccion: 'contacto', prioridad: 'media', titulo: 'Agrega un teléfono de contacto', detalle: 'Escribe tu celular con el código de país.', ejemplo: '+56 9 1234 5678' })
  }
  if (cv.contacto.email && cv.contacto.telefono) fortalezas.push('Tus datos de contacto están completos y a la vista.')

  // Perfil
  if (!cv.perfil) {
    add({ seccion: 'perfil', prioridad: 'alta', titulo: 'Agrega un perfil profesional', detalle: 'Un párrafo breve al inicio ayuda a quien revisa tu CV a entender en segundos qué ofreces.', ejemplo: 'Formación técnica en administración, con 4 años de experiencia en atención de público y gestión documental. Destaco por mi orden y trato cordial. Busco aportar en servicios municipales.' })
  } else if (cv.perfil.length < 150) {
    add({ seccion: 'perfil', prioridad: 'media', titulo: 'Desarrolla más tu perfil', detalle: 'Tu perfil es muy breve. Menciona tus años de experiencia, tu área principal y un logro concreto.' })
  } else {
    fortalezas.push('Tienes un perfil profesional que te presenta.')
  }

  // Experiencia
  if (cv.experiencia.length === 0) {
    add({ seccion: 'experiencia', prioridad: 'alta', titulo: 'Agrega tu experiencia laboral', detalle: 'Si tienes poca experiencia formal, suma prácticas, trabajos de temporada, voluntariados o emprendimientos propios.' })
  } else {
    const logros = cv.experiencia.flatMap((e) => e.logros)
    if (cv.experiencia.some((e) => e.logros.length === 0)) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Describe logros en cada cargo', detalle: 'Escribe 2 o 3 viñetas por trabajo que cuenten qué conseguiste, no solo qué funciones tenías.' })
    }
    if (logros.length > 0 && !logros.some((l) => /\d/.test(l))) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Cuantifica tus resultados', detalle: 'Los números hacen creíbles tus logros: cantidades, porcentajes, plazos o personas atendidas.', ejemplo: 'Atendí a más de 40 personas al día y reduje los tiempos de espera en un 20 %.' })
    }
    const debil = logros.find((l) => FRASES_DEBILES.test(l))
    if (debil) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Usa verbos de acción', detalle: `Frases como “${debil.slice(0, 50)}” describen tareas, no resultados. Empieza con verbos como gestioné, lideré, implementé u organicé.`, ejemplo: mejorarLogro(debil) })
    }
    if (cv.experiencia.some((e) => !e.periodo)) {
      add({ seccion: 'experiencia', prioridad: 'baja', titulo: 'Indica fechas en cada experiencia', detalle: 'Escribe mes y año de inicio y de término (o “actualidad”).' })
    }
    if (cv.experiencia.length >= 2) fortalezas.push(`Detallas ${cv.experiencia.length} experiencias laborales.`)
  }

  // Educación
  if (cv.educacion.length === 0) {
    add({ seccion: 'educacion', prioridad: 'media', titulo: 'Agrega tu formación', detalle: 'Incluye tu último nivel de estudios, la institución y el año de egreso, además de cursos relevantes.' })
  } else {
    fortalezas.push('Tu formación está clara.')
  }

  // Habilidades e idiomas
  if (cv.habilidades.length < 4) {
    add({ seccion: 'habilidades', prioridad: 'media', titulo: 'Amplía tus habilidades', detalle: 'Menciona entre 6 y 10 habilidades concretas: programas que usas, licencias, certificaciones y habilidades blandas.', ejemplo: 'Excel intermedio · Licencia clase B · Atención de público · Trabajo en equipo' })
  } else {
    fortalezas.push('Tu lista de habilidades es clara.')
  }
  if (cv.idiomas.length === 0) {
    add({ seccion: 'idiomas', prioridad: 'baja', titulo: 'Indica tus idiomas y nivel', detalle: 'Aunque sea solo español nativo, indicarlo ordena tu CV. Si hablas otro idioma, señala el nivel.' })
  }

  // Formato
  if (palabras > 900) {
    add({ seccion: 'formato', prioridad: 'media', titulo: 'Acorta tu CV', detalle: 'Tu CV es extenso. Lo ideal es 1 página (2 si tienes más de 10 años de experiencia). Deja lo más reciente y relevante.' })
  } else if (palabras < 150) {
    add({ seccion: 'formato', prioridad: 'alta', titulo: 'Tu CV es muy breve', detalle: 'Hay poca información para conocer tu perfil. Completa experiencia, formación y habilidades.' })
  } else {
    fortalezas.push('La extensión del documento es adecuada.')
  }
  if (DATOS_SENSIBLES.test(texto)) {
    add({ seccion: 'formato', prioridad: 'baja', titulo: 'Quita datos personales innecesarios', detalle: 'RUT, edad, estado civil o fecha de nacimiento no son necesarios en un CV y pueden generar sesgos. Inclúyelos solo si la postulación lo pide.' })
  }

  // Imágenes: no se ven, solo se sabe cuántas hay.
  if (imagenes === 1) {
    add({ seccion: 'formato', prioridad: 'baja', titulo: 'Revisa la imagen de tu CV', detalle: 'Tu CV tiene una imagen. Si es una foto tuya, que sea tipo carnet, reciente y con fondo neutro; en Chile la foto es opcional. Si es otra imagen (mascotas, paisajes, decoración), quítala.' })
  } else if (imagenes > 1) {
    add({ seccion: 'formato', prioridad: 'media', titulo: 'Reduce las imágenes', detalle: `Tu CV tiene ${imagenes} imágenes. Íconos, logos y adornos distraen y pueden impedir que los sistemas de selección lean tu CV. Deja como máximo una foto tipo carnet.` })
  }

  const descuento = sugerencias.reduce((t, s) => t + PESO[s.prioridad], 0)
  const puntaje = Math.max(20, Math.min(96, 100 - descuento))

  return {
    puntaje,
    resumen: resumenPara(puntaje, sugerencias),
    fortalezas: fortalezas.slice(0, 4),
    sugerencias: sugerencias.sort((a, b) => PESO[b.prioridad] - PESO[a.prioridad]),
    cvMejorado: mejorarCv(cv),
    origen: 'mock',
  }
}

function resumenPara(puntaje: number, sugerencias: Sugerencia[]): string {
  const altas = sugerencias.filter((s) => s.prioridad === 'alta').length
  if (puntaje >= 80) return 'Tu CV va bien encaminado. Con algunos ajustes quedará listo para postular.'
  if (puntaje >= 60) {
    return `Tu CV tiene una buena base. Empieza por ${altas ? `las ${altas} sugerencias de prioridad alta` : 'las sugerencias de prioridad media'}.`
  }
  return 'Tu CV necesita mejoras importantes antes de postular. Sigue las sugerencias en orden de prioridad.'
}

function mejorarCv(cv: CvData): CvData {
  return {
    ...cv,
    nombre: cv.nombre || '[Tu nombre completo]',
    titular: cv.titular || '[Cargo u oficio que buscas]',
    perfil: cv.perfil || PLACEHOLDER_PERFIL,
    experiencia: cv.experiencia.map((e) => ({
      ...e,
      cargo: e.cargo || '[Cargo]',
      logros: e.logros.map(mejorarLogro),
    })),
    habilidades: [...new Set(cv.habilidades.map((h) => h.charAt(0).toUpperCase() + h.slice(1)))],
    idiomas: cv.idiomas.length ? cv.idiomas : ['Español (nativo)'],
  }
}

/**
 * ¿Parece un CV? Regla simple: debe tener al menos 2 señales típicas
 * (contacto, experiencia, formación, habilidades, perfil). Una receta, un
 * contrato o un apunte de clases no las tienen.
 */
export function pareceCv(texto: string): boolean {
  const cv = parseCv(texto)
  const señales = [
    cv.contacto.email || cv.contacto.telefono,
    cv.experiencia.length > 0,
    cv.educacion.length > 0,
    cv.habilidades.length > 0,
    cv.perfil.length > 0,
  ].filter(Boolean).length
  return señales >= 2
}

export function evaluarDocumento(input: CvInput): CvResultado {
  if (!pareceCv(input.texto)) {
    return {
      esCv: false,
      motivo: 'No encontramos las partes básicas de un currículum.',
      origen: 'mock',
    }
  }
  return { esCv: true, ...analizarTexto(input) }
}

export const mockAnalyzer: CvAnalyzer = {
  avisoPrivacidad: 'Revisamos tu CV en tu navegador. No lo guardamos.',
  async analyze(input, signal) {
    // Simula la latencia de la IA para poder diseñar los estados de carga.
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 1200)
      signal?.addEventListener('abort', () => {
        clearTimeout(t)
        reject(new DOMException('Cancelado', 'AbortError'))
      })
    })
    return evaluarDocumento(input)
  },
}
