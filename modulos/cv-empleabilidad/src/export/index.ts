import type { CvData } from '../services/types'
import { MIME, nombreBase, type DisenoId } from './comun'

export type { DisenoId }

export interface ArchivoCv {
  nombre: string
  tipo: 'pdf' | 'docx'
  blob: Blob
}

/**
 * Genera el CV en PDF y Word para el diseño elegido. Las librerías (pesadas)
 * se cargan bajo demanda, solo cuando la persona descarga o envía.
 */
export async function generarArchivos(cv: CvData, diseno: DisenoId): Promise<ArchivoCv[]> {
  const [{ renderPdf }, { renderDocx }] = await Promise.all([import('./pdf'), import('./docx')])
  const [pdf, docx] = await Promise.all([renderPdf(cv, diseno), renderDocx(cv, diseno)])
  const base = nombreBase(cv, diseno)
  return [
    { nombre: `${base}.pdf`, tipo: 'pdf', blob: new Blob([pdf], { type: MIME.pdf }) },
    { nombre: `${base}.docx`, tipo: 'docx', blob: new Blob([docx], { type: MIME.docx }) },
  ]
}

export function descargar(archivo: ArchivoCv) {
  const url = URL.createObjectURL(archivo.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = archivo.nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function aBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
