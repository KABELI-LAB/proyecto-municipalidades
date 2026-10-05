# Módulo __NOMBRE__ · "__LABEL__"

Responsable: __DUENO__.

__DESCRIPCION__

## Estado actual

Recién creado desde la plantilla. Actualiza esta sección a medida que avances: qué funciona, qué está simulado y qué falta.

## Mapa de archivos

| Ruta | Qué hace |
|---|---|
| `src/index.ts` | **API pública**: `__Nombre__Tab` y `__nombre__TabMeta` (label, ruta y descripción que usa el sitio) |
| `src/__Nombre__Tab.tsx` | Componente raíz de la pestaña |
| `src/styles/ui.module.css` | Estilos (solo variables `--muni-*`) |
| `src/dev/` | Anfitrión mínimo para `npm run dev`. No se exporta |

## Comandos (desde esta carpeta)

`npm run dev` (http://localhost:__PUERTO__) · `npm test` · `npm run typecheck` · `npm run lint`

Para ver el módulo dentro del sitio completo: `npm run dev` en la raíz (http://localhost:5173).

## Convenciones

Las del `CLAUDE.md` raíz. Usa `modulos/cv-empleabilidad/` como referencia de un módulo completo (servicios con mock, tests y estados de carga).
