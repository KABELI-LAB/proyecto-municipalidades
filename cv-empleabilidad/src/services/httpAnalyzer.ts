import type { CvAnalysis, CvAnalyzer } from './types'

/**
 * Cliente para el backend de IA (aún no implementado). El backend recibe el
 * texto del CV, llama al modelo con la API key en el servidor y devuelve un
 * CvAnalysis. Contrato completo en docs/contrato-ia.md.
 */
export function createHttpAnalyzer(baseUrl: string): CvAnalyzer {
  return {
    async analyze(input, signal) {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/cv/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal,
      })
      if (!res.ok) throw new Error(`El servicio de análisis respondió ${res.status}`)
      const data = (await res.json()) as CvAnalysis
      return { ...data, origen: 'ia' }
    },
  }
}
