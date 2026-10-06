import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  type FileChild,
  type IParagraphOptions,
} from 'docx'
import type { CvData } from '../services/types'
import { COLOR, contacto, type DisenoId } from './comun'

/**
 * Word editable (.docx) para cada diseño: la persona puede completar los
 * textos entre [corchetes] antes de postular. Tamaños en medios puntos.
 */

const hex = (c: string) => c.replace('#', '')
const FUENTE = 'Arial'
const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const SIN_BORDES = { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE }
const TAB_DERECHA = 9000 // twips: alinea fechas a la derecha

function texto(t: string, opts: { bold?: boolean; color?: string; size?: number } = {}) {
  return new TextRun({ text: t, font: FUENTE, bold: opts.bold, color: opts.color ? hex(opts.color) : hex(COLOR.grisTexto), size: opts.size ?? 20 })
}

function parrafo(runs: TextRun[], extra: Omit<IParagraphOptions, 'children'> = {}) {
  return new Paragraph({ children: runs, spacing: { after: 60 }, ...extra })
}

function vinetas(items: string[], color?: string): Paragraph[] {
  return items.map((l) => new Paragraph({ children: [texto(l, { color })], bullet: { level: 0 }, spacing: { after: 30 } }))
}

function itemsExperiencia(cv: CvData, conTab = true): Paragraph[] {
  return cv.experiencia.flatMap((e) => [
    parrafo(
      [
        texto(e.cargo, { bold: true }),
        texto(e.organizacion ? ` · ${e.organizacion}` : ''),
        ...(e.periodo ? [texto(conTab ? `\t${e.periodo}` : `  (${e.periodo})`, { color: COLOR.grisMedio, size: 18 })] : []),
      ],
      { tabStops: [{ type: TabStopType.RIGHT, position: TAB_DERECHA }], spacing: { before: 120, after: 40 } },
    ),
    ...vinetas(e.logros),
  ])
}

function itemsEducacion(cv: CvData, conTab = true): Paragraph[] {
  return cv.educacion.flatMap((e) => [
    parrafo(
      [texto(e.titulo, { bold: true }), ...(e.periodo ? [texto(conTab ? `\t${e.periodo}` : `  (${e.periodo})`, { color: COLOR.grisMedio, size: 18 })] : [])],
      { tabStops: [{ type: TabStopType.RIGHT, position: TAB_DERECHA }], spacing: { before: 100, after: 20 } },
    ),
    ...(e.institucion ? [parrafo([texto(e.institucion)])] : []),
  ])
}

// ---------- Clásico ----------

function tituloClasico(t: string) {
  return new Paragraph({
    children: [texto(t.toUpperCase(), { bold: true, color: COLOR.azul, size: 21 })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: hex(COLOR.azul), space: 2 } },
    spacing: { before: 240, after: 100 },
  })
}

function clasico(cv: CvData): FileChild[] {
  const centro = { alignment: AlignmentType.CENTER }
  return [
    parrafo([texto(cv.nombre, { bold: true, color: COLOR.azul, size: 44 })], centro),
    parrafo([texto(cv.titular, { bold: true, size: 22 })], centro),
    parrafo([texto(contacto(cv).join('   ·   '), { size: 18 })], centro),
    tituloClasico('Perfil profesional'),
    parrafo([texto(cv.perfil)]),
    ...(cv.experiencia.length ? [tituloClasico('Experiencia laboral'), ...itemsExperiencia(cv)] : []),
    ...(cv.educacion.length ? [tituloClasico('Formación'), ...itemsEducacion(cv)] : []),
    ...(cv.habilidades.length ? [tituloClasico('Habilidades'), parrafo([texto(cv.habilidades.join(' · '))])] : []),
    tituloClasico('Idiomas'),
    parrafo([texto(cv.idiomas.join(' · '))]),
  ]
}

// ---------- Moderno: tabla de 2 columnas, lateral azul ----------

function moderno(cv: CvData): FileChild[] {
  const blanco = '#FFFFFF'
  const lateralTitulo = (t: string) =>
    parrafo([texto(t.toUpperCase(), { bold: true, color: blanco, size: 18 })], { spacing: { before: 280, after: 80 } })
  const lateralLista = (items: string[]) => items.map((x) => parrafo([texto(x, { color: COLOR.marfil, size: 18 })], { spacing: { after: 40 } }))
  const mainTitulo = (t: string) =>
    parrafo([texto('▬  ', { color: COLOR.verde, size: 22 }), texto(t, { bold: true, color: COLOR.azul, size: 26 })], { spacing: { before: 200, after: 100 } })

  const lateral = [
    parrafo([texto(cv.nombre, { bold: true, color: blanco, size: 34 })]),
    parrafo([texto(cv.titular, { color: COLOR.marfil })]),
    lateralTitulo('Contacto'),
    ...lateralLista(contacto(cv)),
    ...(cv.habilidades.length ? [lateralTitulo('Habilidades'), ...lateralLista(cv.habilidades)] : []),
    lateralTitulo('Idiomas'),
    ...lateralLista(cv.idiomas),
  ]
  const principal = [
    mainTitulo('Perfil'),
    parrafo([texto(cv.perfil)]),
    ...(cv.experiencia.length ? [mainTitulo('Experiencia'), ...itemsExperiencia(cv, false)] : []),
    ...(cv.educacion.length ? [mainTitulo('Formación'), ...itemsEducacion(cv, false)] : []),
  ]
  const margen = { top: 400, bottom: 400, left: 300, right: 300 }
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: SIN_BORDES,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(COLOR.azul) },
              margins: margen,
              verticalAlign: VerticalAlign.TOP,
              children: lateral,
            }),
            new TableCell({ width: { size: 68, type: WidthType.PERCENTAGE }, margins: margen, children: principal }),
          ],
        }),
      ],
    }),
  ]
}

// ---------- Compacto: filas etiqueta | contenido ----------

function compacto(cv: CvData): FileChild[] {
  const fila = (titulo: string, contenido: Paragraph[]) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: hex(COLOR.grisClaro) }, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE },
          margins: { top: 120, bottom: 120 },
          children: [parrafo([texto(titulo.toUpperCase(), { bold: true, color: COLOR.verde, size: 16 })])],
        }),
        new TableCell({
          width: { size: 80, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.SINGLE, size: 4, color: hex(COLOR.grisClaro) }, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE },
          margins: { top: 120, bottom: 120 },
          children: contenido,
        }),
      ],
    })
  return [
    new Paragraph({
      children: [texto(cv.nombre, { bold: true, size: 38 })],
      border: { left: { style: BorderStyle.SINGLE, size: 36, color: hex(COLOR.verde), space: 8 } },
    }),
    new Paragraph({
      children: [texto(cv.titular, { bold: true, color: COLOR.verde })],
      border: { left: { style: BorderStyle.SINGLE, size: 36, color: hex(COLOR.verde), space: 8 } },
      spacing: { after: 80 },
    }),
    parrafo([texto(contacto(cv).join('  ·  '), { size: 18 })], { spacing: { after: 160 } }),
    new Paragraph({
      children: [texto(cv.perfil, { size: 19 })],
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(COLOR.grisClaro) },
      spacing: { after: 160 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: SIN_BORDES,
      rows: [
        ...(cv.experiencia.length ? [fila('Experiencia', itemsExperiencia(cv, false))] : []),
        ...(cv.educacion.length ? [fila('Formación', itemsEducacion(cv, false))] : []),
        ...(cv.habilidades.length ? [fila('Habilidades', [parrafo([texto(cv.habilidades.join(' · '))])])] : []),
        fila('Idiomas', [parrafo([texto(cv.idiomas.join(' · '))])]),
      ],
    }),
  ]
}

const DISENOS: Record<DisenoId, (cv: CvData) => FileChild[]> = { clasico, moderno, compacto }

export function crearDocx(cv: CvData, diseno: DisenoId): Document {
  const margen = diseno === 'moderno' ? 500 : 1000
  return new Document({
    creator: cv.nombre,
    title: `CV ${cv.nombre}`,
    styles: { default: { document: { run: { font: FUENTE, size: 20 } } } },
    sections: [{ properties: { page: { margin: { top: margen, bottom: margen, left: margen, right: margen } } }, children: DISENOS[diseno](cv) }],
  })
}

export function renderDocx(cv: CvData, diseno: DisenoId): Promise<Blob> {
  return Packer.toBlob(crearDocx(cv, diseno))
}
