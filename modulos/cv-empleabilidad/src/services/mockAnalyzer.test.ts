import { describe, expect, it } from 'vitest'
import { CV_COMPLETO, CV_POBRE, RECETA } from '../test/fixtures'
import { analizarTexto, evaluarDocumento, pareceCv } from './mockAnalyzer'

const input = (texto: string) => ({ texto, nombreArchivo: 'cv.pdf' })

describe('analizarTexto (mock)', () => {
  it('puntúa mejor un CV completo que uno pobre', () => {
    const bueno = analizarTexto(input(CV_COMPLETO))
    const malo = analizarTexto(input(CV_POBRE))
    expect(bueno.puntaje).toBeGreaterThan(malo.puntaje)
    expect(bueno.puntaje).toBeGreaterThanOrEqual(60)
    expect(bueno.fortalezas.length).toBeGreaterThan(0)
  })

  it('detecta frases débiles y propone decir lo que hizo', () => {
    const r = analizarTexto(input(CV_COMPLETO))
    const sug = r.sugerencias.find((s) => s.titulo === 'Di lo que hiciste')
    expect(sug?.ejemplo).toMatch(/^Gestioné /)
    expect(r.cvMejorado.experiencia[0]!.logros[0]).toMatch(/^Gestioné recepción/)
  })

  it('en un CV pobre prioriza lo importante y entrega como máximo 5 sugerencias', () => {
    const r = analizarTexto(input(CV_POBRE))
    const titulos = r.sugerencias.map((s) => s.titulo)
    expect(titulos).toContain('Agrega tu correo')
    expect(r.sugerencias.length).toBeLessThanOrEqual(5)
    expect(r.sugerencias[0]!.prioridad).toBe('alta')
    expect(r.fortalezas.length).toBeLessThanOrEqual(2)
  })

  it('usa frases cortas en las sugerencias (lectura fácil)', () => {
    for (const texto of [CV_COMPLETO, CV_POBRE]) {
      for (const s of analizarTexto(input(texto)).sugerencias) {
        expect(s.titulo.split(/\s+/).length).toBeLessThanOrEqual(6)
        expect(s.detalle.split(/\s+/).length).toBeLessThanOrEqual(15)
      }
    }
  })

  it('rellena con marcadores lo que falta en el CV mejorado', () => {
    const r = analizarTexto(input(CV_POBRE))
    expect(r.cvMejorado.perfil).toMatch(/^\[/)
    expect(r.cvMejorado.idiomas).toEqual(['Español (nativo)'])
    expect(r.origen).toBe('mock')
  })
})

describe('evaluarDocumento (mock)', () => {
  it('distingue un CV de un documento que no lo es', () => {
    expect(pareceCv(CV_COMPLETO)).toBe(true)
    expect(pareceCv(CV_POBRE)).toBe(true)
    expect(pareceCv(RECETA)).toBe(false)
    const r = evaluarDocumento(input(RECETA))
    expect(r.esCv).toBe(false)
    expect(!r.esCv && r.motivo).toBeTruthy()
  })

  it('sugiere revisar la imagen según cuántas tenga el CV', () => {
    const titulos = (imagenes: number) => analizarTexto({ ...input(CV_COMPLETO), imagenes }).sugerencias.map((s) => s.titulo)
    expect(titulos(0)).not.toContain('Revisa la foto')
    expect(titulos(1)).toContain('Revisa la foto')
    expect(titulos(4)).toContain('Quita las imágenes')
  })
})
