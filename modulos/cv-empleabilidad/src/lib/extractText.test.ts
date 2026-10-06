// @vitest-environment node
import { Document, ImageRun, Packer, Paragraph, TextRun } from 'docx'
import { describe, expect, it } from 'vitest'
import { extractText } from './extractText'

// PNG de 1×1 px.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

async function docxCon(imagenes: number): Promise<File> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun('Ana Soto Pérez')] }),
          ...Array.from({ length: imagenes }, () => new Paragraph({ children: [new ImageRun({ type: 'png', data: PNG, transformation: { width: 10, height: 10 } })] })),
        ],
      },
    ],
  })
  return new File([new Uint8Array(await Packer.toBuffer(doc))], 'cv.docx')
}

describe('extractText (docx)', () => {
  it('extrae el texto y cuenta las imágenes sin leerlas', async () => {
    expect(await extractText(await docxCon(0), 'docx')).toEqual({ texto: expect.stringContaining('Ana Soto Pérez'), imagenes: 0 })
    expect((await extractText(await docxCon(2), 'docx')).imagenes).toBe(2)
  })
})
