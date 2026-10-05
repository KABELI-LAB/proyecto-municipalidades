# Proyecto Municipalidades

Sitio web para la Ilustre Municipalidad de Hualañé, desarrollado por un equipo de 4 personas (Kabeli). Cada integrante es dueño de uno o más **módulos**: cada módulo es una pestaña del sitio, construida como paquete React independiente que después se monta en una app anfitriona común (todavía no existe).

## Estructura

```
design-system/        Tokens CSS, fuentes y tokens.json de Muni Hualañé (compartido, no editar sin acuerdo del equipo)
cv-empleabilidad/     Módulo "Revisa tu CV" (dueño: Benjamín Alarcón) → ver cv-empleabilidad/CLAUDE.md
docs/                 Arquitectura y convenciones transversales
.claude/              Configuración compartida de Claude Code (agentes, skills, permisos)
```

Monorepo con **npm workspaces**. Node ≥ 22 (`.nvmrc` = 24). Si `node` no existe en el shell, cargar nvm primero: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.

## Comandos (desde la raíz)

- `npm install`: instala todos los workspaces
- `npm run dev:cv`: dev server del módulo CV en http://localhost:5173
- `npm run check`: typecheck + lint + tests de todos los workspaces. **Ejecutarlo antes de dar una tarea por terminada.**
- `npm test -w cv-empleabilidad`: tests de un solo workspace

## Reglas para todos los módulos

1. **Alcance**: trabaja solo dentro del módulo de la tarea. No modifiques `design-system/` ni módulos de otras personas sin pedirlo explícitamente.
2. **Contrato de módulo** (ver [docs/arquitectura.md](docs/arquitectura.md)): cada módulo exporta desde `src/index.ts` un componente React autocontenido + metadatos de pestaña. Sin router propio, sin estilos globales (CSS Modules), sin asumir nada del anfitrión salvo las variables `--muni-*`.
3. **Design system**: solo colores, fuentes, espaciados y radios de `design-system/tokens.css`. Respeta las reglas de contraste: **nunca texto blanco sobre celeste (#6BA8B8) ni amarillo (#E5B84B)**; blanco sobre terracota solo en texto grande/negrita. Esquinas casi rectas (3–4px).
4. **Tono** (manual institucional): español de Chile, trato de **usted**, frases breves, directo, respetuoso y útil. Sin mayúsculas sostenidas, sin signos repetidos (¡¡!!), sin atribuir acciones a autoridades.
5. **Accesibilidad**: WCAG 2.1 AA. Controles con nombre accesible, foco visible, `aria-live` para estados asíncronos, objetivos táctiles ≥ 44px, `prefers-reduced-motion`.
6. **Secretos**: ninguna API key en el frontend ni en git. Las llamadas a IA pasan por un backend. `.env` está en `.gitignore`.
7. **Datos personales**: los CVs y otros datos de ciudadanos no se guardan ni se registran en logs. No uses datos reales en tests ni fixtures.
8. TypeScript estricto, sin `any`. Tests con Vitest + Testing Library junto al archivo (`*.test.ts(x)`).

## Git

- Rama principal `main`. Trabajo en ramas `<modulo>/<descripcion>` (ej. `cv/integracion-ia`).
- Commits en español, imperativo, con prefijo de módulo: `cv: agrega filtro de sugerencias`.
- Aún no hay remoto configurado.

## Referencias

- Design system (deck): https://claude.ai/artifact/TxpyLvmaGCim3LSdBo61LF
- Fuente original: *Manual de Imagen Corporativa, I. Municipalidad de Hualañé, borrador octubre 2026*. La paleta es **preliminar**, pendiente de aprobación.
