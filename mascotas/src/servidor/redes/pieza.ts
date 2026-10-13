// Pieza gráfica para Instagram (1080 × 1350, formato 4:5, JPEG): identidad
// municipal (escudo negativo sobre azul institucional, desde la ruta que
// define la configuración del municipio), tipografías y colores del sistema
// de diseño, y la foto del animal sin alterarla (solo se recorta para
// encuadrar). Se genera en el servidor con sharp; no usa servicios externos.
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import type { TipoRed } from "@/dominio/redes";
import { municipioActivo } from "@/lib/municipio";

export const ANCHO = 1080;
export const ALTO = 1350;
const MARGEN = 56;
const UTIL = ANCHO - 2 * MARGEN;
const CABECERA = 190;
const PIE = 130;

// Colores de design-system/tokens.json.
const COLOR = {
  azul: "#174a6e",
  azulFilete: "#2e6189",
  celeste: "#6ba8b8",
  verde: "#4e7d52",
  marfil: "#f5f1e8",
  terracota: "#b96545",
  grisTexto: "#263238",
  blanco: "#ffffff",
} as const;

// Pango no lee woff2: estas son las mismas fuentes de design-system/fonts/,
// fijadas en un peso y guardadas como TTF (vea fuentes/LEAME.md).
const FUENTES = path.join(process.cwd(), "src", "servidor", "redes", "fuentes");
const FUENTE = {
  titulos: { familia: "Montserrat Bold", archivo: path.join(FUENTES, "Montserrat-Bold.ttf") },
  texto: { familia: "Source Sans 3", archivo: path.join(FUENTES, "SourceSans3-Regular.ttf") },
  textoNegrita: { familia: "Source Sans 3 Bold", archivo: path.join(FUENTES, "SourceSans3-Bold.ttf") },
};

/** Distintivo de cada tipo: texto y color (texto blanco, grande y en negrita). */
const DISTINTIVO: Record<TipoRed, { texto: string; color: string }> = {
  OPERATIVO: { texto: "Operativo de tenencia responsable", color: COLOR.azulFilete },
  ADOPCION: { texto: "En adopción", color: COLOR.verde },
  PERDIDA: { texto: "Se busca", color: COLOR.terracota },
  AVISTADA: { texto: "Mascota avistada", color: COLOR.azulFilete },
};

export type DatosPieza = {
  tipo: TipoRed;
  titulo: string;
  /** Líneas de detalle; la primera va destacada cuando no hay foto. */
  lineas: string[];
  /** Lista con viñetas (servicios del operativo). */
  lista?: string[];
  /** Cómo participar o entregar información. */
  llamado: string;
  foto: Buffer | null;
  /** Dirección pública del portal (sin protocolo), si existe. */
  portal: string | null;
  demo: boolean;
};

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Texto = { texto: string; tamano: number; color: string; negrita?: boolean; titulos?: boolean; ancho?: number };

/** Bloque de texto con salto de línea por palabras, en la fuente local del sistema de diseño. */
async function bloque({ texto, tamano, color, negrita = false, titulos = false, ancho = UTIL }: Texto) {
  const fuente = titulos ? FUENTE.titulos : negrita ? FUENTE.textoNegrita : FUENTE.texto;
  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${color}">${escapar(texto)}</span>`,
      font: `${fuente.familia} ${tamano}`,
      fontfile: fuente.archivo,
      width: ancho,
      wrap: "word",
      rgba: true,
      spacing: Math.round(tamano * 0.25),
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { imagen: data, ancho: info.width, alto: info.height };
}

const rect = (ancho: number, alto: number, color: string) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect width="${ancho}" height="${alto}" rx="4" fill="${color}"/></svg>`);

// Huellas y corazón decorativos: las mismas formas de la portada del portal.
const huella = (x: number, y: number, escala: number, giro: number, color: string) =>
  `<g transform="translate(${x} ${y}) rotate(${giro}) scale(${escala})" fill="${color}"><ellipse cx="12" cy="16.2" rx="4.6" ry="3.9"/><ellipse cx="5.2" cy="10.4" rx="2.1" ry="2.6"/><ellipse cx="18.8" cy="10.4" rx="2.1" ry="2.6"/><ellipse cx="9" cy="5.6" rx="2" ry="2.6"/><ellipse cx="15" cy="5.6" rx="2" ry="2.6"/></g>`;
const corazon = (x: number, y: number, escala: number, giro: number, color: string) =>
  `<g transform="translate(${x} ${y}) rotate(${giro}) scale(${escala})" fill="${color}"><path d="M12 21s-8.5-5.2-8.5-11.4A4.8 4.8 0 0 1 12 6.8a4.8 4.8 0 0 1 8.5 2.8C20.5 15.8 12 21 12 21z"/></g>`;

/** Huellas en azul filete sobre el pie azul. */
const huellasPie = () =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="${PIE}">${huella(200, 58, 3.2, -24, COLOR.azulFilete)}${huella(120, 18, 2.6, -30, COLOR.azulFilete)}${huella(40, 52, 2.2, -20, COLOR.azulFilete)}</svg>`);

/** Rastro de huellas y un corazón para el espacio libre de las piezas sin foto; se ajusta al alto disponible. */
function rastro(ancho: number, alto: number) {
  const k = Math.min(1, alto / 360);
  const h = (x: number, y: number, e: number, g: number) => huella(x, alto - y * k, e * k, g, COLOR.celeste);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">${h(ancho - 170, 150, 5, -24)}${h(ancho - 360, 250, 4.2, -30)}${h(ancho - 560, 190, 3.6, -20)}${corazon(MARGEN, alto - 170 * k, 5.5 * k, -12, COLOR.celeste)}</svg>`,
  );
}

/** Ruta del escudo según la configuración («/ds/…» apunta a design-system/). */
function rutaEscudo() {
  const ruta = municipioActivo().identidad.escudoNegativo;
  return ruta.startsWith("/ds/") ? path.join(process.cwd(), "design-system", ruta.slice(4)) : path.join(process.cwd(), "public", ruta);
}

export async function generarPieza(d: DatosPieza): Promise<Buffer> {
  const municipio = municipioActivo();
  const capas: OverlayOptions[] = [];
  const poner = (input: Buffer, left: number, top: number) => capas.push({ input, left: Math.round(left), top: Math.round(top) });

  // Cabecera: escudo negativo sobre azul y la firma institucional.
  poner(rect(ANCHO, CABECERA, COLOR.azul), 0, 0);
  const escudo = await sharp(await readFile(rutaEscudo())).resize({ height: 130, fit: "inside" }).png().toBuffer({ resolveWithObject: true });
  poner(escudo.data, MARGEN, (CABECERA - escudo.info.height) / 2);
  const firma = await bloque({ texto: municipio.firma.join("\n"), tamano: 38, color: COLOR.blanco, negrita: true, titulos: true, ancho: UTIL - escudo.info.width - 32 });
  poner(firma.imagen, MARGEN + escudo.info.width + 32, (CABECERA - firma.alto) / 2);

  // Distintivo del tipo y, si corresponde, la marca de demostración.
  let y = CABECERA + 36;
  const distintivo = await bloque({ texto: DISTINTIVO[d.tipo].texto, tamano: 32, color: COLOR.blanco, negrita: true, titulos: true });
  poner(rect(distintivo.ancho + 40, distintivo.alto + 24, DISTINTIVO[d.tipo].color), MARGEN, y);
  poner(distintivo.imagen, MARGEN + 20, y + 12);
  if (d.demo) {
    const demo = await bloque({ texto: "Datos de demostración", tamano: 26, color: COLOR.grisTexto, negrita: true, ancho: 360 });
    poner(demo.imagen, ANCHO - MARGEN - demo.ancho, y + (distintivo.alto + 24 - demo.alto) / 2);
  }
  y += distintivo.alto + 24 + 32;

  if (d.foto) {
    // Foto: solo se recorta para encuadrar; no cambia colores ni rasgos.
    const alto = Math.max(460, 600 - 70 * Math.max(0, d.lineas.length - 2));
    const foto = await sharp(d.foto).rotate().resize({ width: UTIL, height: alto, fit: "cover", position: "attention" }).png().toBuffer();
    poner(foto, MARGEN, y);
    y += alto + 32;
    const titulo = await bloque({ texto: d.titulo, tamano: 54, color: COLOR.azul, negrita: true, titulos: true });
    poner(titulo.imagen, MARGEN, y);
    y += titulo.alto + 20;
    for (const linea of d.lineas) {
      const b = await bloque({ texto: linea, tamano: 34, color: COLOR.grisTexto });
      poner(b.imagen, MARGEN, y);
      y += b.alto + 8;
    }
  } else {
    const titulo = await bloque({ texto: d.titulo, tamano: 72, color: COLOR.azul, negrita: true, titulos: true });
    poner(titulo.imagen, MARGEN, y);
    y += titulo.alto + 36;
    // Tarjeta blanca con fecha, horario, lugar y servicios.
    const dentro: { imagen: Buffer; alto: number; separacion: number }[] = [];
    for (const [i, linea] of d.lineas.entries()) {
      const b = await bloque({ texto: linea, tamano: i === 0 ? 56 : 42, color: i === 0 ? COLOR.azul : COLOR.grisTexto, negrita: i === 0, titulos: i === 0, ancho: UTIL - 80 });
      dentro.push({ imagen: b.imagen, alto: b.alto, separacion: i === 0 ? 20 : 14 });
    }
    if (d.lista?.length) {
      const encabezado = await bloque({ texto: "Servicios", tamano: 40, color: COLOR.azul, negrita: true, titulos: true, ancho: UTIL - 80 });
      dentro.push({ imagen: encabezado.imagen, alto: encabezado.alto, separacion: 12 });
      for (const item of d.lista) {
        const b = await bloque({ texto: `•  ${item}`, tamano: 42, color: COLOR.grisTexto, ancho: UTIL - 80 });
        dentro.push({ imagen: b.imagen, alto: b.alto, separacion: 10 });
      }
    }
    const extra = d.lista?.length ? 28 : 0;
    const altoTarjeta = dentro.reduce((t, b) => t + b.alto + b.separacion, 0) + 72 + extra;
    poner(rect(UTIL, altoTarjeta, COLOR.blanco), MARGEN, y);
    let yy = y + 40;
    for (const [i, b] of dentro.entries()) {
      if (d.lista?.length && i === d.lineas.length) yy += 28; // aire antes de «Servicios»
      poner(b.imagen, MARGEN + 40, yy);
      yy += b.alto + b.separacion;
    }
    y += altoTarjeta + 36;
  }

  const llamado = await bloque({ texto: d.llamado, tamano: d.foto ? 34 : 40, color: COLOR.azul, negrita: true });
  const yLlamado = Math.min(y + 8, ALTO - PIE - llamado.alto - 28);
  poner(llamado.imagen, MARGEN, yLlamado);
  // Sin foto queda espacio libre: se llena con huellas y un corazón, detrás de nada.
  const libre = ALTO - PIE - (yLlamado + llamado.alto + 24);
  if (!d.foto && libre > 120) poner(rastro(ANCHO, libre), 0, yLlamado + llamado.alto + 24);

  // Pie: dónde informarse, con huellas decorativas.
  poner(rect(ANCHO, PIE, COLOR.azul), 0, ALTO - PIE);
  poner(huellasPie(), ANCHO - 300, ALTO - PIE);
  // Texto a la izquierda de las huellas; la dirección del portal va en una línea más chica.
  const anchoPie = ANCHO - 300 - MARGEN;
  const pie = await bloque({ texto: "Más información en el portal municipal", tamano: 30, color: COLOR.blanco, negrita: true, ancho: anchoPie });
  const direccion = d.portal ? await bloque({ texto: d.portal, tamano: d.portal.length > 40 ? 22 : 26, color: COLOR.blanco, ancho: anchoPie }) : null;
  const altoPie = pie.alto + (direccion ? direccion.alto + 4 : 0);
  const yPie = ALTO - PIE + (PIE - altoPie) / 2;
  poner(pie.imagen, MARGEN, yPie);
  if (direccion) poner(direccion.imagen, MARGEN, yPie + pie.alto + 4);

  return sharp({ create: { width: ANCHO, height: ALTO, channels: 3, background: COLOR.marfil } })
    .composite(capas)
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
