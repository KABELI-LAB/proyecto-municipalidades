// Pieza gráfica para Instagram (1080 × 1350, formato 4:5, JPEG): identidad
// municipal (escudo y nombre oficial sobre blanco, desde la ruta que define
// la configuración del municipio), tipografía, colores y Cauce del sistema
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

// Colores de design-system/tokens/colors.css.
const COLOR = {
  azul: "#253786", // blue-700, primario
  azulInfo: "#1A58A0", // blue-600
  azulOscuro: "#162253", // blue-900, pie
  azulSuave: "#D9E4F5", // blue-100
  verde: "#316B2C", // green-700
  verdeSuave: "#D7EFD5", // green-100
  amarilloSuave: "#FEF4BF", // yellow-100
  rojo: "#C42B2B", // error
  texto: "#0E121B", // neutral-950
  fondo: "#F6F7F9", // neutral-50
  borde: "#DCDFE6", // neutral-200
  blanco: "#FFFFFF",
} as const;

// Pango no lee woff2: Atkinson Hyperlegible Next como TTF (vea fuentes/LEAME.md).
const FUENTES = path.join(process.cwd(), "src", "servidor", "redes", "fuentes");
const FUENTE = {
  texto: { familia: "Atkinson Hyperlegible Next", archivo: path.join(FUENTES, "AtkinsonHyperlegibleNext-Regular.ttf") },
  negrita: { familia: "Atkinson Hyperlegible Next Bold", archivo: path.join(FUENTES, "AtkinsonHyperlegibleNext-Bold.ttf") },
};

/** Distintivo de cada tipo: texto y color (texto blanco, grande y en negrita). */
const DISTINTIVO: Record<TipoRed, { texto: string; color: string }> = {
  OPERATIVO: { texto: "Operativo de tenencia responsable", color: COLOR.azul },
  ADOPCION: { texto: "En adopción", color: COLOR.verde },
  PERDIDA: { texto: "Se busca", color: COLOR.rojo },
  AVISTADA: { texto: "Mascota avistada", color: COLOR.azulInfo },
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

type Texto = { texto: string; tamano: number; color: string; negrita?: boolean; ancho?: number };

/** Bloque de texto con salto de línea por palabras, en la fuente local del sistema de diseño. */
async function bloque({ texto, tamano, color, negrita = false, ancho = UTIL }: Texto) {
  const fuente = negrita ? FUENTE.negrita : FUENTE.texto;
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

const rect = (ancho: number, alto: number, color: string, radio = 0, borde?: string) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect x="1" y="1" width="${ancho - 2}" height="${alto - 2}" rx="${radio}" fill="${color}"${borde ? ` stroke="${borde}" stroke-width="2"` : ""}/></svg>`,
  );

// Cauce: las tres ondas del escudo, forma propia del sistema (src/componentes/Cauce.tsx).
function cauce(ancho: number, alto: number, colores: string[], grosor: number, separacion: number) {
  const trazos = colores
    .map((c, i) => {
      const y = 120 + i * separacion;
      return `<path d="M-40 ${y + 150} C 260 ${y + 150}, 470 ${y + 20}, 760 ${y} S 1120 ${y - 14}, 1240 ${y - 14}" fill="none" stroke="${c}" stroke-width="${grosor}"/>`;
    })
    .join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 1200 400" preserveAspectRatio="none">${trazos}</svg>`);
}

/** Ruta del escudo según la configuración («/ds/…» apunta a design-system/assets/). */
function rutaEscudo() {
  const ruta = municipioActivo().identidad.escudo;
  return ruta.startsWith("/ds/") ? path.join(process.cwd(), "design-system", "assets", ruta.slice(4)) : path.join(process.cwd(), "public", ruta);
}

export async function generarPieza(d: DatosPieza): Promise<Buffer> {
  const municipio = municipioActivo();
  const capas: OverlayOptions[] = [];
  const poner = (input: Buffer, left: number, top: number) => capas.push({ input, left: Math.round(left), top: Math.round(top) });

  // Cabecera: escudo a color sobre blanco y el nombre oficial (nivel institucional).
  poner(rect(ANCHO, CABECERA, COLOR.blanco), 0, 0);
  const escudo = await sharp(await readFile(rutaEscudo())).resize({ height: 130, fit: "inside" }).png().toBuffer({ resolveWithObject: true });
  poner(escudo.data, MARGEN, (CABECERA - escudo.info.height) / 2);
  const firma = await bloque({ texto: municipio.firma.join("\n"), tamano: 38, color: COLOR.azul, negrita: true, ancho: UTIL - escudo.info.width - 32 });
  poner(firma.imagen, MARGEN + escudo.info.width + 32, (CABECERA - firma.alto) / 2);

  // Distintivo del tipo y, si corresponde, la marca de demostración.
  let y = CABECERA + 36;
  const distintivo = await bloque({ texto: DISTINTIVO[d.tipo].texto, tamano: 32, color: COLOR.blanco, negrita: true });
  poner(rect(distintivo.ancho + 40, distintivo.alto + 24, DISTINTIVO[d.tipo].color, 12), MARGEN, y);
  poner(distintivo.imagen, MARGEN + 20, y + 12);
  if (d.demo) {
    const demo = await bloque({ texto: "Datos de demostración", tamano: 26, color: COLOR.texto, negrita: true, ancho: 360 });
    poner(demo.imagen, ANCHO - MARGEN - demo.ancho, y + (distintivo.alto + 24 - demo.alto) / 2);
  }
  y += distintivo.alto + 24 + 32;

  if (d.foto) {
    // Foto: solo se recorta para encuadrar; no cambia colores ni rasgos.
    const alto = Math.max(460, 600 - 70 * Math.max(0, d.lineas.length - 2));
    // Esquinas de 20 px, como las fotos de las tarjetas del sistema.
    const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${UTIL}" height="${alto}"><rect width="${UTIL}" height="${alto}" rx="20"/></svg>`);
    const foto = await sharp(d.foto).rotate().resize({ width: UTIL, height: alto, fit: "cover", position: "attention" }).composite([{ input: mascara, blend: "dest-in" }]).png().toBuffer();
    poner(foto, MARGEN, y);
    y += alto + 32;
    const titulo = await bloque({ texto: d.titulo, tamano: 54, color: COLOR.azul, negrita: true });
    poner(titulo.imagen, MARGEN, y);
    y += titulo.alto + 20;
    for (const linea of d.lineas) {
      const b = await bloque({ texto: linea, tamano: 34, color: COLOR.texto });
      poner(b.imagen, MARGEN, y);
      y += b.alto + 8;
    }
  } else {
    const titulo = await bloque({ texto: d.titulo, tamano: 72, color: COLOR.azul, negrita: true });
    poner(titulo.imagen, MARGEN, y);
    y += titulo.alto + 36;
    // Tarjeta blanca con fecha, horario, lugar y servicios.
    const dentro: { imagen: Buffer; alto: number; separacion: number }[] = [];
    for (const [i, linea] of d.lineas.entries()) {
      const b = await bloque({ texto: linea, tamano: i === 0 ? 56 : 42, color: i === 0 ? COLOR.azul : COLOR.texto, negrita: i === 0, ancho: UTIL - 80 });
      dentro.push({ imagen: b.imagen, alto: b.alto, separacion: i === 0 ? 20 : 14 });
    }
    if (d.lista?.length) {
      const encabezado = await bloque({ texto: "Servicios", tamano: 40, color: COLOR.azul, negrita: true, ancho: UTIL - 80 });
      dentro.push({ imagen: encabezado.imagen, alto: encabezado.alto, separacion: 12 });
      for (const item of d.lista) {
        const b = await bloque({ texto: `•  ${item}`, tamano: 42, color: COLOR.texto, ancho: UTIL - 80 });
        dentro.push({ imagen: b.imagen, alto: b.alto, separacion: 10 });
      }
    }
    const extra = d.lista?.length ? 28 : 0;
    const altoTarjeta = dentro.reduce((t, b) => t + b.alto + b.separacion, 0) + 72 + extra;
    poner(rect(UTIL, altoTarjeta, COLOR.blanco, 20, COLOR.borde), MARGEN, y);
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
  // Sin foto queda espacio libre: se llena con el Cauce en tonos suaves, detrás de nada.
  const libre = ALTO - PIE - (yLlamado + llamado.alto + 24);
  if (!d.foto && libre > 120) poner(cauce(ANCHO, libre, [COLOR.azulSuave, COLOR.verdeSuave, COLOR.amarilloSuave], 26, 60), 0, yLlamado + llamado.alto + 24);

  // Pie azul con el Cauce: dónde informarse.
  poner(rect(ANCHO, PIE, COLOR.azulOscuro), 0, ALTO - PIE);
  poner(cauce(360, PIE, [COLOR.azulInfo, COLOR.azul, COLOR.verde], 22, 70), ANCHO - 360, ALTO - PIE);
  // Texto a la izquierda del Cauce; la dirección del portal va en una línea más chica.
  const anchoPie = ANCHO - 360 - MARGEN;
  const pie = await bloque({ texto: "Más información en el portal municipal", tamano: 30, color: COLOR.blanco, negrita: true, ancho: anchoPie });
  const direccion = d.portal ? await bloque({ texto: d.portal, tamano: d.portal.length > 40 ? 22 : 26, color: COLOR.blanco, ancho: anchoPie }) : null;
  const altoPie = pie.alto + (direccion ? direccion.alto + 4 : 0);
  const yPie = ALTO - PIE + (PIE - altoPie) / 2;
  poner(pie.imagen, MARGEN, yPie);
  if (direccion) poner(direccion.imagen, MARGEN, yPie + pie.alto + 4);

  return sharp({ create: { width: ANCHO, height: ALTO, channels: 3, background: COLOR.fondo } })
    .composite(capas)
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
