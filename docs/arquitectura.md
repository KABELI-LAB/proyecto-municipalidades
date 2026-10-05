# Arquitectura

## Modelo: un módulo por pestaña

```
                ┌──────────────────────────────┐
                │  App anfitriona (futura)     │  router, header, footer,
                │  importa design-system/      │  base.css, layout
                │  base.css una sola vez       │
                └──────┬───────────┬───────────┘
                       │           │
          import { CvTab, cvTabMeta }   import { XTab, xTabMeta }
                       │           │
             cv-empleabilidad/    otro-modulo/
```

Cada módulo es un workspace npm (`@muni/<nombre>`) que:

1. **Exporta** desde `src/index.ts`:
   - un componente React sin props obligatorias (`<CvTab />`),
   - metadatos `{ id, label, path }` para que el anfitrión registre la pestaña,
   - los tipos públicos.
2. **Se distribuye como código fuente** (`"exports": { ".": "./src/index.ts" }`): la app anfitriona, también hecha con Vite, lo compila. No hay paso de build de librería.
3. **No incluye**: router, estado global, `base.css`, ni estilos globales (salvo casos justificados y con prefijo, como `cv-print-*`).
4. **Tiene su propio dev server** (`src/dev/main.tsx`) que simula el anfitrión, para desarrollar y probar de forma aislada.
5. **Inyecta dependencias externas por props** (ej. `analyzer` en `CvTab`), así el anfitrión puede configurar backends.

## Design system

`design-system/` es el paquete `@muni/design-system`:

- `tokens.json`: fuente de verdad (copiada del deck del design system)
- `tokens.css`: variables `--muni-*` y `@font-face`. Los módulos usan **solo** estas variables.
- `base.css`: reset y tipografía base. Lo importa **solo** el anfitrión (o el dev server de un módulo).

Cambios al design system: acordarlos en el equipo, actualizar `tokens.json` y `tokens.css` juntos.

## Crear un módulo nuevo

Usar la skill de proyecto `/nuevo-modulo` o copiar la estructura de `cv-empleabilidad/` (sin `src/` de negocio), agregarlo a `workspaces` en el `package.json` raíz y escribir su `CLAUDE.md`.

## Backend / IA

Ningún módulo llama directamente a APIs de IA desde el navegador. Cada integración define un contrato HTTP en `<modulo>/docs/` y un cliente en `src/services/`. Hasta que el backend exista, el módulo funciona con un mock que respeta el mismo contrato.
