import { parseCv } from '../lib/parseCv'
import type { CvAnalysis, CvAnalyzer, CvData, CvInput, Prioridad, Sugerencia } from './types'

/**
 * Analizador sin IA: reglas heurísticas sobre el texto extraído. Sirve para
 * desarrollar la UI y como respaldo. Devuelve exactamente el mismo contrato
 * que la IA real.
 */

const PESO: Record<Prioridad, number> = { alta: 14, media: 7, baja: 3 }
const FRASES_DEBILES = /^(encargad[oa] de|responsable de|a cargo de|funciones?:?|tareas?:?|apoyo en|ayudar? (a|en))\s*/i
const DATOS_SENSIBLES = /(\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b|estado civil|fecha de nacimiento|\bedad\b|\bnacionalidad\b|\breligi[oó]n\b)/i
const PLACEHOLDER_PERFIL =
  '[Escriba aquí 3 o 4 líneas: quién es, en qué tiene experiencia, qué logros lo destacan y qué tipo de trabajo busca.]'

function mejorarLogro(logro: string): string {
  let l = logro.replace(/\.$/, '').trim()
  if (FRASES_DEBILES.test(l)) {
    l = 'Gestioné ' + l.replace(FRASES_DEBILES, '')
  }
  return l.charAt(0).toUpperCase() + l.slice(1)
}

export function analizarTexto({ texto }: CvInput): CvAnalysis {
  const cv = parseCv(texto)
  const palabras = texto.split(/\s+/).filter(Boolean).length
  const sugerencias: Sugerencia[] = []
  const fortalezas: string[] = []
  const add = (s: Omit<Sugerencia, 'id'>) => sugerencias.push({ ...s, id: `s${sugerencias.length + 1}` })

  // Contacto
  if (!cv.contacto.email) {
    add({ seccion: 'contacto', prioridad: 'alta', titulo: 'Agregue un correo electrónico', detalle: 'Es el principal medio por el que una empresa lo contactará. Use un correo con su nombre, no apodos.', ejemplo: 'nombre.apellido@gmail.com' })
  }
  if (!cv.contacto.telefono) {
    add({ seccion: 'contacto', prioridad: 'media', titulo: 'Incluya un teléfono de contacto', detalle: 'Agregue un número celular con código de país.', ejemplo: '+56 9 1234 5678' })
  }
  if (cv.contacto.email && cv.contacto.telefono) fortalezas.push('Sus datos de contacto están completos y visibles.')

  // Perfil
  if (!cv.perfil) {
    add({ seccion: 'perfil', prioridad: 'alta', titulo: 'Agregue un perfil profesional', detalle: 'Un párrafo breve al inicio ayuda a quien revisa su CV a entender en segundos qué ofrece.', ejemplo: 'Técnico en administración con 4 años de experiencia en atención de público y gestión documental. Destaco por mi orden y trato cordial. Busco aportar en el área de servicios municipales.' })
  } else if (cv.perfil.length < 150) {
    add({ seccion: 'perfil', prioridad: 'media', titulo: 'Desarrolle más su perfil', detalle: 'Su perfil es muy breve. Mencione años de experiencia, área principal y un logro concreto.' })
  } else {
    fortalezas.push('Incluye un perfil profesional que lo presenta.')
  }

  // Experiencia
  if (cv.experiencia.length === 0) {
    add({ seccion: 'experiencia', prioridad: 'alta', titulo: 'Incluya su experiencia laboral', detalle: 'Si tiene poca experiencia formal, agregue prácticas, trabajos de temporada, voluntariados o emprendimientos propios.' })
  } else {
    const logros = cv.experiencia.flatMap((e) => e.logros)
    if (cv.experiencia.some((e) => e.logros.length === 0)) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Describa logros en cada cargo', detalle: 'Agregue 2 o 3 viñetas por trabajo que expliquen qué consiguió, no solo qué funciones tenía.' })
    }
    if (logros.length > 0 && !logros.some((l) => /\d/.test(l))) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Cuantifique sus resultados', detalle: 'Los números hacen creíbles sus logros: cantidades, porcentajes, plazos o personas atendidas.', ejemplo: 'Atendí a más de 40 usuarios diarios, reduciendo los tiempos de espera en un 20 %.' })
    }
    const debil = logros.find((l) => FRASES_DEBILES.test(l))
    if (debil) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Use verbos de acción', detalle: `Frases como “${debil.slice(0, 50)}” describen tareas, no resultados. Empiece con verbos como gestioné, lideré, implementé u organicé.`, ejemplo: mejorarLogro(debil) })
    }
    if (cv.experiencia.some((e) => !e.periodo)) {
      add({ seccion: 'experiencia', prioridad: 'baja', titulo: 'Indique fechas en cada experiencia', detalle: 'Agregue mes y año de inicio y término (o “actualidad”).' })
    }
    if (cv.experiencia.length >= 2) fortalezas.push(`Detalla ${cv.experiencia.length} experiencias laborales.`)
  }

  // Educación
  if (cv.educacion.length === 0) {
    add({ seccion: 'educacion', prioridad: 'media', titulo: 'Agregue su formación', detalle: 'Incluya su último nivel de estudios, institución y año de egreso, además de cursos relevantes.' })
  } else {
    fortalezas.push('Su formación académica está identificada.')
  }

  // Habilidades e idiomas
  if (cv.habilidades.length < 4) {
    add({ seccion: 'habilidades', prioridad: 'media', titulo: 'Amplíe la sección de habilidades', detalle: 'Mencione entre 6 y 10 habilidades concretas: programas que maneja, licencias, certificaciones y habilidades blandas.', ejemplo: 'Excel intermedio · Licencia clase B · Atención de público · Trabajo en equipo' })
  } else {
    fortalezas.push('Presenta un listado claro de habilidades.')
  }
  if (cv.idiomas.length === 0) {
    add({ seccion: 'idiomas', prioridad: 'baja', titulo: 'Indique idiomas y nivel', detalle: 'Aunque sea solo español nativo, indicarlo ordena el CV. Si maneja otro idioma, señale el nivel.' })
  }

  // Formato
  if (palabras > 900) {
    add({ seccion: 'formato', prioridad: 'media', titulo: 'Reduzca la extensión', detalle: 'Su CV es extenso. Lo ideal es 1 página (2 si tiene más de 10 años de experiencia). Priorice lo más reciente y relevante.' })
  } else if (palabras < 150) {
    add({ seccion: 'formato', prioridad: 'alta', titulo: 'Su CV es muy breve', detalle: 'Hay poca información para evaluar su perfil. Complete experiencia, formación y habilidades.' })
  } else {
    fortalezas.push('La extensión del documento es adecuada.')
  }
  if (DATOS_SENSIBLES.test(texto)) {
    add({ seccion: 'formato', prioridad: 'baja', titulo: 'Evite datos personales innecesarios', detalle: 'RUT, edad, estado civil o fecha de nacimiento no son necesarios en un CV y pueden generar sesgos. Inclúyalos solo si la postulación lo exige.' })
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
  if (puntaje >= 80) return 'Su CV está bien encaminado. Con algunos ajustes de detalle quedará listo para postular.'
  if (puntaje >= 60) {
    return `Su CV tiene una buena base. Le recomendamos atender primero ${altas ? `las ${altas} sugerencias de prioridad alta` : 'las sugerencias de prioridad media'}.`
  }
  return 'Su CV necesita mejoras importantes antes de postular. Siga las sugerencias en orden de prioridad.'
}

function mejorarCv(cv: CvData): CvData {
  return {
    ...cv,
    nombre: cv.nombre || '[Su nombre completo]',
    titular: cv.titular || '[Cargo u oficio que busca]',
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

export const mockAnalyzer: CvAnalyzer = {
  avisoPrivacidad: 'Su CV se procesa en su navegador y no se almacena.',
  async analyze(input, signal) {
    // Simula la latencia de la IA para poder diseñar los estados de carga.
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 1200)
      signal?.addEventListener('abort', () => {
        clearTimeout(t)
        reject(new DOMException('Cancelado', 'AbortError'))
      })
    })
    return analizarTexto(input)
  },
}
