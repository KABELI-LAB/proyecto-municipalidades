import type { CvData, Educacion, Experiencia } from '../services/types'

/**
 * Estructuración heurística del texto de un CV. La usa el analizador mock; la
 * IA real reemplazará esto, pero se mantiene como respaldo sin conexión.
 */

type SectionKey = 'perfil' | 'experiencia' | 'educacion' | 'habilidades' | 'idiomas' | 'otros'

const SECTION_PATTERNS: [SectionKey, RegExp][] = [
  ['perfil', /^(perfil( profesional)?|resumen( profesional)?|sobre mi|acerca de mi|objetivo( profesional| laboral)?|presentacion)$/],
  ['experiencia', /^(experiencia( laboral| profesional)?|historial laboral|trabajos( realizados| anteriores)?|trayectoria( laboral| profesional)?|antecedentes laborales)$/],
  ['educacion', /^(educacion|formacion( academica)?|estudios|antecedentes academicos)$/],
  ['habilidades', /^(habilidades|competencias|conocimientos|herramientas|aptitudes|habilidades( tecnicas| blandas)?)$/],
  ['idiomas', /^idiomas?$/],
  ['otros', /^(cursos|certificaciones|cursos y certificaciones|capacitaciones|referencias|intereses|voluntariado|logros|proyectos)$/],
]

export const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/
export const PHONE_RE = /(\+?56[\s-]?)?(\(?9\)?[\s-]?)\d{4}[\s-]?\d{4}|\+?\d[\d\s-]{7,}\d/
const LINKEDIN_RE = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?/i
const YEAR_RE = /(19|20)\d{2}/
const PERIOD_RE =
  /((ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s+)?(19|20)\d{2}\s*[-–—a]+\s*(((ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s+)?(19|20)\d{2}|actual(idad)?|presente|hoy)|((ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s+)?(19|20)\d{2}/i
const BULLET_RE = /^[•·▪●◦\-–*]\s*/

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[:.]+$/, '')
    .trim()
}

function sectionOf(line: string): SectionKey | null {
  if (line.length > 40) return null
  const n = normalize(line)
  for (const [key, re] of SECTION_PATTERNS) if (re.test(n)) return key
  return null
}

function extractPeriod(line: string): { periodo: string; resto: string } {
  const m = line.match(PERIOD_RE)
  if (!m) return { periodo: '', resto: line }
  const resto = line
    .replace(m[0], '')
    .replace(/[|,·–—-]\s*$|^\s*[|,·–—-]/g, '')
    .replace(/\(\s*\)/g, '')
    .trim()
  return { periodo: m[0].trim(), resto }
}

function splitList(lines: string[]): string[] {
  return lines
    .flatMap((l) => l.replace(BULLET_RE, '').split(/[,;|·•]/))
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60)
}

function parseExperiencia(lines: string[]): Experiencia[] {
  const out: Experiencia[] = []
  let cur: Experiencia | null = null
  for (const raw of lines) {
    if (BULLET_RE.test(raw)) {
      if (!cur) {
        cur = { cargo: '', organizacion: '', periodo: '', logros: [] }
        out.push(cur)
      }
      cur.logros.push(raw.replace(BULLET_RE, ''))
      continue
    }
    const { periodo, resto } = extractPeriod(raw)
    const startsNew = !cur || cur.logros.length > 0 || (cur.cargo && cur.organizacion && !periodo)
    if (startsNew) {
      cur = { cargo: resto, organizacion: '', periodo, logros: [] }
      out.push(cur)
    } else if (cur) {
      if (periodo && !cur.periodo) cur.periodo = periodo
      if (resto) {
        if (!cur.cargo) cur.cargo = resto
        else if (!cur.organizacion) cur.organizacion = resto
        else cur.logros.push(resto)
      }
    }
  }
  return out.filter((e) => e.cargo || e.logros.length)
}

function parseEducacion(lines: string[]): Educacion[] {
  const out: Educacion[] = []
  let cur: Educacion | null = null
  for (const raw of lines) {
    const { periodo, resto } = extractPeriod(raw.replace(BULLET_RE, ''))
    if (!cur || (cur.titulo && cur.institucion && resto)) {
      cur = { titulo: resto, institucion: '', periodo }
      out.push(cur)
    } else {
      if (periodo && !cur.periodo) cur.periodo = periodo
      if (resto) cur.institucion = resto
    }
  }
  return out.filter((e) => e.titulo)
}

function looksLikeName(line: string): boolean {
  if (EMAIL_RE.test(line) || PHONE_RE.test(line) || YEAR_RE.test(line)) return false
  const words = line.split(/\s+/)
  return words.length >= 2 && words.length <= 5 && /^[\p{L}\s.'-]+$/u.test(line)
}

export function parseCv(texto: string): CvData {
  const lines = texto
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const sections: Record<SectionKey | 'cabecera', string[]> = {
    cabecera: [], perfil: [], experiencia: [], educacion: [], habilidades: [], idiomas: [], otros: [],
  }
  let current: SectionKey | 'cabecera' = 'cabecera'
  for (const line of lines) {
    const s = sectionOf(line)
    if (s) current = s
    else sections[current].push(line)
  }

  const all = lines.join('\n')
  const cabecera = sections.cabecera
  const nombreIdx = cabecera.findIndex(looksLikeName)
  const nombre = nombreIdx >= 0 ? cabecera[nombreIdx]! : ''
  const titular =
    cabecera
      .slice(nombreIdx + 1)
      .find((l) => !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !LINKEDIN_RE.test(l) && l.length < 70) ?? ''

  // Si no hay sección de perfil explícita, un párrafo largo en la cabecera suele serlo.
  const perfil =
    sections.perfil.join(' ') ||
    cabecera.filter((l) => l !== nombre && l !== titular && l.length > 80).join(' ')

  return {
    nombre,
    titular: titular.length > 80 ? '' : titular,
    contacto: {
      email: all.match(EMAIL_RE)?.[0],
      telefono: all.match(PHONE_RE)?.[0]?.trim(),
      linkedin: all.match(LINKEDIN_RE)?.[0],
    },
    perfil,
    experiencia: parseExperiencia(sections.experiencia),
    educacion: parseEducacion(sections.educacion),
    habilidades: splitList(sections.habilidades),
    idiomas: splitList(sections.idiomas),
  }
}
