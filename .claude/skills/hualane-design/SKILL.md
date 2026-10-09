---
name: hualane-design
description: Design system de la Municipalidad de Hualañé (marca, voz, color, tipografía, componentes React). Úsalo antes de crear o cambiar cualquier interfaz, texto visible o pieza gráfica del proyecto.
---

# Design system Hualañé

1. Lee `design-system/GUIA.md` (guía completa) y `design-system/README.md` (uso en código y adaptaciones del proyecto).
2. Antes de usar un componente, lee su `design-system/components/<grupo>/<Nombre>.prompt.md` y su `.d.ts`. Impórtalo desde `@muni/design-system`, nunca desde archivos internos.
3. Si necesitas un ícono que no está en `design-system/components/core/icons.js`, agrégalo ahí (es un archivo compartido: menciónalo en el PR).
4. Reglas que no se negocian: no redibujar el escudo ni el logotipo (usa `<Logo>`); amarillo nunca como texto sobre blanco; cuerpo 18px; objetivos táctiles de 48px; textos en **tú**, verbo primero, diciendo requisitos, costo, demora, estado y qué sigue cuando aplique.
5. Los `ui_kits/` son referencias visuales: sus nombres, teléfonos y direcciones son ilustrativos y no deben copiarse al sitio.
6. Al terminar, revisa la UI con el subagente `revisor-design-system` y en 390px de ancho.
