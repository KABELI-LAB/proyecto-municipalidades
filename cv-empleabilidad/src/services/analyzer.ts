import { createHttpAnalyzer } from './httpAnalyzer'
import { mockAnalyzer } from './mockAnalyzer'
import type { CvAnalyzer } from './types'

/**
 * Elige el analizador según el entorno. Con VITE_CV_API_URL definido usa el
 * backend; si no, el mock. La app anfitriona también puede inyectar uno
 * propio mediante la prop `analyzer` de <CvTab />.
 */
export function createDefaultAnalyzer(): CvAnalyzer {
  const url = import.meta.env.VITE_CV_API_URL as string | undefined
  return url ? createHttpAnalyzer(url) : mockAnalyzer
}
