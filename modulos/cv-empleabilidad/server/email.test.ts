// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { contenidoCorreo, handleEnviarRequest, readSmtpConfig, type EnviarCorreo, type Mensaje } from './email'

// Valores ficticios: los tests nunca usan credenciales reales ni abren conexiones SMTP.
const ENV = {
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '465',
  SMTP_USER: 'cv@example.com',
  SMTP_PASS: 'clave de prueba',
  CV_EMAIL_REPLY_TO: 'contacto@example.com',
}
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

/** Enviador simulado: guarda los mensajes o falla con el error indicado. */
function enviador(error?: { code?: string; responseCode?: number }) {
  const enviados: Mensaje[] = []
  const fn: EnviarCorreo = vi.fn(async (m: Mensaje) => {
    if (error) throw Object.assign(new Error('fallo simulado'), error)
    enviados.push(m)
  })
  return { fn, enviados }
}

afterEach(() => vi.restoreAllMocks())

describe('readSmtpConfig', () => {
  it('lee la configuración, quita espacios de la contraseña y usa 465 por defecto', () => {
    const c = readSmtpConfig({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'a@example.com', SMTP_PASS: 'abcd efgh ijkl' })
    expect(c).toMatchObject({ port: 465, pass: 'abcdefghijkl', fromName: 'Municipalidad de Hualañé' })
    expect(readSmtpConfig({ SMTP_HOST: 'x' })).toBeNull()
  })

  it('limpia el nombre del remitente para no inyectar encabezados', () => {
    const c = readSmtpConfig({ ...ENV, CV_EMAIL_FROM_NAME: 'Muni "Hualañé"\r\nBcc: x@example.com' })
    expect(c?.fromName).not.toMatch(/["\r\n]/)
  })
})

describe('handleEnviarRequest', () => {
  it('envía el correo con ambos adjuntos, remitente = cuenta SMTP y responder-a configurado', async () => {
    const { fn, enviados } = enviador()
    const res = await handleEnviarRequest(post(valido), ENV, fn)
    expect(res.status).toBe(200)
    const m = enviados[0]!
    expect(m.to).toBe('persona@example.com')
    expect(m.from).toBe('"Municipalidad de Hualañé" <cv@example.com>')
    expect(m.replyTo).toBe('contacto@example.com')
    const cvs = m.attachments.filter((a) => !a.cid)
    expect(cvs.map((a) => [a.filename, a.contentType])).toEqual([
      ['CV-Maria-moderno.pdf', 'application/pdf'],
      ['CV-Maria-moderno.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ])
    // Logo incrustado (CID) y referenciado desde el HTML.
    const logo = m.attachments.find((a) => a.cid === 'logo-hualane')
    expect(logo?.content.subarray(1, 4).toString()).toBe('PNG')
    expect(m.html).toContain('src="cid:logo-hualane"')
    expect(m.html).toContain('CV-Maria-moderno.pdf')
    expect(m.text).toContain('Si tienes dudas, responde este mensaje.')
    expect(cvs[0]!.content.subarray(0, 4).toString()).toBe('%PDF')
    expect(m.text).toContain('Hola, María:')
    expect(m.text).toContain('Moderno')
  })

  it('rechaza correos inválidos con un mensaje claro', async () => {
    const { fn } = enviador()
    const res = await handleEnviarRequest(post({ ...valido, email: 'no-es-correo' }), ENV, fn)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Revisa el correo que escribiste.')
    expect(fn).not.toHaveBeenCalled()
  })

  it('rechaza adjuntos cuyo contenido no es PDF/DOCX real, duplicados o con otra extensión', async () => {
    const { fn } = enviador()
    const html = Buffer.from('<html>').toString('base64')
    for (const adjuntos of [
      [{ nombre: 'cv.pdf', contenido: html }],
      [{ nombre: 'cv.pdf', contenido: DOCX }],
      [{ nombre: 'a.pdf', contenido: PDF }, { nombre: 'b.pdf', contenido: PDF }],
      [{ nombre: 'cv.exe', contenido: PDF }],
    ]) {
      expect((await handleEnviarRequest(post({ ...valido, adjuntos }), ENV, fn)).status).toBe(400)
    }
    expect(fn).not.toHaveBeenCalled()
  })

  it('no envía nada si el honeypot viene lleno', async () => {
    const { fn } = enviador()
    const res = await handleEnviarRequest(post({ ...valido, sitioWeb: 'http://spam' }), ENV, fn)
    expect(res.status).toBe(200)
    expect(fn).not.toHaveBeenCalled()
  })

  it('responde 503 sin configuración y traduce errores SMTP', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await handleEnviarRequest(post(valido), {}, enviador().fn)).status).toBe(503)
    expect((await handleEnviarRequest(post(valido), ENV, enviador({ responseCode: 550 }).fn)).status).toBe(400)
    expect((await handleEnviarRequest(post(valido), ENV, enviador({ code: 'EAUTH' }).fn)).status).toBe(503)
    expect((await handleEnviarRequest(post(valido), ENV, enviador({ responseCode: 421 }).fn)).status).toBe(503)
    expect((await handleEnviarRequest(post(valido), ENV, enviador({ code: 'ETIMEDOUT' }).fn)).status).toBe(502)
    // Privacidad: los logs no incluyen la dirección de destino.
    expect(JSON.stringify(error.mock.calls)).not.toContain('persona@example.com')
  })

  it('sin dirección de respuesta pide no responder', () => {
    expect(contenidoCorreo('Ana', 'clasico').text).toContain('no respondas este mensaje')
  })

  it('escapa el nombre en el HTML y omite marcadores [..]', () => {
    expect(contenidoCorreo('<b>Ana</b> Soto', 'clasico').html).not.toContain('<b>Ana')
    expect(contenidoCorreo('[Su nombre completo]', 'clasico').text).toMatch(/^Hola:/)
  })
})
