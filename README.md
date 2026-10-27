# Proyecto Municipalidades

Sitio web para la Ilustre Municipalidad de Hualañé, desarrollado por Kabeli. Es un monorepo en React + Vite: un **sitio** con inicio y navbar, y un **módulo** por sección, cada uno a cargo de una persona del equipo. Se publica en Netlify.

## Secciones

| Módulo | Ruta | Qué hace | Responsable |
|---|---|---|---|
| [`cv-empleabilidad`](modulos/cv-empleabilidad/) | `/empleabilidad/cv` | "Revisa tu CV": feedback y 3 diseños de CV en PDF y Word | Benjamín Alarcón |
| [`registro-emergencia`](modulos/registro-emergencia/) | `/emergencia` | Inscripción de hogares para emergencias y Tarjeta Hogar Preparado con QR | Benjamín Alarcón |

Cada módulo tiene su propio `CLAUDE.md` con su estado, arquitectura y convenciones.

## Estructura

| Carpeta | Contenido |
|---|---|
| [`sitio/`](sitio/) | Inicio, navbar y rutas; reúne todos los módulos |
| [`modulos/`](modulos/) | Una carpeta por sección (paquete `@muni/<nombre>`) |
| [`design-system/`](design-system/) | Design system Hualañé: tokens, componentes React, logos y [guía de marca](design-system/GUIA.md) |
| [`netlify/functions/`](netlify/functions/) | Endpoints `/api/*` (la lógica vive en `modulos/<nombre>/server/`) |
| [`plantillas/modulo/`](plantillas/modulo/) y [`scripts/`](scripts/) | Plantilla y script para crear un módulo nuevo |
| [`docs/`](docs/) | [Arquitectura](docs/arquitectura.md) y [despliegue y secretos](docs/despliegue.md) |

## Empezar

```bash
nvm use                 # Node 24
npm install
npm run dev             # sitio completo en http://localhost:5173
npm run check           # typecheck + lint + tests (debe pasar antes de un PR)
```

Para trabajar en un solo módulo: `npm run dev:cv` o `npm run dev:emergencia`.

### Variables de entorno

Copia `.env.example` como `.env` y completa solo lo que necesites. Sin `.env` todo funciona en **modo demostración**: el CV usa un analizador simulado y el registro de emergencia usa datos ficticios en memoria. El detalle de cada variable está en [docs/despliegue.md](docs/despliegue.md).

**Nunca subas `.env` ni pegues claves** en el código, commits, PRs o chats (incluidos los chats con IA). El repositorio es público.

## Servicios externos

| Servicio | Para qué | Quién lo usa |
|---|---|---|
| Netlify | Hosting del sitio y funciones `/api/*` | Todo el sitio |
| Azure AI Foundry | Análisis de CV con IA | `cv-empleabilidad` |
| SMTP (Gmail / Workspace) | Envío del CV por correo | `cv-empleabilidad` |
| Supabase (Postgres) | Hogares inscritos, en un esquema privado al que solo accede el servidor | `registro-emergencia` |

## Colaborar

- **¿Vas a agregar tu sección?** Sigue [CONTRIBUTING.md](CONTRIBUTING.md).
- Ramas `<modulo>/<descripcion>` y commits en español con prefijo de módulo (`cv: agrega filtro`). Los cambios entran a `main` por Pull Request.
- Para trabajar con agentes de IA (Claude Code), las reglas del proyecto están en [CLAUDE.md](CLAUDE.md).
