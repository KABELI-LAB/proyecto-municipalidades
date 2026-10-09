import type { CvFileKind } from './validateFile'

/**
 * Muestra el CV que subió la persona, tal como venía, para compararlo con el
 * mejorado. Todo ocurre en el navegador: el archivo no se envía a ningún lado.
 */

export type VistaOriginal =
  | { tipo: 'pdf'; paginas: string[] } // data URLs (PNG), una por página
  | { tipo: 'docx'; html: string } // documento HTML completo para un iframe sandbox

const MAX_PAGINAS = 5

export async function renderOriginal(file: File, kind: CvFileKind, anchoCss: number): Promise<VistaOriginal> {
  const buffer = await file.arrayBuffer()
  return kind === 'pdf' ? { tipo: 'pdf', paginas: await pdfAImagenes(buffer, anchoCss) } : { tipo: 'docx', html: await docxAHtml(buffer) }
}

async function pdfAImagenes(buffer: ArrayBuffer, anchoCss: number): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const doc = await task.promise
  const densidad = Math.min(2, window.devicePixelRatio || 1)
  const paginas: string[] = []
  try {
    for (let i = 1; i <= Math.min(doc.numPages, MAX_PAGINAS); i++) {
      const page = await doc.getPage(i)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: (Math.max(anchoCss, 320) / base.width) * densidad })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      await page.render({ canvas, viewport }).promise
      paginas.push(canvas.toDataURL('image/png'))
    }
  } finally {
    await task.destroy()
  }
  return paginas
}

async function docxAHtml(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  // Igual que en extractText: el build de navegador lee `arrayBuffer` y el de Node `buffer`.
  const entrada: { arrayBuffer: ArrayBuffer } = Object.assign({ arrayBuffer: buffer }, { buffer: new Uint8Array(buffer) })
  const { value } = await mammoth.convertToHtml(entrada)
  // Se muestra en un iframe con sandbox="" (sin scripts ni acceso a la página).
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
body{margin:0;padding:32px 28px;font:15px/1.5 Calibri,Arial,sans-serif;color:#1A1F2C;background:#fff;word-wrap:break-word}
h1,h2,h3{line-height:1.25;margin:1em 0 .4em}img{max-width:100%;height:auto}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #DCDFE6;padding:4px 6px}
</style></head><body>${value}</body></html>`
}
