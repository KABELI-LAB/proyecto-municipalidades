export const MAX_FILE_BYTES = 5 * 1024 * 1024

export type CvFileKind = 'pdf' | 'docx'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export type FileCheck = { ok: true; kind: CvFileKind } | { ok: false; error: string }

export function validateCvFile(file: Pick<File, 'name' | 'size' | 'type'>): FileCheck {
  const name = file.name.toLowerCase()
  let kind: CvFileKind | null = null
  if (name.endsWith('.pdf') || file.type === 'application/pdf') kind = 'pdf'
  else if (name.endsWith('.docx') || file.type === DOCX_MIME) kind = 'docx'

  if (!kind) {
    if (name.endsWith('.doc')) {
      return { ok: false, error: 'No podemos leer el formato .doc antiguo. Guarda tu archivo como .docx o PDF y súbelo de nuevo.' }
    }
    return { ok: false, error: 'No podemos leer este formato. Sube tu CV en PDF o Word (.docx).' }
  }
  if (file.size === 0) return { ok: false, error: 'Tu archivo está vacío. Revisa que sea el correcto.' }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: 'Tu archivo pesa más de 5 MB. Quita las imágenes grandes o guárdalo como PDF y súbelo de nuevo.' }
  }
  return { ok: true, kind }
}
