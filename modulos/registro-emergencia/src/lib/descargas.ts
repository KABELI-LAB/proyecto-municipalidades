/**
 * Descargas de R3: tarjeta como imagen PNG y tarjeta + plan familiar en PDF.
 * Se generan en el navegador (nada viaja al servidor). Colores = hex del design
 * system, porque canvas y PDF no leen variables CSS.
 */
import escudoUrl from '@muni/design-system/assets/logo/escudo.png'
import type { MiHogar } from '../../shared/contrato.ts'
import { fechaTabla } from '../../shared/fechas.ts'
import { NIVELES } from '../../shared/incentivos.ts'
import { qrPng } from './qr'

export const COLORES = {
  blue500: '#1270B7',
  blue700: '#253786',
  blue950: '#0D1533',
  green500: '#3AAA35',
  green700: '#316B2C',
  yellow400: '#FAC22F',
  neutral200: '#DCDFE6',
  neutral600: '#585F70',
  texto: '#0E121B',
}

export { escudoUrl }

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = mal
    img.src = src
  })
}

/** Tarjeta a 1012 × 638 px (proporción de tarjeta física), frente y QR en una sola cara. */
export async function tarjetaPng(h: MiHogar): Promise<Blob> {
  const W = 1012
  const H = 638
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('canvas no disponible')
  await document.fonts?.ready
  const fuente = (peso: number, px: number, mono = false) =>
    `${peso} ${px}px ${mono ? '"Atkinson Hyperlegible Mono", monospace' : '"Atkinson Hyperlegible Next", system-ui, sans-serif'}`

  // Fondo
  ctx.fillStyle = COLORES.blue700
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 56)
  ctx.fill()

  // Cauce: tres ondas al pie
  const ondas = [COLORES.blue500, 'rgba(255,255,255,.55)', COLORES.green500]
  ondas.forEach((color, i) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 14
    ctx.beginPath()
    const y = H - 110 + i * 34
    ctx.moveTo(0, y + 40)
    ctx.bezierCurveTo(W * 0.3, y + 50, W * 0.55, y - 10, W, y - 30)
    ctx.stroke()
  })

  // Escudo original sobre placa blanca
  const escudo = await cargarImagen(escudoUrl)
  const eh = 96
  const ew = (escudo.width / escudo.height) * eh
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.roundRect(48, 44, ew + 24, eh + 24, 14)
  ctx.fill()
  ctx.drawImage(escudo, 60, 56, ew, eh)

  ctx.fillStyle = '#fff'
  ctx.font = fuente(800, 40)
  ctx.fillText('Hogar Preparado', 48 + ew + 48, 98)
  ctx.font = fuente(700, 26)
  ctx.fillText('HUALAÑÉ', 48 + ew + 48, 136)

  ctx.font = fuente(800, 54)
  ctx.fillText(recortar(ctx, h.nombreTarjeta, 560), 48, 250)
  ctx.font = fuente(400, 28)
  ctx.fillText(recortar(ctx, h.direccion, 560), 48, 300)
  ctx.fillText(`${h.totalPersonas} ${h.totalPersonas === 1 ? 'persona' : 'personas'}`, 48, 342)

  ctx.font = fuente(700, 44, true)
  ctx.fillText(h.codigoFamiliar, 48, 440)

  // Insignia de nivel: amarillo con texto Blue 950
  const nivel = `Nivel ${h.nivel} · ${NIVELES[h.nivel].nombre}`
  ctx.font = fuente(700, 24)
  const nw = ctx.measureText(nivel).width + 36
  ctx.fillStyle = COLORES.yellow400
  ctx.beginPath()
  ctx.roundRect(48, 466, nw, 44, 22)
  ctx.fill()
  ctx.fillStyle = COLORES.blue950
  ctx.fillText(nivel, 66, 497)
  ctx.fillStyle = '#fff'
  ctx.font = fuente(400, 24)
  ctx.fillText(`Vigente hasta ${fechaTabla(h.vigenteHasta)}`, 48 + nw + 20, 497)

  // QR sobre blanco
  const qr = await cargarImagen(await qrPng(h.codigoFamiliar, 300))
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.roundRect(W - 356, 196, 308, 308, 20)
  ctx.fill()
  ctx.drawImage(qr, W - 346, 206, 288, 288)

  return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error('png'))), 'image/png'))
}

function recortar(ctx: CanvasRenderingContext2D, texto: string, max: number): string {
  if (ctx.measureText(texto).width <= max) return texto
  let t = texto
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t}…`
}

/** PDF con la tarjeta y el plan familiar (react-pdf se carga bajo demanda). */
export async function planPdf(h: MiHogar): Promise<Blob> {
  const [{ generarPdfPlan }, qr] = await Promise.all([import('./planPdf'), qrPng(h.codigoFamiliar, 360)])
  return generarPdfPlan(h, qr, escudoUrl)
}

export function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
