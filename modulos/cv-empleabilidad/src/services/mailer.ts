import { aBase64, type ArchivoCv, type DisenoId } from '../export'
import { AnalisisError } from './types'

export interface EnvioCv {
  email: string
  nombre: string
  diseno: DisenoId
  adjuntos: ArchivoCv[]
  /** Honeypot anti-bots (campo oculto del formulario). */
  sitioWeb?: string
}

export interface CvMailer {
  enviar(envio: EnvioCv, signal?: AbortSignal): Promise<void>
  /** true si no envía correos de verdad (modo demostración). */
  demo?: boolean
}

/** Cliente de `POST {baseUrl}/cv/enviar` (función de Netlify / plugin de Vite). */
export function createHttpMailer(baseUrl: string): CvMailer {
  return {
    async enviar({ adjuntos, ...resto }, signal) {
      const body = {
        ...resto,
        adjuntos: await Promise.all(adjuntos.map(async (a) => ({ nombre: a.nombre, contenido: await aBase64(a.blob) }))),
      }
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/cv/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new AnalisisError(data?.error ?? 'No pudimos enviar el correo. Inténtelo nuevamente.')
      }
    },
  }
}

/** No envía nada: simula la espera para desarrollar la UI sin Resend. */
export const mockMailer: CvMailer = {
  demo: true,
  enviar: () => new Promise((resolve) => setTimeout(resolve, 800)),
}

export function createDefaultMailer(): CvMailer {
  const url = import.meta.env.VITE_CV_API_URL as string | undefined
  return url ? createHttpMailer(url) : mockMailer
}
