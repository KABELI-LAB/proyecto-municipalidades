# Tema Vichuquén (demostración)

Identidad visual de la Ilustre Municipalidad de Vichuquén para mostrar el
portal y el panel cuando se elige ese municipio en la demostración: colores,
tipografía, logos e imagen de Instagram (`pieza.json`). Sus datos y territorio
están en `demo/municipios/vichuquen/`.

- Fuente: sistema de diseño «Vichuquén — Municipal Design System» (tokens.json
  y guía de marca, 3 de noviembre de 2026). Es una propuesta de sistema, no el
  sitio actual de la Municipalidad.
- Colores: escalas teal, dorado y neutros del sistema; éxito #1D7639 y peligro
  #B42318. Tipografías: Lexend e IBM Plex Mono (Google Fonts, OFL).
- `logo-horizontal-color.png` (sobre blanco, 310 × 99 px) y
  `logo-vertical-white.png` (pie, 430 × 372 px), tal cual vienen del sistema:
  no se redibujan. `logo-horizontal-white.png` queda de respaldo.
- El pie imita el del sitio actual (munivichuquen.cl): gris carbón #353535 y
  nombre en naranjo #D58D28, medidos de una captura. Esos dos colores no están
  en el sistema de diseño.
- No se dibujan el Oleaje, el Trazo ni la Mitad del sistema: el tema solo
  oculta el Cauce de Hualañé.
- `tema.css` se agrega a `src/estilos/tokens.css` y los logos se copian a
  `public/ds/temas/vichuquen/` con `npm run diseno`. La configuración del tema
  del municipio está en `config/municipios/vichuquen.json`.
