# Proyecto Municipalidades

Sitio web para la Ilustre Municipalidad de Hualañé. Monorepo en React + Vite: un **sitio** con inicio y navbar, y un **módulo** por sección, cada uno desarrollado por una persona del equipo.

| Carpeta | Contenido |
|---|---|
| [`sitio/`](sitio/) | Inicio, navbar y rutas; reúne todos los módulos |
| [`modulos/cv-empleabilidad/`](modulos/cv-empleabilidad/) | "Revisa tu CV": feedback y 3 diseños de CV |
| [`design-system/`](design-system/) | Tokens, fuentes y estilos base de Muni Hualañé |
| [`docs/`](docs/) | Arquitectura y convenciones |

## Empezar

```bash
nvm use            # Node 24
npm install
npm run dev        # sitio completo en http://localhost:5173
npm run check      # typecheck + lint + tests
```

**¿Vas a agregar tu sección?** Sigue [CONTRIBUTING.md](CONTRIBUTING.md).

Para trabajar con agentes de IA (Claude Code), las reglas del proyecto están en [CLAUDE.md](CLAUDE.md).
