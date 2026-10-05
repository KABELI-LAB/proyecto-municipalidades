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
      return { ok: false, error: 'El formato .doc antiguo no es compatible. Guarde el archivo como .docx o PDF e inténtelo de nuevo.' }
    }
    return { ok: false, error: 'Formato no compatible. Suba su CV en PDF o Word (.docx).' }
  }
  if (file.size === 0) return { ok: false, error: 'El archivo está vacío.' }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: 'El archivo supera los 5 MB. Reduzca su tamaño e inténtelo de nuevo.' }
  }
  return { ok: true, kind }
}
