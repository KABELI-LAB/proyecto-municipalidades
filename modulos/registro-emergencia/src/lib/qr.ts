import { useEffect, useState } from 'react'

/**
 * SVG del QR para un código familiar. El QR contiene SOLO el código
 * (ej. `FAM-7K3Q-82`), nunca datos personales. La librería se carga bajo demanda.
 */
export async function qrSvg(codigo: string): Promise<string> {
  const QR = await import('qrcode')
  return QR.toString(codigo, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0d1533', light: '#ffffff' } })
}

/** PNG (data URL) del QR, para la tarjeta descargable y el PDF. */
export async function qrPng(codigo: string, ancho = 360): Promise<string> {
  const QR = await import('qrcode')
  return QR.toDataURL(codigo, { margin: 1, width: ancho, errorCorrectionLevel: 'M', color: { dark: '#0d1533', light: '#ffffff' } })
}

export function useQr(codigo: string | undefined): string | null {
  const [svg, setSvg] = useState<{ codigo: string; svg: string } | null>(null)
  useEffect(() => {
    if (!codigo) return
    let vigente = true
    qrSvg(codigo)
      .then((s) => vigente && setSvg({ codigo, svg: s }))
      .catch(() => undefined)
    return () => {
      vigente = false
    }
  }, [codigo])
  return svg && svg.codigo === codigo ? svg.svg : null
}
