# Arquitectura

## Modelo: un módulo por pestaña

```
        ┌─────────────────────────────────────────────┐
        │  sitio/  (@muni/sitio)                      │
        │  BrowserRouter · Header + navbar · Inicio   │
        │  importa design-system/base.css una vez     │
        │                                             │
        │  src/modulos.ts  →  MODULOS = [             │
        │    { meta: cvTabMeta, Component: CvTab },   │
        │    { meta: xTabMeta,  Component: XTab },    │
        │  ]                                          │
        └──────────┬──────────────────┬───────────────┘
                   │                  │
     modulos/cv-empleabilidad/   modulos/x/      (cada uno = workspace @muni/<nombre>)
```

A partir de `MODULOS`, el sitio genera automáticamente:

- un enlace en el **navbar** (`meta.label`, en el orden del arreglo),
- una **tarjeta** en el inicio (`meta.label` + `meta.descripcion`),
- una **ruta** (`meta.path`) que renderiza `Component`.

## Contrato de un módulo

Cada módulo es un workspace npm `@muni/<nombre>` en `modulos/<nombre>/` que:

1. **Exporta** desde `src/index.ts`:
   - `<Nombre>Tab`: componente React sin props obligatorias, que aporta el `<h1>` de su página (el sitio no agrega otro),
   - `<nombre>TabMeta = { id, label, path, descripcion }` (`path` absoluto y único),
   - sus tipos públicos, si los tiene.
2. **Se distribuye como código fuente** (`"exports": { ".": "./src/index.ts" }`): el sitio lo compila con Vite. No hay build de librería.
3. **No incluye** router, estado global, `base.css` ni estilos globales (salvo casos justificados y prefijados, como `cv-print-*`).
4. **Tiene su propio dev server** (`src/dev/main.tsx`, puerto propio) para desarrollar de forma aislada.
5. **Recibe dependencias externas por props opcionales** (ej. `analyzer` en `CvTab`), así el sitio puede configurar backends.

Rutas internas dentro de un módulo: por ahora no se usan. Si un módulo las necesita, se acordará usar rutas anidadas (`path/*`) en el sitio.

## Crear un módulo

`npm run nuevo-modulo -- <nombre> "<Etiqueta>" "<Responsable>" ["<Descripción>"]`

El script (`scripts/nuevo-modulo.mjs`) copia `plantillas/modulo/`, reemplaza los marcadores (`__NOMBRE__`, `__Nombre__`, `__LABEL__`, etc.), inserta el módulo en `sitio/src/modulos.ts` (entre los comentarios `<nuevo-modulo:...>`) y agrega la dependencia en `sitio/package.json`. Después hay que ejecutar `npm install`.

Si cambias la estructura común de los módulos, actualiza también `plantillas/modulo/`.

## Design system

`design-system/` es el paquete `@muni/design-system`:

- `GUIA.md`: marca, voz, color, tipografía, forma e íconos (la referencia para diseñar)
- `index.js`: componentes React (`import { Button, Alert, Icon } from '@muni/design-system'`)
- `tokens.css`: variables (`--color-*`, `--space-*`, `--radius-*`, `--type-*`…), fuentes y clases `.hds-*`. Los módulos usan **solo** estos tokens.
- `base.css`: reset y tipografía base. Lo importan **solo** el sitio y los dev servers de cada módulo.

Los cambios al design system se acuerdan en equipo. Ver en `design-system/README.md` las adaptaciones hechas sobre el export de Claude Design.

## Backend / IA

Ningún módulo llama directamente a APIs de IA desde el navegador. Cada integración define un contrato HTTP en `modulos/<nombre>/docs/` y un cliente en `src/services/`. Mientras el backend no exista, el módulo funciona con un mock que respeta el mismo contrato.
