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
    add({ seccion: 'contacto', prioridad: 'alta', titulo: 'Agrega tu correo', detalle: 'Así las empresas pueden contactarte. Usa uno con tu nombre.', ejemplo: 'nombre.apellido@gmail.com' })
  }
  if (!cv.contacto.telefono) {
    add({ seccion: 'contacto', prioridad: 'media', titulo: 'Agrega tu teléfono', detalle: 'Escribe tu número de celular.', ejemplo: '+56 9 1234 5678' })
  }
  if (cv.contacto.email && cv.contacto.telefono) fortalezas.push('Tus datos de contacto están completos.')

  // Perfil
  if (!cv.perfil) {
    add({ seccion: 'perfil', prioridad: 'alta', titulo: 'Agrega un párrafo sobre ti', detalle: 'Al inicio, cuenta en 3 líneas qué sabes hacer.', ejemplo: 'Formación técnica en administración, con 4 años de experiencia en atención de público y gestión documental. Destaco por mi orden y trato cordial. Busco aportar en servicios municipales.' })
  } else if (cv.perfil.length < 150) {
    add({ seccion: 'perfil', prioridad: 'media', titulo: 'Cuenta más sobre ti', detalle: 'Agrega cuántos años de experiencia tienes y en qué.' })
  } else {
    fortalezas.push('Tienes un párrafo que te presenta.')
  }

  // Experiencia
  if (cv.experiencia.length === 0) {
    add({ seccion: 'experiencia', prioridad: 'alta', titulo: 'Agrega tus trabajos', detalle: 'También cuentan prácticas, temporadas y trabajos por tu cuenta.' })
  } else {
    const logros = cv.experiencia.flatMap((e) => e.logros)
    if (cv.experiencia.some((e) => e.logros.length === 0)) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Cuenta qué lograste', detalle: 'En cada trabajo, escribe 2 o 3 cosas que hiciste bien.' })
    }
    if (logros.length > 0 && !logros.some((l) => /\d/.test(l))) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Escribe números', detalle: 'Por ejemplo, cuántas personas atendías o cuántos años trabajaste.', ejemplo: 'Atendí a más de 40 personas al día y reduje los tiempos de espera en un 20 %.' })
    }
    const debil = logros.find((l) => FRASES_DEBILES.test(l))
    if (debil) {
      add({ seccion: 'experiencia', prioridad: 'media', titulo: 'Di lo que hiciste', detalle: 'Cambia “encargado de…” por lo que hiciste: “organicé”, “atendí”.', ejemplo: mejorarLogro(debil) })
    }
    if (cv.experiencia.some((e) => !e.periodo)) {
      add({ seccion: 'experiencia', prioridad: 'baja', titulo: 'Agrega las fechas', detalle: 'En cada trabajo, escribe el año en que empezaste y terminaste.' })
    }
    if (cv.experiencia.length >= 2) fortalezas.push(`Cuentas ${cv.experiencia.length} trabajos.`)
  }

  // Educación
  if (cv.educacion.length === 0) {
    add({ seccion: 'educacion', prioridad: 'media', titulo: 'Agrega tus estudios', detalle: 'Escribe tu último curso o título y dónde estudiaste.' })
  } else {
    fortalezas.push('Tus estudios están claros.')
  }

  // Habilidades e idiomas
  if (cv.habilidades.length < 4) {
    add({ seccion: 'habilidades', prioridad: 'media', titulo: 'Agrega lo que sabes hacer', detalle: 'Por ejemplo: manejo de caja, licencia de conducir, Excel.', ejemplo: 'Excel intermedio · Licencia clase B · Atención de público · Trabajo en equipo' })
  } else {
    fortalezas.push('Muestras bien lo que sabes hacer.')
  }
  if (cv.idiomas.length === 0) {
    add({ seccion: 'idiomas', prioridad: 'baja', titulo: 'Agrega tus idiomas', detalle: 'Aunque sea solo español, escríbelo.' })
  }

  // Formato
  if (palabras > 900) {
    add({ seccion: 'formato', prioridad: 'media', titulo: 'Acorta tu CV', detalle: 'Lo ideal es una página. Deja lo más reciente.' })
  } else if (palabras < 150) {
    add({ seccion: 'formato', prioridad: 'alta', titulo: 'Cuenta un poco más', detalle: 'Agrega tus trabajos, estudios y lo que sabes hacer.' })
  } else {
    fortalezas.push('La extensión del documento es adecuada.')
  }
  if (DATOS_SENSIBLES.test(texto)) {
    add({ seccion: 'formato', prioridad: 'baja', titulo: 'Quita datos personales', detalle: 'No pongas RUT, edad ni estado civil, salvo que te lo pidan.' })
  }

  // Imágenes: no se ven, solo se sabe cuántas hay.
  if (imagenes === 1) {
    add({ seccion: 'formato', prioridad: 'baja', titulo: 'Revisa la foto', detalle: 'Usa una foto tipo carnet, o mejor no pongas foto.' })
  } else if (imagenes > 1) {
    add({ seccion: 'formato', prioridad: 'media', titulo: 'Quita las imágenes', detalle: `Tu CV tiene ${imagenes} imágenes. Deja solo una foto tipo carnet, o ninguna.` })
  }

  const descuento = sugerencias.reduce((t, s) => t + PESO[s.prioridad], 0)
  const puntaje = Math.max(20, Math.min(96, 100 - descuento))

  return {
    puntaje,
    resumen: resumenPara(puntaje),
    fortalezas: fortalezas.slice(0, 2),
    // Solo lo que más ayuda: máximo 5, de más a menos importante.
    sugerencias: sugerencias.sort((a, b) => PESO[b.prioridad] - PESO[a.prioridad]).slice(0, 5),
    cvMejorado: mejorarCv(cv),
    origen: 'mock',
  }
}

function resumenPara(puntaje: number): string {
  if (puntaje >= 80) return 'Con unos pocos ajustes queda listo para postular.'
  if (puntaje >= 60) return 'Empieza por la primera recomendación.'
  return 'Sigue estos pasos en orden antes de postular.'
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
