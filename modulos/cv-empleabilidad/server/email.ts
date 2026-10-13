import nodemailer from 'nodemailer'
import { z } from 'zod'
import { json } from './http.ts'

/**
 * POST /api/cv/enviar → envía a la persona su CV (PDF + Word) por correo
 * vía SMTP (hoy, Gmail/Google Workspace con contraseña de aplicación). Asunto y cuerpo son fijos para que el endpoint no sirva
 * para enviar contenido arbitrario. Nada se almacena ni se registra.
 */

const MAX_ADJUNTO = 2 * 1024 * 1024 // 2 MB por archivo (un CV pesa ~10–50 KB)
const DISENOS = { clasico: 'Clásico', moderno: 'Moderno', compacto: 'Compacto' } as const

const adjuntoSchema = z.object({
  nombre: z.string().max(120).regex(/^[\w.-]+\.(pdf|docx)$/),
  contenido: z.string().max(Math.ceil((MAX_ADJUNTO * 4) / 3) + 4),
})

export const envioSchema = z.object({
  email: z.email().max(254),
  nombre: z.string().max(120),
  diseno: z.enum(Object.keys(DISENOS) as [keyof typeof DISENOS, ...(keyof typeof DISENOS)[]]),
  adjuntos: z.array(adjuntoSchema).min(1).max(2),
  /** Honeypot anti-bots: un campo oculto que una persona nunca completa. */
  sitioWeb: z.string().optional(),
})

type Env = Record<string, string | undefined>

/** Firma de archivo: el contenido debe ser realmente un PDF o un DOCX (zip). */
function tipoReal(bytes: Uint8Array): 'pdf' | 'docx' | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'pdf' // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return 'docx' // PK..
  return null
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export function contenidoCorreo(nombre: string, diseno: keyof typeof DISENOS) {
  const limpio = nombre.trim().startsWith('[') ? '' : nombre.trim().split(/\s+/)[0] ?? ''
  const saludo = limpio ? `Hola, ${limpio}:` : 'Hola:'
  const lineas = [
    saludo,
    `Te enviamos tu currículum en el diseño ${DISENOS[diseno]}, en PDF y en Word.`,
    'Antes de postular, abre el archivo Word y completa los textos que aparecen entre [corchetes]. Después puedes guardarlo como PDF.',
    'Te deseamos mucho éxito en tu búsqueda de empleo.',
    'Municipalidad de Hualañé',
  ]
  const pie = 'Te llegó este correo porque lo pediste en el sitio de la Municipalidad de Hualañé. No guardamos tu CV ni tu correo. Por favor, no respondas este mensaje.'
  // Correo HTML: sin variables CSS. #0E121B = neutral-950 (texto), #253786 = blue-700,
  // #585F70 = neutral-600 para el pie (6,5:1 sobre blanco).
  return {
    subject: 'Tu currículum · Municipalidad de Hualañé',
    text: [...lineas, '', pie].join('\n\n'),
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0E121B;max-width:560px">
${lineas.map((l, i) => `<p style="margin:0 0 14px${i === lineas.length - 1 ? ';font-weight:bold;color:#253786' : ''}">${escapeHtml(l)}</p>`).join('\n')}
<p style="margin:24px 0 0;font-size:14px;color:#585F70">${escapeHtml(pie)}</p></div>`,
  }
}

// ---------- SMTP ----------

export interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  /** Nombre visible del remitente. La dirección es siempre SMTP_USER (Gmail lo exige). */
  fromName: string
  replyTo?: string
}

export interface Mensaje {
  from: string
  to: string
  replyTo?: string
  subject: string
  text: string
  html: string
  attachments: { filename: string; content: Buffer; contentType: string }[]
}

export type EnviarCorreo = (m: Mensaje) => Promise<void>

const MIME = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } as const

export function readSmtpConfig(env: Env): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim()
  const user = env.SMTP_USER?.trim()
  const pass = env.SMTP_PASS?.replace(/\s+/g, '') // Google muestra la contraseña de aplicación con espacios
  if (!host || !user || !pass) return null
  const port = Number(env.SMTP_PORT?.trim() || 465)
  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    user,
    pass,
    // Sin comillas ni saltos de línea: evita inyectar encabezados.
    fromName: (env.CV_EMAIL_FROM_NAME?.trim() || 'Municipalidad de Hualañé').replace(/["\r\n<>]/g, ''),
    replyTo: env.CV_EMAIL_REPLY_TO?.trim() || undefined,
  }
}

export function crearEnviadorSmtp(c: SmtpConfig): EnviarCorreo {
  const transporte = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.port === 465, // 465 = TLS directo; 587 = STARTTLS
    auth: { user: c.user, pass: c.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  return async (m) => {
    await transporte.sendMail(m)
  }
}

/** Traduce errores SMTP a respuestas para la persona. Solo registra códigos (nunca direcciones ni contenido). */
function errorSmtp(err: unknown): Response {
  const e = err as { code?: string; responseCode?: number }
  console.error(`[cv-enviar] SMTP falló: code=${e.code ?? '-'} responseCode=${e.responseCode ?? '-'}`)
  if (e.code === 'EENVELOPE' || e.responseCode === 550 || e.responseCode === 553) {
    return json(400, { error: 'Revisa el correo que escribiste.' })
  }
  if (e.code === 'EAUTH') {
    return json(503, { error: 'El envío por correo no está disponible en este momento. Usa Descargar PDF o Descargar Word.' })
  }
  if (e.responseCode && e.responseCode >= 421 && e.responseCode < 500) {
    return json(503, { error: 'Hay muchas solicitudes en este momento. Inténtalo en unos minutos.' })
  }
  return json(502, { error: 'No pudimos enviar el correo. Inténtalo de nuevo.' })
}

export async function handleEnviarRequest(req: Request, env: Env, enviar?: EnviarCorreo): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido.' })

  const config = readSmtpConfig(env)
  if (!config) {
    console.error('[cv-enviar] faltan variables SMTP_HOST / SMTP_USER / SMTP_PASS')
    return json(503, { error: 'El envío por correo no está disponible en este momento. Usa Descargar PDF o Descargar Word.' })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'No pudimos procesar la solicitud. Inténtalo de nuevo.' })
  }
  const parsed = envioSchema.safeParse(body)
  if (!parsed.success) {
    const emailMalo = parsed.error.issues.some((i) => i.path[0] === 'email')
    return json(400, { error: emailMalo ? 'Revisa el correo que escribiste.' : 'No pudimos procesar la solicitud. Inténtalo de nuevo.' })
  }
  const { email, nombre, diseno, adjuntos, sitioWeb } = parsed.data

  // Bot: respondemos como si se hubiera enviado, sin enviar nada.
  if (sitioWeb) return json(200, { ok: true })

  const archivos: Mensaje['attachments'] = []
  for (const a of adjuntos) {
    const bytes = Buffer.from(a.contenido, 'base64')
    const extension = a.nombre.split('.').pop()
    if (bytes.length === 0 || bytes.length > MAX_ADJUNTO || tipoReal(bytes) !== extension || archivos.some((x) => x.filename.endsWith('.' + extension))) {
      return json(400, { error: 'No pudimos adjuntar tu CV. Vuelve a elegir el diseño e inténtalo de nuevo.' })
    }
    archivos.push({ filename: a.nombre, content: bytes, contentType: MIME[extension as keyof typeof MIME] })
  }

  try {
    await (enviar ?? crearEnviadorSmtp(config))({
      from: `"${config.fromName}" <${config.user}>`,
      to: email,
      replyTo: config.replyTo,
      ...contenidoCorreo(nombre, diseno),
      attachments: archivos,
    })
  } catch (err) {
    return errorSmtp(err)
  }
  return json(200, { ok: true })
}
