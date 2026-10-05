import { describe, expect, it } from 'vitest'
import { MAX_FILE_BYTES, validateCvFile } from './validateFile'

const f = (name: string, size = 1000, type = '') => ({ name, size, type })

describe('validateCvFile', () => {
  it('acepta PDF y DOCX', () => {
    expect(validateCvFile(f('cv.PDF'))).toEqual({ ok: true, kind: 'pdf' })
    expect(validateCvFile(f('cv.docx'))).toEqual({ ok: true, kind: 'docx' })
  })

  it('rechaza .doc con un mensaje específico', () => {
    const r = validateCvFile(f('cv.doc'))
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toMatch(/\.docx/)
  })

  it('rechaza otros formatos, vacíos y archivos grandes', () => {
    expect(validateCvFile(f('foto.jpg')).ok).toBe(false)
    expect(validateCvFile(f('cv.pdf', 0)).ok).toBe(false)
    expect(validateCvFile(f('cv.pdf', MAX_FILE_BYTES + 1)).ok).toBe(false)
  })
})
