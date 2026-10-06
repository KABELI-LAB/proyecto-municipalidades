// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { contenidoCorreo, handleEnviarRequest } from './email'

// Valores ficticios: los tests nunca usan credenciales reales.
const ENV = { RESEND_API_KEY: 'clave-de-prueba', CV_EMAIL_FROM: 'Municipalidad <cv@example.com>' }
const PDF = Buffer.from('%PDF-1.7 contenido').toString('base64')
const DOCX = Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]).toString('base64')

const valido = {
  email: 'persona@example.com',
  nombre: 'María José Fuentes',
  diseno: 'moderno',
  adjuntos: [
    { nombre: 'CV-Maria-moderno.pdf', contenido: PDF },
    { nombre: 'CV-Maria-moderno.docx', contenido: DOCX },
  ],
}

const post = (body: unknown) =>
  new Request('http://localhost/api/cv/enviar', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

const resend = (status = 200) => vi.fn(async () => new Response('{"id":"x"}', { status })) as unknown as typeof fetch
const llamadas = (f: typeof fetch) => (f as unknown as ReturnType<typeof vi.fn>).mock.calls

afterEach(() => vi.restoreAllMocks())

describe('handleEnviarRequest', () => {
  it('envía el correo con ambos adjuntos y contenido fijo', async () => {
    const f = resend()
    const res = await handleEnviarRequest(post(valido), ENV, f)
    expect(res.status).toBe(200)
    const [url, init] = llamadas(f)[0]!
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers.Authorization).toBe('Bearer clave-de-prueba')
    const body = JSON.parse(init.body)
    expect(body.to).toEqual(['persona@example.com'])
    expect(body.attachments.map((a: { filename: string }) => a.filename)).toEqual(['CV-Maria-moderno.pdf', 'CV-Maria-moderno.docx'])
    expect(body.text).toContain('Hola, María:')
    expect(body.text).toContain('Moderno')
  })

  it('rechaza correos inválidos con un mensaje claro', async () => {
    const res = await handleEnviarRequest(post({ ...valido, email: 'no-es-correo' }), ENV, resend())
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Revise el correo ingresado.')
  })

  it('rechaza adjuntos cuyo contenido no es PDF/DOCX real, duplicados o con otra extensión', async () => {
    const f = resend()
    const html = Buffer.from('<html>').toString('base64')
    for (const adjuntos of [
      [{ nombre: 'cv.pdf', contenido: html }],
      [{ nombre: 'cv.pdf', contenido: DOCX }],
      [{ nombre: 'a.pdf', contenido: PDF }, { nombre: 'b.pdf', contenido: PDF }],
      [{ nombre: 'cv.exe', contenido: PDF }],
    ]) {
      expect((await handleEnviarRequest(post({ ...valido, adjuntos }), ENV, f)).status).toBe(400)
    }
    expect(f).not.toHaveBeenCalled()
  })

  it('no envía nada si el honeypot viene lleno', async () => {
    const f = resend()
    const res = await handleEnviarRequest(post({ ...valido, sitioWeb: 'http://spam' }), ENV, f)
    expect(res.status).toBe(200)
    expect(f).not.toHaveBeenCalled()
  })

  it('responde 503 sin configuración y traduce errores de Resend', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await handleEnviarRequest(post(valido), {}, resend())).status).toBe(503)
    expect((await handleEnviarRequest(post(valido), ENV, resend(422))).status).toBe(400)
    expect((await handleEnviarRequest(post(valido), ENV, resend(429))).status).toBe(503)
    expect((await handleEnviarRequest(post(valido), ENV, resend(500))).status).toBe(502)
  })

  it('escapa el nombre en el HTML y omite marcadores [..]', () => {
    expect(contenidoCorreo('<b>Ana</b> Soto', 'clasico').html).not.toContain('<b>Ana')
    expect(contenidoCorreo('[Su nombre completo]', 'clasico').text).toMatch(/^Hola:/)
  })
})
