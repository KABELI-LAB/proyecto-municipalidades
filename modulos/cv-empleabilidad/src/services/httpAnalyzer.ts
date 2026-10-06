import { AnalisisError, type CvAnalysis, type CvAnalyzer } from './types'

/**
 * Cliente del backend de análisis (`POST {baseUrl}/cv/analyze`). En producción
 * es la función de Netlify; en desarrollo, el plugin de Vite. Contrato en
 * docs/contrato-ia.md.
 */
export function createHttpAnalyzer(baseUrl: string): CvAnalyzer {
  return {
    avisoPrivacidad:
      'Para analizarlo, el texto de su CV se envía a un servicio de inteligencia artificial. No se almacena ni se usa para otros fines.',
    async analyze(input, signal) {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/cv/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal,
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new AnalisisError(body?.error ?? 'El servicio de análisis no está disponible.')
      }
      const data = (await res.json()) as Omit<CvAnalysis, 'origen'>
      return { ...data, origen: 'ia' }
    },
  }
}
