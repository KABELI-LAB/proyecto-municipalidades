# Tema Curepto (demostración)

Identidad visual de la Municipalidad de Curepto para el portal y el panel
cuando se elige ese municipio en la demostración: colores, tipografía, logos
e imagen de Instagram. Sus datos y territorio están en `demo/municipios/curepto/`.

- Fuente: sistema de diseño «Municipalidad de Curepto», medido de capturas de
  curepto.cl/imcurepto_web el 3 de noviembre de 2026. Las tipografías se
  identificaron a la vista: conviene confirmarlas en el CSS del sitio.
- Botones del sitio, medidos de capturas (no están en el sistema de diseño):
  magenta #8C0172 («Leer más», «Ir a Blog de Noticias») para la acción
  principal, y dorado #8D5900 («Ver más Novedades») para la secundaria y los
  «ver más». Ambos con texto blanco.
- `logo-blanco.png`: archivo original del sitio (tinta blanca). `logo-azul-noche.png`:
  el mismo con tinta azul noche (#122536), para fondos blancos. Miden 204 × 75 px:
  se ven algo blandos en pantallas de alta densidad; reemplazar por la versión
  vectorial cuando exista.
- `pieza.json`: paleta de la imagen para Instagram.
- No se usan la ficha del alcalde ni fotos o nombres de autoridades.
- `tema.css` se agrega a `src/estilos/tokens.css` y los logos se copian a
  `public/ds/temas/curepto/` con `npm run diseno`. La configuración del
  municipio está en `config/municipios/curepto.json`.
