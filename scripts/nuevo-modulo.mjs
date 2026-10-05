#!/usr/bin/env node
/**
 * Crea un módulo nuevo desde plantillas/modulo y lo registra en el sitio.
 *
 *   npm run nuevo-modulo -- <nombre-kebab> "<Etiqueta del navbar>" "<Responsable>" ["<Descripción>"]
 *   npm run nuevo-modulo -- tramites "Trámites en línea" "Ana Pérez" "Consulte y realice trámites municipales."
 */
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const [nombre, label, dueno, descripcion = `Sección ${label} del sitio municipal.`] = process.argv.slice(2)

function salir(msg) {
  console.error(`\n✖ ${msg}\n\nUso: npm run nuevo-modulo -- <nombre-kebab> "<Etiqueta>" "<Responsable>" ["<Descripción>"]\n`)
  process.exit(1)
}

if (!nombre || !label || !dueno) salir('Faltan argumentos.')
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(nombre)) salir(`"${nombre}" no es kebab-case (ej. "tramites-en-linea").`)

const destino = join(raiz, 'modulos', nombre)
if (existsSync(destino)) salir(`Ya existe modulos/${nombre}.`)

const registroPath = join(raiz, 'sitio/src/modulos.ts')
const registro = readFileSync(registroPath, 'utf8')
if (registro.includes(`path: '/${nombre}'`) || registro.includes(`'@muni/${nombre}'`)) salir(`El sitio ya registra "${nombre}".`)

const pascal = nombre.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')
const camel = pascal[0].toLowerCase() + pascal.slice(1)
const puerto = 5174 + readdirSync(join(raiz, 'modulos')).filter((d) => statSync(join(raiz, 'modulos', d)).isDirectory()).length
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const reemplazos = [
  ['__NOMBRE__', nombre],
  ['__Nombre__', pascal],
  ['__nombre__', camel],
  ['__LABEL__', label],
  ['__DUENO__', dueno],
  ['__DESCRIPCION__', descripcion],
  ['__PUERTO__', String(puerto)],
]
const aplicar = (texto, escapar = false) =>
  reemplazos.reduce((t, [k, v]) => t.replaceAll(k, escapar && ['__LABEL__', '__DESCRIPCION__'].includes(k) ? esc(v) : v), texto)

// 1. Copiar plantilla y reemplazar marcadores en contenido y nombres de archivo.
cpSync(join(raiz, 'plantillas/modulo'), destino, { recursive: true })
;(function recorrer(dir) {
  for (const entrada of readdirSync(dir)) {
    let ruta = join(dir, entrada)
    if (entrada.includes('__')) {
      const nueva = join(dir, aplicar(entrada))
      renameSync(ruta, nueva)
      ruta = nueva
    }
    if (statSync(ruta).isDirectory()) recorrer(ruta)
    else writeFileSync(ruta, aplicar(readFileSync(ruta, 'utf8'), /\.(ts|tsx)$/.test(ruta)))
  }
})(destino)

// 2. Registrar en el sitio (navbar + inicio + ruta).
const marcaImport = '// <nuevo-modulo:imports>'
const marcaRegistro = '  // <nuevo-modulo:registro>'
if (!registro.includes(marcaImport) || !registro.includes(marcaRegistro)) {
  salir('No encontré los marcadores <nuevo-modulo:...> en sitio/src/modulos.ts. Registre el módulo a mano.')
}
writeFileSync(
  registroPath,
  registro
    .replace(marcaImport, `import { ${pascal}Tab, ${camel}TabMeta } from '@muni/${nombre}'\n${marcaImport}`)
    .replace(marcaRegistro, `  { meta: ${camel}TabMeta, Component: ${pascal}Tab },\n${marcaRegistro}`),
)

// 3. Dependencia del sitio hacia el módulo.
const sitioPkgPath = join(raiz, 'sitio/package.json')
const sitioPkg = JSON.parse(readFileSync(sitioPkgPath, 'utf8'))
sitioPkg.dependencies[`@muni/${nombre}`] = '*'
sitioPkg.dependencies = Object.fromEntries(Object.entries(sitioPkg.dependencies).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(sitioPkgPath, JSON.stringify(sitioPkg, null, 2) + '\n')

console.log(`
✔ Módulo creado en modulos/${nombre} y registrado en el navbar como "${label}".

Siguientes pasos:
  1. npm install                 # enlaza el nuevo workspace
  2. npm run dev                 # sitio completo en http://localhost:5173
     npm run dev -w @muni/${nombre}   # solo su módulo en http://localhost:${puerto}
  3. Edite modulos/${nombre}/src/${pascal}Tab.tsx y modulos/${nombre}/CLAUDE.md
  4. npm run check antes de abrir el Pull Request
`)
