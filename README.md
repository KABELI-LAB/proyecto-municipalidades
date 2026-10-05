# Proyecto Municipalidades

Sitio web para la Ilustre Municipalidad de Hualañé. Monorepo con un módulo React por pestaña y un design system compartido.

| Carpeta | Contenido |
|---|---|
| [`design-system/`](design-system/) | Tokens, fuentes y estilos base de Muni Hualañé |
| [`cv-empleabilidad/`](cv-empleabilidad/) | Pestaña "Revisa tu CV": feedback y 3 diseños de CV |
| [`docs/`](docs/) | Arquitectura y convenciones |

## Empezar

```bash
nvm use            # Node 24
npm install
npm run dev:cv     # http://localhost:5173
npm run check      # typecheck + lint + tests
```

Para trabajar con Claude Code, lee [CLAUDE.md](CLAUDE.md): define las reglas que siguen los agentes.
