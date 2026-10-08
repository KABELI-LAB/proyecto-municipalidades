import { z } from 'zod'
import { json } from './http.ts'

/**
 * POST /api/cv/enviar → envía a la persona su CV (PDF + Word) por correo
 * usando Resend. Asunto y cuerpo son fijos para que el endpoint no sirva
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

export async function handleEnviarRequest(req: Request, env: Env, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido.' })

  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.CV_EMAIL_FROM?.trim()
  if (!apiKey || !from) {
    console.error('[cv-enviar] faltan variables RESEND_API_KEY / CV_EMAIL_FROM')
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

  const tipos = new Set<string>()
  for (const a of adjuntos) {
    const bytes = Buffer.from(a.contenido, 'base64')
    const extension = a.nombre.split('.').pop()
    if (bytes.length === 0 || bytes.length > MAX_ADJUNTO || tipoReal(bytes) !== extension || tipos.has(extension)) {
      return json(400, { error: 'No pudimos adjuntar tu CV. Vuelve a elegir el diseño e inténtalo de nuevo.' })
    }
    tipos.add(extension)
  }

  let res: Response
  try {
    res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: [email],
        ...contenidoCorreo(nombre, diseno),
        attachments: adjuntos.map((a) => ({ filename: a.nombre, content: a.contenido })),
      }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    console.error('[cv-enviar] error de red', (err as Error).name)
    return json(502, { error: 'No pudimos enviar el correo. Inténtalo de nuevo.' })
  }

  if (!res.ok) {
    console.error(`[cv-enviar] Resend respondió ${res.status}`)
    if (res.status === 422) return json(400, { error: 'Revisa el correo que escribiste.' })
    if (res.status === 429) return json(503, { error: 'Hay muchas solicitudes en este momento. Inténtalo en unos minutos.' })
    return json(502, { error: 'No pudimos enviar el correo. Inténtalo de nuevo.' })
  }
  return json(200, { ok: true })
}
