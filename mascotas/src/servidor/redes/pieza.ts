// Pieza gráfica para Instagram (1080 × 1350, formato 4:5, JPEG), según la
// plantilla «Social media system» del sistema de diseño
// (design-system/applications/social-system.html): fondo de la categoría,
// píldora de categoría con ícono, logotipo ciudadano arriba a la derecha,
// foto con el corte inclinado, título grande, datos con íconos, Cauce de tres
// colores y barra inferior con la dirección del portal. La foto del animal
// no se altera (solo se recorta para encuadrar). Se genera en el servidor con
// sharp; no usa servicios externos.
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ArrowRight, CalendarDays, Clock, Eye, Heart, MapPin, PawPrint, Search, Stethoscope, type LucideIcon } from "lucide-react";
import sharp, { type OverlayOptions } from "sharp";
import type { TipoRed } from "@/dominio/redes";
import { municipioActivo } from "@/lib/municipio";

export const ANCHO = 1080;
export const ALTO = 1350;
const MARGEN = 80;
const UTIL = ANCHO - 2 * MARGEN;
const ARRIBA = 72;
const ALTO_CAUCE = 150;
const ALTO_BARRA = 80;

// Colores de design-system/tokens/colors.css.
const C = {
  azul: "#253786", // blue-700
  azulNoche: "#0D1533", // blue-950
  verde: "#316B2C", // green-700
  verdeHoja: "#3AAA35", // green-500
  amarillo: "#FAC22F", // yellow-400
  rojo: "#C42B2B", // red-600
  texto: "#0E121B", // neutral-950
  blanco: "#FFFFFF",
} as const;

/**
 * Categorías de la plantilla aplicadas a cada tipo de publicación:
 * mascotas y adopción como «Comunidad» (fondo blanco con foto), operativos
 * como «Actividad» (amarillo).
 */
type Estilo = { etiqueta: string; icono: LucideIcon; fondo: string; tinta: string; pildora: string; tintaPildora: string; cauce: [string, string, string]; logo: "color" | "placa" };
const ESTILO: Record<TipoRed, Estilo> = {
  PERDIDA: { etiqueta: "Se busca", icono: Search, fondo: C.blanco, tinta: C.texto, pildora: C.rojo, tintaPildora: C.blanco, cauce: [C.azul, C.verdeHoja, C.amarillo], logo: "color" },
  AVISTADA: { etiqueta: "Mascota avistada", icono: Eye, fondo: C.blanco, tinta: C.texto, pildora: C.azul, tintaPildora: C.blanco, cauce: [C.azul, C.verdeHoja, C.amarillo], logo: "color" },
  ADOPCION: { etiqueta: "En adopción", icono: Heart, fondo: C.blanco, tinta: C.texto, pildora: C.verde, tintaPildora: C.blanco, cauce: [C.azul, C.verdeHoja, C.amarillo], logo: "color" },
  OPERATIVO: { etiqueta: "Operativo", icono: CalendarDays, fondo: C.amarillo, tinta: C.azulNoche, pildora: C.azul, tintaPildora: C.blanco, cauce: [C.azul, C.blanco, C.verdeHoja], logo: "placa" },
};

/** Íconos de los datos (set Lucide del sistema). */
const ICONOS = { fecha: CalendarDays, hora: Clock, lugar: MapPin, servicio: Stethoscope, animal: PawPrint, llamado: ArrowRight } satisfies Record<string, LucideIcon>;
export type IconoPieza = keyof typeof ICONOS;

export type DatosPieza = {
  tipo: TipoRed;
  /** Línea corta sobre el título (opcional). */
  antetitulo?: string;
  titulo: string;
  /** Datos con ícono, en orden; el último suele ser el llamado a participar. */
  detalles: { icono: IconoPieza; texto: string }[];
  foto: Buffer | null;
  /** Dirección pública del portal (sin protocolo), si existe. */
  portal: string | null;
  demo: boolean;
};

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Pango no lee woff2: Atkinson Hyperlegible Next como TTF (vea fuentes/LEAME.md).
const FUENTES = path.join(process.cwd(), "src", "servidor", "redes", "fuentes");
const FUENTE = {
  texto: { familia: "Atkinson Hyperlegible Next", archivo: path.join(FUENTES, "AtkinsonHyperlegibleNext-Regular.ttf") },
  negrita: { familia: "Atkinson Hyperlegible Next Bold", archivo: path.join(FUENTES, "AtkinsonHyperlegibleNext-Bold.ttf") },
};

type Texto = { texto: string; tamano: number; color: string; negrita?: boolean; ancho?: number; interlineado?: number; espaciado?: number; mayusculas?: boolean };

/** Una línea de texto sin cortes, en la tipografía del sistema. */
async function linea(t: string, { tamano, color, negrita = true, espaciado = 0 }: Omit<Texto, "texto">) {
  const fuente = negrita ? FUENTE.negrita : FUENTE.texto;
  // Pango mide el espaciado entre letras en milésimas de punto (a 72 ppp, 1 punto = 1 px).
  const letras = espaciado ? ` letter_spacing="${Math.round(espaciado * tamano * 1024)}"` : "";
  const { data, info } = await sharp({
    text: { text: `<span foreground="${color}"${letras}>${escapar(t)}</span>`, font: `${fuente.familia} ${tamano}`, fontfile: fuente.archivo, rgba: true },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { imagen: data, ancho: info.width, alto: info.height };
}

/**
 * Párrafo con corte por palabras y alto de línea controlado: Pango no permite
 * interlineados menores que el de la fuente, así que cada línea se dibuja
 * por separado y se apilan a `interlineado` × tamaño.
 */
async function bloque({ texto, tamano, color, negrita = true, ancho = UTIL, interlineado = 1.2, espaciado = 0, mayusculas = false }: Texto) {
  const opciones = { tamano, color, negrita, espaciado };
  const palabras = (mayusculas ? texto.toLocaleUpperCase("es-CL") : texto).split(/\s+/).filter(Boolean);
  const lineas: Awaited<ReturnType<typeof linea>>[] = [];
  let actual = "";
  let dibujo: Awaited<ReturnType<typeof linea>> | null = null;
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    const d = await linea(prueba, opciones);
    if (d.ancho > ancho && actual && dibujo) {
      lineas.push(dibujo);
      actual = palabra;
      dibujo = await linea(palabra, opciones);
    } else {
      actual = prueba;
      dibujo = d;
    }
  }
  if (dibujo) lineas.push(dibujo);
  if (lineas.length === 1) return lineas[0];
  const paso = Math.round(tamano * interlineado);
  const alto = paso * (lineas.length - 1) + lineas[lineas.length - 1].alto;
  const anchoTotal = Math.max(...lineas.map((l) => l.ancho));
  const imagen = await sharp({ create: { width: anchoTotal, height: alto, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(lineas.map((l, k) => ({ input: l.imagen, left: 0, top: k * paso })))
    .png()
    .toBuffer();
  return { imagen, ancho: anchoTotal, alto };
}

type NodoIcono = [string, Record<string, string>][];

/**
 * Trazos de un ícono Lucide. El componente de lucide-react guarda sus trazos
 * en la propiedad iconNode del elemento que devuelve; así se dibuja el mismo
 * ícono que en la web sin pasar por react-dom/server (que no corre en el servidor de Next).
 */
function trazos(Icono: LucideIcon): NodoIcono {
  const elemento = (Icono as unknown as { render: (p: object, r: null) => { props: { iconNode: NodoIcono } } }).render({}, null);
  return elemento.props.iconNode;
}

/** Ícono Lucide como imagen, con trazo de 2 px a 24 px (se escala con el tamaño). */
function icono(Icono: LucideIcon, tamano: number, color: string) {
  const hijos = trazos(Icono)
    .map(([etiqueta, atributos]) => `<${etiqueta} ${Object.entries(atributos).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ")}/>`)
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${hijos}</svg>`,
  );
}

const rect = (ancho: number, alto: number, color: string, radio = 0, opacidad = 1) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect width="${ancho}" height="${alto}" rx="${radio}" fill="${color}" fill-opacity="${opacidad}"/></svg>`);

/** Cauce: las tres ondas del escudo (src/componentes/Cauce.tsx), dibujadas a la medida. */
function cauce(ancho: number, alto: number, colores: readonly string[], grosor = 22, separacion = 70) {
  const x = (v: number) => ((v * ancho) / 1200).toFixed(1);
  const y = (v: number) => ((v * alto) / 400).toFixed(1);
  const trazos = colores
    .map((c, i) => {
      const b = 120 + i * separacion;
      return `<path d="M${x(-40)} ${y(b + 150)} C ${x(260)} ${y(b + 150)}, ${x(470)} ${y(b + 20)}, ${x(760)} ${y(b)} S ${x(1120)} ${y(b - 14)}, ${x(1240)} ${y(b - 14)}" fill="none" stroke="${c}" stroke-width="${grosor}"/>`;
    })
    .join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">${trazos}</svg>`);
}

/** Ruta de un archivo de identidad según la configuración («/ds/…» apunta a design-system/assets/). */
function rutaIdentidad(ruta: string) {
  return ruta.startsWith("/ds/") ? path.join(process.cwd(), "design-system", "assets", ruta.slice(4)) : path.join(process.cwd(), "public", ruta);
}

/** Logotipo ciudadano a color; sobre amarillo va en una placa blanca, como en la plantilla. */
async function logotipo(estilo: Estilo) {
  const alto = estilo.logo === "placa" ? 72 : 88;
  const logo = await sharp(await readFile(rutaIdentidad(municipioActivo().identidad.logoCiudadano)))
    .resize({ height: alto })
    .png()
    .toBuffer({ resolveWithObject: true });
  if (estilo.logo === "color") return { imagen: logo.data, ancho: logo.info.width, alto: logo.info.height };
  const [px, py] = [18, 14];
  const placa = await sharp(rect(logo.info.width + 2 * px, logo.info.height + 2 * py, C.blanco, 20))
    .composite([{ input: logo.data, left: px, top: py }])
    .png()
    .toBuffer();
  return { imagen: placa, ancho: logo.info.width + 2 * px, alto: logo.info.height + 2 * py };
}

export async function generarPieza(d: DatosPieza): Promise<Buffer> {
  const e = ESTILO[d.tipo];
  const capas: OverlayOptions[] = [];
  const poner = (input: Buffer, left: number, top: number) => capas.push({ input, left: Math.round(left), top: Math.round(top) });

  // 1. Píldora de categoría (ícono + mayúsculas con tracking) y logotipo.
  const etiqueta = await bloque({ texto: e.etiqueta, tamano: 30, color: e.tintaPildora, espaciado: 0.08, mayusculas: true, ancho: 600 });
  const altoPildora = 68;
  const anchoPildora = 28 + 36 + 16 + etiqueta.ancho + 28;
  poner(rect(anchoPildora, altoPildora, e.pildora, altoPildora / 2), MARGEN, ARRIBA);
  poner(icono(e.icono, 36, e.tintaPildora), MARGEN + 28, ARRIBA + (altoPildora - 36) / 2);
  poner(etiqueta.imagen, MARGEN + 28 + 36 + 16, ARRIBA + (altoPildora - etiqueta.alto) / 2);
  const logo = await logotipo(e);
  poner(logo.imagen, ANCHO - MARGEN - logo.ancho, ARRIBA + (altoPildora - logo.alto) / 2);
  const finCabecera = ARRIBA + Math.max(altoPildora, logo.alto);

  // 2. Texto: antetítulo, título grande y datos con ícono. Se arma primero
  //    para saber cuánto alto le queda a la foto.
  const conFoto = Boolean(d.foto);
  const tamanoTitulo = conFoto ? (d.titulo.length > 28 ? 76 : 88) : d.titulo.length > 28 ? 96 : 112;
  const antetitulo = d.antetitulo ? await bloque({ texto: d.antetitulo, tamano: 36, color: e.tinta, interlineado: 1.2 }) : null;
  const titulo = await bloque({ texto: d.titulo, tamano: tamanoTitulo, color: e.tinta, interlineado: 1.02, espaciado: -0.03 });
  const detalles = [];
  for (const x of d.detalles) {
    const b = await bloque({ texto: x.texto, tamano: 36, color: e.tinta, ancho: UTIL - 64, interlineado: 1.2 });
    detalles.push({ ...b, icono: ICONOS[x.icono] });
  }
  const separacion = 24;
  const altoTexto =
    (antetitulo ? antetitulo.alto + separacion : 0) + titulo.alto + (detalles.length ? 28 + detalles.reduce((t, b) => t + b.alto, 0) + 16 * (detalles.length - 1) : 0);

  const pie = ALTO - ALTO_CAUCE - ALTO_BARRA;
  let y: number;
  if (d.foto) {
    // 3. Foto con el corte inclinado del logotipo y esquinas de 40 px.
    const arribaFoto = finCabecera + 48;
    const altoFoto = Math.max(320, Math.min(500, pie - 32 - altoTexto - 40 - arribaFoto));
    const mascara = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${UTIL}" height="${altoFoto}"><clipPath id="c"><polygon points="0,${altoFoto * 0.07} ${UTIL},0 ${UTIL},${altoFoto} 0,${altoFoto}"/></clipPath><rect width="${UTIL}" height="${altoFoto}" rx="40" clip-path="url(#c)"/></svg>`,
    );
    const foto = await sharp(d.foto).rotate().resize({ width: UTIL, height: altoFoto, fit: "cover", position: "attention" }).composite([{ input: mascara, blend: "dest-in" }]).png().toBuffer();
    poner(foto, MARGEN, arribaFoto);
    y = arribaFoto + altoFoto + 40;
  } else {
    // Sin foto, el texto se centra en el espacio libre.
    y = finCabecera + Math.max(40, (pie - finCabecera - altoTexto) / 2);
  }

  if (antetitulo) {
    poner(antetitulo.imagen, MARGEN, y);
    y += antetitulo.alto + separacion;
  }
  poner(titulo.imagen, MARGEN, y);
  y += titulo.alto + 28;
  for (const b of detalles) {
    poner(icono(b.icono, 44, e.tinta), MARGEN, y + Math.max(0, (Math.min(b.alto, 52) - 44) / 2));
    poner(b.imagen, MARGEN + 64, y);
    y += b.alto + 16;
  }

  // 4. Cauce de tres colores y barra inferior con la dirección del portal.
  poner(cauce(ANCHO, ALTO_CAUCE, e.cauce), 0, ALTO - ALTO_BARRA - ALTO_CAUCE);
  // Barra en azul: el texto blanco nunca va sobre amarillo.
  poner(rect(ANCHO, ALTO_BARRA, C.azul), 0, ALTO - ALTO_BARRA);
  const izquierda = await bloque({ texto: d.portal ?? municipioActivo().sitioWeb, tamano: 28, color: C.blanco, ancho: 560 });
  poner(izquierda.imagen, MARGEN, ALTO - ALTO_BARRA + (ALTO_BARRA - izquierda.alto) / 2);
  const derecha = await bloque({ texto: d.demo ? "Datos de demostración" : municipioActivo().nombreOficial, tamano: 28, color: C.blanco, ancho: 520 });
  poner(derecha.imagen, ANCHO - MARGEN - derecha.ancho, ALTO - ALTO_BARRA + (ALTO_BARRA - derecha.alto) / 2);

  return sharp({ create: { width: ANCHO, height: ALTO, channels: 3, background: e.fondo } })
    .composite(capas)
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
