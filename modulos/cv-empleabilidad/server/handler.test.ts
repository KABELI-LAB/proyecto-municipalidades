// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { analizarTexto } from '../src/services/mockAnalyzer'
import { CV_COMPLETO } from '../src/test/fixtures'
import { MAX_TEXTO } from './analyze'
import { handleAnalyzeRequest } from './handler'
import { RESPONSE_JSON_SCHEMA } from './schema'

// Valores ficticios: los tests nunca usan credenciales reales.
const ENV = {
  AZURE_OPENAI_ENDPOINT: 'https://ejemplo.invalid/openai/v1/',
  AZURE_OPENAI_API_KEY: 'clave-de-prueba',
  AZURE_OPENAI_DEPLOYMENT: 'modelo-de-prueba',
}

/** Respuesta válida del modelo, construida desde el mock (con null en vez de undefined). */
function respuestaModelo() {
  const { sugerencias, cvMejorado, puntaje, resumen, fortalezas } = analizarTexto({ texto: CV_COMPLETO, nombreArchivo: 'cv.pdf' })
  return {
    puntaje,
    resumen,
    fortalezas,
    sugerencias: sugerencias.map(({ seccion, prioridad, titulo, detalle, ejemplo }) => ({ seccion, prioridad, titulo, detalle, ejemplo: ejemplo ?? null })),
    cvMejorado: {
      ...cvMejorado,
      contacto: {
        email: cvMejorado.contacto.email ?? null,
        telefono: cvMejorado.contacto.telefono ?? null,
        ubicacion: cvMejorado.contacto.ubicacion ?? null,
        linkedin: cvMejorado.contacto.linkedin ?? null,
      },
    },
  }
}

const fakeFetch = (content: unknown, status = 200) =>
  vi.fn(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }] }), { status }),
  ) as unknown as typeof fetch

const post = (body: unknown) =>
  new Request('http://localhost/api/cv/analyze', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

afterEach(() => vi.restoreAllMocks())

describe('handleAnalyzeRequest', () => {
  it('devuelve un análisis validado y llama al modelo con structured outputs', async () => {
    const f = fakeFetch(respuestaModelo())
    const res = await handleAnalyzeRequest(post({ texto: CV_COMPLETO, nombreArchivo: 'cv.pdf' }), ENV, f)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sugerencias[0].id).toBe('s1')
    expect(data.cvMejorado.nombre).toBe('María José Fuentes Rojas')
    expect(data.cvMejorado.contacto.ubicacion).toBeUndefined()

    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!
    expect(url).toBe('https://ejemplo.invalid/openai/v1/chat/completions')
    expect(init.headers['api-key']).toBe('clave-de-prueba')
    const body = JSON.parse(init.body)
    expect(body.model).toBe('modelo-de-prueba')
    expect(body.response_format.json_schema.strict).toBe(true)
    expect(body.messages[1].content).toContain('<cv>')
  })

  it('responde 503 si faltan variables de entorno', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await handleAnalyzeRequest(post({ texto: 'hola' }), {}, fakeFetch({}))
    expect(res.status).toBe(503)
  })

  it('rechaza métodos, cuerpos inválidos y textos demasiado largos', async () => {
    const f = fakeFetch(respuestaModelo())
    expect((await handleAnalyzeRequest(new Request('http://x/api', { method: 'GET' }), ENV, f)).status).toBe(405)
    expect((await handleAnalyzeRequest(post({ nada: 1 }), ENV, f)).status).toBe(400)
    expect((await handleAnalyzeRequest(post({ texto: 'a'.repeat(MAX_TEXTO + 1) }), ENV, f)).status).toBe(413)
    expect(f).not.toHaveBeenCalled()
  })

  it('responde 502 si el modelo devuelve JSON que no cumple el esquema', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await handleAnalyzeRequest(post({ texto: CV_COMPLETO }), ENV, fakeFetch({ puntaje: 'alto' }))
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBeTruthy()
    // Privacidad: el log no incluye el contenido del CV.
    expect(JSON.stringify(error.mock.calls)).not.toContain('María')
  })

  it('traduce un 429 del modelo a un mensaje de espera', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await handleAnalyzeRequest(post({ texto: CV_COMPLETO }), ENV, fakeFetch('', 429))
    expect(res.status).toBe(503)
    expect((await res.json()).error).toMatch(/minutos/)
  })

  it('el JSON schema exige todas las propiedades (modo estricto)', () => {
    const revisar = (s: Record<string, unknown>): void => {
      if (s.type === 'object') {
        expect(s.additionalProperties).toBe(false)
        expect(s.required).toEqual(Object.keys(s.properties as object))
        Object.values(s.properties as Record<string, Record<string, unknown>>).forEach(revisar)
      }
      if (s.type === 'array') revisar(s.items as Record<string, unknown>)
    }
    revisar(RESPONSE_JSON_SCHEMA)
  })
})
