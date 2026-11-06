import nodemailer from 'nodemailer'
import { z } from 'zod'
import { json } from './http.ts'
import { LOGO_CORREO_CUREPTO_PNG_BASE64, LOGO_CORREO_PNG_BASE64, LOGO_CORREO_VICHUQUEN_PNG_BASE64 } from './logoCorreo.ts'

/**
 * POST /api/cv/enviar → envía a la persona su CV (PDF + Word) por correo
 * vía SMTP (hoy, Gmail/Google Workspace con contraseña de aplicación). Asunto y cuerpo son fijos para que el endpoint no sirva
 * para enviar contenido arbitrario. Nada se almacena ni se registra.
 */

const MAX_ADJUNTO = 2 * 1024 * 1024 // 2 MB por archivo (un CV pesa ~10–50 KB)
const DISENOS = { clasico: 'Clásico', moderno: 'Moderno', compacto: 'Compacto' } as const

/** Municipios del sitio (mismos ids que MUNICIPIOS del design system). */
export const MUNICIPIOS_CORREO = ['hualane', 'curepto', 'vichuquen'] as const
export type MunicipioCorreo = (typeof MUNICIPIOS_CORREO)[number]

const adjuntoSchema = z.object({
  nombre: z.string().max(120).regex(/^[\w.-]+\.(pdf|docx)$/),
  contenido: z.string().max(Math.ceil((MAX_ADJUNTO * 4) / 3) + 4),
})

export const envioSchema = z.object({
  email: z.email().max(254),
  nombre: z.string().max(120),
  diseno: z.enum(Object.keys(DISENOS) as [keyof typeof DISENOS, ...(keyof typeof DISENOS)[]]),
  adjuntos: z.array(adjuntoSchema).min(1).max(2),
  /** Municipio elegido en el sitio (marca del correo). Sin él, Hualañé. */
  municipio: z.enum(MUNICIPIOS_CORREO).default('hualane'),
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

/**
 * Marca del correo según el municipio elegido en el sitio. El HTML de correo no admite
 * variables CSS: los colores se copian de design-system/tokens/colors.css y
 * tokens/temas/*.css (mantener en sincronía).
 */
interface MarcaCorreo {
  nombre: string
  logo: { base64: string; ancho: number; alto: number; alt: string }
  /** Fondo de la cabecera donde va el logo. */
  cabecera: string
  /** Franjas de color bajo la cabecera. */
  franjas: string[]
  fuente: string
  fuenteTitulos: string
  /** Etiquetas ("Empleabilidad") en mayúsculas con marca de acento, o en sentence case (Vichuquén). */
  etiquetaMayusculas: boolean
  C: {
    primario: string
    primarioSuave: string
    /** Chip del archivo Word: fondo y texto. */
    wordFondo: string
    wordTexto: string
    acento: string
    fondo: string
    borde: string
    texto: string
    secundario: string
  }
}

const ATKINSON = "'Atkinson Hyperlegible Next', Arial, Helvetica, sans-serif"

export const MARCAS_CORREO: Record<MunicipioCorreo, MarcaCorreo> = {
  hualane: {
    nombre: 'Hualañé',
    logo: { base64: LOGO_CORREO_PNG_BASE64, ancho: 180, alto: 64, alt: 'Hualañé, Somos tod@s' },
    cabecera: '#FFFFFF',
    franjas: ['#253786', '#3AAA35', '#FAC22F'], // blue-700, green-500, yellow-400
    fuente: ATKINSON,
    fuenteTitulos: ATKINSON,
    etiquetaMayusculas: true,
    C: {
      primario: '#253786', // blue-700
      primarioSuave: '#EEF3FB', // blue-50
      wordFondo: '#EEF8EE',
      wordTexto: '#316B2C', // green-700
      acento: '#FAC22F', // yellow-400
      fondo: '#F6F7F9', // neutral-50
      borde: '#DCDFE6', // neutral-200
      texto: '#0E121B', // neutral-950
      secundario: '#585F70', // neutral-600 (6,5:1 sobre blanco)
    },
  },
  curepto: {
    nombre: 'Curepto',
    logo: { base64: LOGO_CORREO_CUREPTO_PNG_BASE64, ancho: 180, alto: 66, alt: 'Municipalidad de Curepto' },
    cabecera: '#00468C', // azul-municipal (barra de avisos del sitio)
    franjas: ['#122536', '#FFCC00'], // azul-noche, amarillo-aviso
    fuente: 'Roboto, Arial, Helvetica, sans-serif',
    fuenteTitulos: "'Roboto Condensed', 'Arial Narrow', Roboto, Arial, sans-serif",
    etiquetaMayusculas: true,
    C: {
      primario: '#00468C', // blue-700
      primarioSuave: '#EDF3FA', // blue-50
      wordFondo: '#ECEEF2', // neutral-100
      wordTexto: '#122536', // blue-900
      acento: '#FFCC00', // yellow-400
      fondo: '#F6F7F9',
      borde: '#DCDFE6',
      texto: '#122536', // color-text = blue-900
      secundario: '#585F70',
    },
  },
  vichuquen: {
    nombre: 'Vichuquén',
    logo: { base64: LOGO_CORREO_VICHUQUEN_PNG_BASE64, ancho: 200, alto: 64, alt: 'Municipalidad de Vichuquén' },
    cabecera: '#FFFFFF',
    franjas: ['#00626B', '#CA893E'], // teal-700, gold-400
    fuente: "Lexend, 'Segoe UI', Arial, sans-serif",
    fuenteTitulos: "Lexend, 'Segoe UI', Arial, sans-serif",
    etiquetaMayusculas: false,
    C: {
      primario: '#00626B', // teal-700
      primarioSuave: '#E6F2F3', // teal-50
      wordFondo: '#FCF5EC', // gold-50
      wordTexto: '#7A4C1C', // gold-700 (texto dorado)
      acento: '#CA893E', // gold-400 (solo relleno)
      fondo: '#F3F7F7', // neutral-50
      borde: '#D3DCDD', // neutral-200
      texto: '#172324', // neutral-900
      secundario: '#4A5758', // neutral-600
    },
  },
}

export const cidLogo = (municipio: MunicipioCorreo) => `logo-${municipio}`

const PASOS = [
  'Abre el archivo Word y completa los textos entre [corchetes].',
  'Revisa que tu correo y tu teléfono estén al día.',
  'Guárdalo como PDF y úsalo en tus postulaciones.',
]

interface OpcionesCorreo {
  /** Nombres de los archivos adjuntos, para listarlos en el correo. */
  archivos?: string[]
  /** true si hay una dirección para responder (CV_EMAIL_REPLY_TO). */
  responder?: boolean
  /** Municipio elegido en el sitio: define logo, colores, tipografía y textos. */
  municipio?: MunicipioCorreo
}

export function contenidoCorreo(
  nombre: string,
  diseno: keyof typeof DISENOS,
  { archivos = [], responder = false, municipio = 'hualane' }: OpcionesCorreo = {},
) {
  const marca = MARCAS_CORREO[municipio]
  const { C, fuente: FUENTE, fuenteTitulos: TITULOS } = marca
  const muni = `Municipalidad de ${marca.nombre}`
  const limpio = nombre.trim().startsWith('[') ? '' : nombre.trim().split(/\s+/)[0] ?? ''
  const saludo = limpio ? `Hola, ${limpio}:` : 'Hola:'
  const intro = `Te enviamos tu currículum en el diseño ${DISENOS[diseno]}, en PDF y en Word.`
  const despedida = 'Te deseamos mucho éxito en tu búsqueda de empleo.'
  const pie = `Te llegó este correo porque lo pediste en el sitio de la ${muni}. No guardamos tu CV ni tu correo.${
    responder ? ' Si tienes dudas, responde este mensaje.' : ' Por favor, no respondas este mensaje.'
  }`
  const e = escapeHtml

  const text = [
    saludo,
    intro,
    ...(archivos.length ? ['Archivos adjuntos:', ...archivos.map((a) => `- ${a}`)] : []),
    'Antes de postular:',
    ...PASOS.map((p, i) => `${i + 1}. ${p}`),
    despedida,
    muni,
    '',
    pie,
  ].join('\n\n')

  const estiloEtiqueta = marca.etiquetaMayusculas
    ? `font:700 13px/1.2 ${FUENTE};letter-spacing:.1em;text-transform:uppercase;color:${C.secundario}`
    : `font:600 15px/1.2 ${FUENTE};color:${C.primario}`
  const marcaEtiqueta = marca.etiquetaMayusculas
    ? `<span style="display:inline-block;width:18px;height:8px;background:${C.acento};margin-right:8px;vertical-align:middle"></span>`
    : ''
  const filaAdjunto = (a: string) => {
    const ext = a.split('.').pop()?.toUpperCase() ?? ''
    const [fondo, color] = ext === 'PDF' ? [C.primarioSuave, C.primario] : [C.wordFondo, C.wordTexto]
    return `<tr><td style="padding:6px 0">
      <span style="display:inline-block;min-width:44px;text-align:center;font:700 12px/1 ${FUENTE};letter-spacing:.06em;padding:6px 8px;border-radius:999px;background:${fondo};color:${color}">${e(ext)}</span>
      <span style="font:600 15px/1.4 ${FUENTE};color:${C.texto};padding-left:10px">${e(a)}</span>
    </td></tr>`
  }
  const filaPaso = (p: string, i: number) => `<tr>
    <td valign="top" width="40" style="padding:0 12px 14px 0"><div style="width:28px;height:28px;border-radius:50%;background:${C.primario};color:#fff;font:700 14px/28px ${FUENTE};text-align:center">${i + 1}</div></td>
    <td valign="top" style="padding:3px 0 14px;font:400 16px/1.5 ${FUENTE};color:${C.texto}">${e(p)}</td>
  </tr>`
  const franja = (color: string) => `<tr><td style="height:5px;line-height:5px;font-size:0;background:${color}">&nbsp;</td></tr>`
  const { logo } = marca

  // HTML de correo: tablas y estilos en línea (Gmail, Outlook y móviles).
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e('Tu currículum')}</title></head>
<body style="margin:0;padding:0;background:${C.fondo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${C.borde};border-radius:20px;overflow:hidden">
    <tr><td style="padding:28px 32px 20px;background:${marca.cabecera}"><img src="cid:${cidLogo(municipio)}" width="${logo.ancho}" height="${logo.alto}" alt="${e(logo.alt)}" style="display:block;border:0;width:${logo.ancho}px;height:auto"></td></tr>
    ${marca.franjas.map(franja).join('\n    ')}
    <tr><td style="padding:32px 32px 8px">
      <p style="margin:0 0 12px;${estiloEtiqueta}">${marcaEtiqueta}Empleabilidad</p>
      <h1 style="margin:0 0 8px;font:700 28px/1.2 ${TITULOS};color:${C.primario}">${e(saludo)}</h1>
      <p style="margin:0 0 4px;font:700 22px/1.3 ${TITULOS};color:${C.texto}">Tu currículum está listo.</p>
      <p style="margin:12px 0 0;font:400 17px/1.55 ${FUENTE};color:${C.texto}">${e(intro)}</p>
    </td></tr>
    ${archivos.length ? `<tr><td style="padding:20px 32px 4px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-radius:12px"><tr><td style="padding:14px 18px">
        <p style="margin:0 0 6px;${estiloEtiqueta}">Archivos adjuntos</p>
        <table role="presentation" cellpadding="0" cellspacing="0">${archivos.map(filaAdjunto).join('')}</table>
      </td></tr></table>
    </td></tr>` : ''}
    <tr><td style="padding:24px 32px 8px">
      <h2 style="margin:0 0 14px;font:700 19px/1.3 ${TITULOS};color:${C.texto}">Antes de postular</h2>
      <table role="presentation" cellpadding="0" cellspacing="0">${PASOS.map(filaPaso).join('')}</table>
    </td></tr>
    <tr><td style="padding:8px 32px 32px">
      <p style="margin:0 0 6px;font:400 17px/1.55 ${FUENTE};color:${C.texto}">${e(despedida)}</p>
      <p style="margin:0;font:700 17px/1.4 ${FUENTE};color:${C.primario}">${e(muni)}</p>
    </td></tr>
    <tr><td style="padding:18px 32px;border-top:1px solid ${C.borde};background:${C.fondo};font:400 14px/1.5 ${FUENTE};color:${C.secundario}">${e(pie)}</td></tr>
  </table>
</td></tr></table>
</body></html>`

  return { subject: `Tu currículum · ${muni}`, text, html }
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
  attachments: { filename: string; content: Buffer; contentType: string; cid?: string }[]
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
  const { email, nombre, diseno, adjuntos, municipio, sitioWeb } = parsed.data

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
      // CV_EMAIL_FROM_NAME es el remitente de Hualañé; los otros municipios usan su propio nombre.
      from: `"${municipio === 'hualane' ? config.fromName : `Municipalidad de ${MARCAS_CORREO[municipio].nombre}`}" <${config.user}>`,
      to: email,
      replyTo: config.replyTo,
      ...contenidoCorreo(nombre, diseno, { archivos: archivos.map((a) => a.filename), responder: Boolean(config.replyTo), municipio }),
      // El logo va como imagen interna (CID) referenciada desde el HTML.
      attachments: [
        ...archivos,
        { filename: `${municipio}.png`, content: Buffer.from(MARCAS_CORREO[municipio].logo.base64, 'base64'), contentType: 'image/png', cid: cidLogo(municipio) },
      ],
    })
  } catch (err) {
    return errorSmtp(err)
  }
  return json(200, { ok: true })
}
