// Genera src/estilos/tokens.css desde los tokens del sistema de diseño
// (design-system/tokens/*.css) y copia los logos a public/ds/. También copia
// las fotos de la demo (demo/fotos/, en WebP) a public/fotos/, para que se
// entreguen como archivos estáticos desde la red de Netlify y no por una función.
// design-system/ y demo/fotos/ son la fuente de verdad: no edite los
// archivos generados a mano.
// Las fuentes (Atkinson Hyperlegible Next y Mono) las sirve next/font desde
// el propio sitio: ver src/app/layout.tsx.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origen = join(raiz, "design-system");
const destinoCss = join(raiz, "src", "estilos", "tokens.css");
const destinoPublico = join(raiz, "public", "ds");

// Colores, tipografía, espaciado y efectos (radios, sombras, movimiento).
// Se omiten fonts.css (carga desde Google) y themes.css (temas oscuro y de
// alto contraste, aún no usados).
const ARCHIVOS = ["colors.css", "typography.css", "spacing.css", "effects.css"];
const partes = ARCHIVOS.map((a) => `/* ── ${a} ── */\n${readFileSync(join(origen, "tokens", a), "utf8").trim()}`);
// Temas de demostración de otros municipios (design-system/temas/<id>/tema.css):
// solo actúan con <html data-tema="<id>">.
const origenTemas = join(origen, "temas");
const temas = readdirSync(origenTemas, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
for (const t of temas) partes.push(`/* ── temas/${t}/tema.css ── */\n${readFileSync(join(origenTemas, t, "tema.css"), "utf8").trim()}`);

const css = `/* Generado por scripts/sincronizar-diseno.mjs desde design-system/tokens/. No editar. */

${partes.join("\n\n")}
`;

mkdirSync(dirname(destinoCss), { recursive: true });
writeFileSync(destinoCss, css);

rmSync(destinoPublico, { recursive: true, force: true });
// Los logos originales son grandes (hasta 3000 px): se publican a 240 px de
// alto, suficiente para pantallas de alta densidad, y el SVG tal cual.
const logosOrigen = join(origen, "assets", "logo");
mkdirSync(join(destinoPublico, "logo"), { recursive: true });
for (const archivo of readdirSync(logosOrigen)) {
  const de = join(logosOrigen, archivo);
  const a = join(destinoPublico, "logo", archivo);
  if (archivo.endsWith(".png")) await sharp(de).resize({ height: 240, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true }).toFile(a);
  else cpSync(de, a);
}

for (const t of temas) {
  const a = join(destinoPublico, "temas", t);
  mkdirSync(a, { recursive: true });
  for (const archivo of readdirSync(join(origenTemas, t)).filter((f) => /\.(png|svg|webp)$/.test(f))) cpSync(join(origenTemas, t, archivo), join(a, archivo));
}

// Municipios configurados, para src/proxy.ts (que no lee archivos al responder).
const municipios = readdirSync(join(raiz, "config", "municipios")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
const predeterminado = process.env.MUNICIPIO ?? readFileSync(join(raiz, ".env"), "utf8").match(/^MUNICIPIO=["']?([a-z0-9-]+)/m)?.[1];
if (!predeterminado || !municipios.includes(predeterminado)) throw new Error("Falta la variable MUNICIPIO o no tiene configuración en config/municipios/.");
mkdirSync(join(raiz, "src", "generated"), { recursive: true });
writeFileSync(join(raiz, "src", "generated", "municipios.json"), JSON.stringify({ ids: municipios, predeterminado }, null, 2));

const fotosOrigen = join(raiz, "demo", "fotos");
const fotosDestino = join(raiz, "public", "fotos");
rmSync(fotosDestino, { recursive: true, force: true });
cpSync(fotosOrigen, fotosDestino, { recursive: true, filter: (ruta) => !/\.(md|txt|json)$/.test(ruta) });

console.log(`Tokens → ${destinoCss}\nLogos → ${destinoPublico}\nFotos de la demo → ${fotosDestino}`);
