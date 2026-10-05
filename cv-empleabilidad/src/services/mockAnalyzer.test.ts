import { describe, expect, it } from 'vitest'
import { CV_COMPLETO, CV_POBRE } from '../test/fixtures'
import { analizarTexto } from './mockAnalyzer'

const input = (texto: string) => ({ texto, nombreArchivo: 'cv.pdf' })

describe('analizarTexto (mock)', () => {
  it('puntúa mejor un CV completo que uno pobre', () => {
    const bueno = analizarTexto(input(CV_COMPLETO))
    const malo = analizarTexto(input(CV_POBRE))
    expect(bueno.puntaje).toBeGreaterThan(malo.puntaje)
    expect(bueno.puntaje).toBeGreaterThanOrEqual(60)
    expect(bueno.fortalezas.length).toBeGreaterThan(0)
  })

  it('detecta frases débiles y propone verbos de acción', () => {
    const r = analizarTexto(input(CV_COMPLETO))
    const sug = r.sugerencias.find((s) => s.titulo === 'Use verbos de acción')
    expect(sug?.ejemplo).toMatch(/^Gestioné /)
    expect(r.cvMejorado.experiencia[0]!.logros[0]).toMatch(/^Gestioné recepción/)
  })

  it('marca contacto faltante y datos sensibles en un CV pobre', () => {
    const r = analizarTexto(input(CV_POBRE))
    const titulos = r.sugerencias.map((s) => s.titulo)
    expect(titulos).toContain('Agregue un correo electrónico')
    expect(titulos).toContain('Evite datos personales innecesarios')
    expect(r.sugerencias[0]!.prioridad).toBe('alta')
  })

  it('rellena con marcadores lo que falta en el CV mejorado', () => {
    const r = analizarTexto(input(CV_POBRE))
    expect(r.cvMejorado.perfil).toMatch(/^\[/)
    expect(r.cvMejorado.idiomas).toEqual(['Español (nativo)'])
    expect(r.origen).toBe('mock')
  })
})
