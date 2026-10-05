---
name: nuevo-modulo
description: Crea un módulo nuevo (una pestaña del sitio) en el monorepo, con la misma estructura y contrato que cv-empleabilidad. Úsalo cuando alguien del equipo pida empezar una nueva sección o pestaña.
---

# Crear un módulo nuevo

Argumento esperado: nombre del módulo en kebab-case (ej. `tramites`) y una descripción breve. Si falta, pregúntalo.

1. Lee `docs/arquitectura.md` y `cv-empleabilidad/CLAUDE.md` para entender el contrato.
2. Crea `<nombre>/` copiando de `cv-empleabilidad/` **solo la infraestructura**:
   `package.json` (nombre `@muni/<nombre>`, sin dependencias de negocio como pdfjs/mammoth), `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `index.html`, `src/dev/` (ajusta la pestaña activa), `src/test/setup.ts`.
3. Crea `src/index.ts` exportando `<Nombre>Tab` y `<nombre>TabMeta = { id, label, path }`.
4. Crea `src/<Nombre>Tab.tsx` mínimo con un encabezado al estilo de `CvTab` (eyebrow + h2 + texto) y `src/styles/ui.module.css` usando solo variables `--muni-*`.
5. Agrega un test de humo `src/<Nombre>Tab.test.tsx`.
6. Agrega el workspace a `package.json` raíz (`workspaces` y un script `dev:<nombre>` con un puerto distinto, `vite --port 51xx`).
7. Escribe `<nombre>/CLAUDE.md` siguiendo la forma de `cv-empleabilidad/CLAUDE.md` (estado, flujo, mapa de archivos, comandos, convenciones).
8. Actualiza la tabla de estructura en el `CLAUDE.md` raíz y en `README.md`.
9. Ejecuta `npm install` y `npm run check`. Reporta el resultado.
