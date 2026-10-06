import type { CvFileKind } from './validateFile'

export interface Extraccion {
  texto: string
  /** Imágenes encontradas (fotos, íconos, logos). Solo se cuentan: no se leen ni se envían. */
  imagenes: number
}

/**
 * Extrae el texto del CV en el navegador y cuenta sus imágenes. Las librerías
 * se cargan bajo demanda para no inflar el bundle de la pestaña.
 */
export async function extractText(file: File, kind: CvFileKind): Promise<Extraccion> {
  const buffer = await file.arrayBuffer()
  return kind === 'pdf' ? extractPdf(buffer) : extractDocx(buffer)
}

async function extractPdf(buffer: ArrayBuffer): Promise<Extraccion> {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

  const OPS_IMAGEN = new Set<number>([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject, pdfjs.OPS.paintImageXObjectRepeat])
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const doc = await task.promise
  const pages: string[] = []
  let imagenes = 0
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
    const ops = await page.getOperatorList()
    imagenes += ops.fnArray.filter((fn) => OPS_IMAGEN.has(fn)).length
  }
  await task.destroy()
  return { texto: pages.join('\n'), imagenes }
}

async function extractDocx(buffer: ArrayBuffer): Promise<Extraccion> {
  const mammoth = await import('mammoth')
  // El build de navegador de mammoth lee `arrayBuffer` y el de Node `buffer`:
  // se pasan ambos para que funcione en los dos (Node se usa en los tests).
  const entrada: { arrayBuffer: ArrayBuffer } = Object.assign({ arrayBuffer: buffer }, { buffer: new Uint8Array(buffer) })
  let imagenes = 0
  const [raw] = await Promise.all([
    mammoth.extractRawText(entrada),
    // Solo para contar imágenes: el HTML resultante se descarta.
    mammoth.convertToHtml(
      entrada,
      {
        convertImage: mammoth.images.imgElement(async () => {
          imagenes++
          return { src: '' }
        }),
      },
    ),
  ])
  return { texto: raw.value, imagenes }
}
