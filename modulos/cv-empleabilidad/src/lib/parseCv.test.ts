import { describe, expect, it } from 'vitest'
import { CV_COMPLETO, CV_POBRE } from '../test/fixtures'
import { parseCv } from './parseCv'

describe('parseCv', () => {
  const cv = parseCv(CV_COMPLETO)

  it('extrae nombre, titular y contacto', () => {
    expect(cv.nombre).toBe('María José Fuentes Rojas')
    expect(cv.titular).toBe('Técnico en Administración')
    expect(cv.contacto.email).toBe('maria.fuentes@gmail.com')
    expect(cv.contacto.telefono).toContain('8765')
  })

  it('separa experiencias con cargo, organización, periodo y logros', () => {
    expect(cv.experiencia).toHaveLength(2)
    expect(cv.experiencia[0]).toMatchObject({
      cargo: 'Administrativa de Oficina de Partes',
      organizacion: 'Municipalidad de Curicó',
      periodo: 'mar 2021 - actualidad',
    })
    expect(cv.experiencia[0]!.logros).toHaveLength(2)
    expect(cv.experiencia[1]!.periodo).toBe('2018 - 2021')
  })

  it('lee educación, habilidades e idiomas', () => {
    expect(cv.educacion[0]).toMatchObject({ institucion: 'Instituto Profesional Santo Tomás', periodo: '2016 - 2018' })
    expect(cv.habilidades).toContain('Excel intermedio')
    expect(cv.habilidades).toHaveLength(5)
    expect(cv.idiomas).toEqual(['Español nativo', 'Inglés básico'])
  })

  it('une viñetas partidas en dos líneas (PDF a dos columnas)', () => {
    const r = parseCv(`Ana Ruiz Soto
Experiencia laboral
Coordinadora de Proyectos
Corporación del Maule · mar 2021 - actualidad
• Lideré un programa para 320 emprendedores rurales,
con 85 % de egreso.
• Gestioné un presupuesto con ejecución del 98
%.
Analista
Consultora Valle · 2018 - 2021
• Formulé 14 proyectos.`)
    expect(r.experiencia).toHaveLength(2)
    expect(r.experiencia[0]!.logros).toEqual([
      'Lideré un programa para 320 emprendedores rurales, con 85 % de egreso.',
      'Gestioné un presupuesto con ejecución del 98 %.',
    ])
  })

  it('tolera CVs sin secciones reconocibles', () => {
    const pobre = parseCv(CV_POBRE)
    expect(pobre.nombre).toBe('Juan Pérez')
    expect(pobre.contacto.email).toBeUndefined()
    expect(pobre.perfil).toBe('')
    expect(pobre.experiencia[0]?.cargo).toBe('Ayudante en bodega')
  })
})
