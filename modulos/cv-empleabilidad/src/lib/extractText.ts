import type { CvFileKind } from './validateFile'

/**
 * Extrae el texto del CV en el navegador. Las librerías se cargan bajo
 * demanda para no inflar el bundle de la pestaña.
 */
export async function extractText(file: File, kind: CvFileKind): Promise<string> {
  const buffer = await file.arrayBuffer()
  return kind === 'pdf' ? extractPdf(buffer) : extractDocx(buffer)
}

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const doc = await task.promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    let text = ''
    for (const item of content.items) {
      if (!('str' in item)) continue
      text += item.str
      if (item.hasEOL) text += '\n'
    }
    pages.push(text)
  }
  await task.destroy()
  return pages.join('\n')
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}
