// @vitest-environment node
import { renderToBuffer } from '@react-pdf/renderer'
import { Packer } from 'docx'
import { describe, expect, it } from 'vitest'
import { analizarTexto } from '../services/mockAnalyzer'
import { CV_COMPLETO, CV_POBRE } from '../test/fixtures'
import { nombreBase } from './comun'
import { crearDocx } from './docx'
import { CvPdfDocument } from './pdf'

const DISENOS = ['clasico', 'moderno', 'compacto'] as const
const completo = analizarTexto({ texto: CV_COMPLETO, nombreArchivo: 'a' }).cvMejorado
const pobre = analizarTexto({ texto: CV_POBRE, nombreArchivo: 'b' }).cvMejorado

describe('exportación', () => {
  for (const diseno of DISENOS) {
    it(`genera PDF y Word válidos en diseño ${diseno}`, async () => {
      for (const cv of [completo, pobre]) {
        const pdf = await renderToBuffer(<CvPdfDocument cv={cv} diseno={diseno} />)
        expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
        const docx = await Packer.toBuffer(crearDocx(cv, diseno))
        expect(docx.subarray(0, 2).toString()).toBe('PK')
      }
    }, 30_000)
  }

  it('arma nombres de archivo sin tildes ni marcadores', () => {
    expect(nombreBase(completo, 'moderno')).toBe('CV-Maria-Jose-Fuentes-Rojas-moderno')
    expect(nombreBase({ ...completo, nombre: '[Su nombre completo]' }, 'clasico')).toBe('CV-clasico')
  })
})
