# Proyecto Municipalidades

Sitio web para la Ilustre Municipalidad de Hualañé, desarrollado por un equipo de 4 personas (Kabeli). Cada integrante es dueño de uno o más **módulos**: cada módulo es una pestaña del sitio, construida como paquete React independiente en `modulos/`. El **sitio** (`sitio/`) los reúne: página de inicio con una tarjeta por módulo + navbar con un enlace a cada uno.

## Estructura

```
sitio/                App anfitriona: router, header/navbar, inicio, 404. Registro de módulos en sitio/src/modulos.ts
modulos/
  cv-empleabilidad/   "Revisa tu CV" (responsable: Benjamín Alarcón) → ver su CLAUDE.md
design-system/        Design system Hualañé: tokens, componentes React, logos y guías (GUIA.md). Compartido: no editar sin acuerdo del equipo
plantillas/modulo/    Plantilla que usa `npm run nuevo-modulo` (no es un workspace; no se compila)
scripts/              nuevo-modulo.mjs
netlify/functions/    Endpoints /api/* (wrappers delgados; la lógica vive en modulos/<nombre>/server/)
docs/                 Arquitectura (arquitectura.md) y despliegue/secretos (despliegue.md)
.claude/              Configuración compartida de Claude Code (agentes, skills, permisos)
```

Monorepo con **npm workspaces** (`design-system`, `sitio`, `modulos/*`). Node ≥ 22 (`.nvmrc` = 24). Si `node` no existe en el shell: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.

Cada módulo tiene su propio `CLAUDE.md`: léelo antes de trabajar en él.

## Comandos (desde la raíz)

- `npm install`: instala y enlaza todos los workspaces
- `npm run dev`: sitio completo en http://localhost:5173
- `npm run dev -w @muni/<modulo>`: un módulo aislado (cada uno tiene puerto propio, desde 5174)
- `npm run nuevo-modulo -- <nombre> "<Etiqueta>" "<Responsable>" ["<Descripción>"]`: crea y registra un módulo
- `npm run check`: typecheck + lint + tests de todo. **Ejecutarlo antes de dar una tarea por terminada.**

## Reglas para todos los módulos

1. **Alcance**: trabaja solo dentro del módulo de la tarea. No modifiques `design-system/`, `sitio/` (salvo la línea del propio módulo en `sitio/src/modulos.ts`) ni módulos de otras personas sin pedirlo explícitamente.
2. **Contrato de módulo** ([docs/arquitectura.md](docs/arquitectura.md)): `src/index.ts` exporta `<Nombre>Tab` (sin props obligatorias) y `<nombre>TabMeta = { id, label, path, descripcion }`. Sin router propio, sin estilos globales (CSS Modules), sin asumir nada del anfitrión salvo el design system.
3. **Design system** ([design-system/GUIA.md](design-system/GUIA.md)): usa los componentes de `@muni/design-system` (`Button`, `Alert`, `Badge`, `Tabs`, `Icon`, `Logo`…) antes de crear los tuyos, y en CSS solo sus tokens (`--color-*`, `--space-*`, `--radius-*`, `--type-*`). Amarillo **nunca** como texto sobre blanco. Radios 6/12/20/28; cards con borde 1px y sin sombra en reposo; **nunca borde izquierdo de color como acento**. Cuerpo 18px. Íconos Lucide registrados en `design-system/components/core/icons.js`. Para revisar UI usa el subagente `revisor-design-system`.
4. **Voz** (GUIA.md, *Content fundamentals*): español de Chile, trato de **tú** (nunca "usted"), la Municipalidad habla en primera persona plural ("Te avisamos"). Botones con verbo + objeto ("Descargar PDF"). Frases de ≤ 20 palabras, sentence case, sin emoji, siglas explicadas. Errores que dicen qué pasó y cómo arreglarlo, sin culpar. "tod@s" solo en la marca; en textos, "vecinas y vecinos" o formas neutras. Sin atribuir acciones a autoridades.
5. **Accesibilidad**: WCAG 2.1 AA. Controles con nombre accesible, foco visible, `aria-live` para estados asíncronos, objetivos táctiles ≥ 48px, `prefers-reduced-motion`.
9. **Móvil primero**: todo debe funcionar a 390px de ancho sin scroll horizontal. Botones principales a todo el ancho en pantallas angostas.
6. **Secretos** (prioridad máxima; el repo es **público**): ninguna API key, contraseña ni endpoint privado en código, commits, `netlify.toml`, issues, PRs ni logs. Viven solo en las variables de entorno de Netlify y en `.env` local (en `.gitignore`). Los agentes **no leen ni imprimen `.env`**, no piden claves al usuario y usan valores ficticios en tests. Variables nuevas se documentan con placeholders en `.env.example`. Ver [docs/despliegue.md](docs/despliegue.md).
7. **Datos personales**: datos de ciudadanos (CVs, etc.) no se guardan ni se registran en logs. Solo datos ficticios en tests y fixtures.
8. TypeScript estricto, sin `any`. Tests con Vitest + Testing Library junto al archivo (`*.test.ts(x)`).

## Git

- Repo público: https://github.com/KABELI-LAB/proyecto-municipalidades. Rama principal `main`, cambios vía Pull Request. Despliegue automático en Netlify desde `main`.
- Ramas `<modulo>/<descripcion>` (ej. `cv/integracion-ia`). Commits en español, imperativo, con prefijo de módulo: `cv: agrega filtro de sugerencias`.
- Guía para el equipo: [CONTRIBUTING.md](CONTRIBUTING.md).

## Referencias

- Design system: [design-system/GUIA.md](design-system/GUIA.md) (marca, voz, color, forma) y [design-system/README.md](design-system/README.md) (uso en código). Skill de proyecto: `hualane-design`.
- Origen: proyecto "Hualañé Design System" de Claude Design. Reemplaza al deck preliminar anterior (paleta Muni Hualañé de octubre 2026). El nivel C (marca digital) es una propuesta pendiente de validar con la Municipalidad.
