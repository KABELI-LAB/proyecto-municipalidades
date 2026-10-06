# Proyecto Municipalidades

Sitio web para la Ilustre Municipalidad de Hualañé, desarrollado por un equipo de 4 personas (Kabeli). Cada integrante es dueño de uno o más **módulos**: cada módulo es una pestaña del sitio, construida como paquete React independiente en `modulos/`. El **sitio** (`sitio/`) los reúne: página de inicio con una tarjeta por módulo + navbar con un enlace a cada uno.

## Estructura

```
sitio/                App anfitriona: router, header/navbar, inicio, 404. Registro de módulos en sitio/src/modulos.ts
modulos/
  cv-empleabilidad/   "Revisa tu CV" (responsable: Benjamín Alarcón) → ver su CLAUDE.md
design-system/        Tokens CSS, fuentes y tokens.json de Muni Hualañé (compartido: no editar sin acuerdo del equipo)
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
2. **Contrato de módulo** ([docs/arquitectura.md](docs/arquitectura.md)): `src/index.ts` exporta `<Nombre>Tab` (sin props obligatorias) y `<nombre>TabMeta = { id, label, path, descripcion }`. Sin router propio, sin estilos globales (CSS Modules), sin asumir nada del anfitrión salvo las variables `--muni-*`.
3. **Design system**: solo colores, fuentes, espaciados y radios de `design-system/tokens.css`. Contraste: **nunca texto blanco sobre celeste (#6BA8B8) ni amarillo (#E5B84B)**; blanco sobre terracota solo en texto grande o negrita. Esquinas casi rectas (3–4px). Para revisar UI usa el subagente `revisor-design-system`.
4. **Tono** (manual institucional): español de Chile, trato de **usted**, frases breves, directo, respetuoso y útil. Sin mayúsculas sostenidas, sin signos repetidos (¡¡!!), sin atribuir acciones a autoridades. Lenguaje inclusivo neutro ("le damos la bienvenida", no "bienvenido").
5. **Accesibilidad**: WCAG 2.1 AA. Controles con nombre accesible, foco visible, `aria-live` para estados asíncronos, objetivos táctiles ≥ 44px, `prefers-reduced-motion`.
6. **Secretos** (prioridad máxima; el repo es **público**): ninguna API key, contraseña ni endpoint privado en código, commits, `netlify.toml`, issues, PRs ni logs. Viven solo en las variables de entorno de Netlify y en `.env` local (en `.gitignore`). Los agentes **no leen ni imprimen `.env`**, no piden claves al usuario y usan valores ficticios en tests. Variables nuevas se documentan con placeholders en `.env.example`. Ver [docs/despliegue.md](docs/despliegue.md).
7. **Datos personales**: datos de ciudadanos (CVs, etc.) no se guardan ni se registran en logs. Solo datos ficticios en tests y fixtures.
8. TypeScript estricto, sin `any`. Tests con Vitest + Testing Library junto al archivo (`*.test.ts(x)`).

## Git

- Repo público: https://github.com/KABELI-LAB/proyecto-municipalidades. Rama principal `main`, cambios vía Pull Request. Despliegue automático en Netlify desde `main`.
- Ramas `<modulo>/<descripcion>` (ej. `cv/integracion-ia`). Commits en español, imperativo, con prefijo de módulo: `cv: agrega filtro de sugerencias`.
- Guía para el equipo: [CONTRIBUTING.md](CONTRIBUTING.md).

## Referencias

- Design system (deck): https://claude.ai/artifact/TxpyLvmaGCim3LSdBo61LF
- Fuente: *Manual de Imagen Corporativa, I. Municipalidad de Hualañé, borrador octubre 2026*. Paleta **preliminar**, pendiente de aprobación.
