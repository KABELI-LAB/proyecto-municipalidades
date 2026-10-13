// Genera src/estilos/tokens.css desde design-system/tokens.json y copia
// fuentes y recursos gráficos a public/ds/. design-system/ es la fuente de
// verdad: no edite los archivos generados a mano.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origen = join(raiz, "design-system");
const destinoCss = join(raiz, "src", "estilos", "tokens.css");
const destinoPublico = join(raiz, "public", "ds");

const tokens = JSON.parse(readFileSync(join(origen, "tokens.json"), "utf8"));

// «Impresión» → «impresion»
const slug = (texto) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

const lineas = [];
const variable = (nombre, valor) => lineas.push(`  --${nombre}: ${valor};`);

lineas.push("  /* Color */");
for (const t of tokens.color.tokens) variable(t.name, t.value);

lineas.push("", "  /* Familias */");
for (const [nombre, valor] of Object.entries(tokens.type.families)) variable(`font-${nombre}`, valor);

for (const grupo of tokens.type.groups) {
  const prefijo = `tipo-${slug(grupo.name)}`;
  lineas.push("", `  /* Tipografía · ${grupo.name} */`);
  for (const estilo of grupo.styles) {
    const base = `${prefijo}-${estilo.name}`;
    variable(`${base}-familia`, `var(--font-${estilo.family ?? grupo.family})`);
    variable(`${base}-tamano`, estilo.fontSize);
    variable(`${base}-interlineado`, String(estilo.lineHeight));
    variable(`${base}-peso`, String(estilo.fontWeight));
    if (estilo.letterSpacing) variable(`${base}-espaciado`, estilo.letterSpacing);
  }
}

for (const grupo of ["spacing", "radius", "borde"]) {
  lineas.push("", `  /* ${grupo} */`);
  for (const t of tokens[grupo].tokens) variable(t.name, t.value);
}

const fuentes = tokens.type.fonts
  .map(
    (f) => `@font-face {
  font-family: "${f.family}";
  src: url("/ds/${f.file}") format("woff2");
  font-weight: ${f.weight};
  font-style: ${f.style};
  font-display: swap;
}`,
  )
  .join("\n\n");

const css = `/* Generado por scripts/sincronizar-diseno.mjs desde design-system/tokens.json (${tokens.name}, v${tokens.version}). No editar. */

${fuentes}

:root {
${lineas.join("\n")}
}
`;

mkdirSync(dirname(destinoCss), { recursive: true });
writeFileSync(destinoCss, css);

rmSync(destinoPublico, { recursive: true, force: true });
for (const carpeta of ["fonts", "assets"]) {
  cpSync(join(origen, carpeta), join(destinoPublico, carpeta), {
    recursive: true,
    filter: (ruta) => !ruta.endsWith(".md"),
  });
}

console.log(`Tokens → ${destinoCss}\nFuentes y recursos → ${destinoPublico}`);
