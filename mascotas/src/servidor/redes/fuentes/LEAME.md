# Fuentes para las piezas de redes sociales

Son las mismas fuentes de `design-system/fonts/` (Montserrat y Source Sans 3,
licencia SIL Open Font License 1.1), fijadas en un peso y guardadas como TTF:
la biblioteca que dibuja el texto de las piezas (Pango, dentro de sharp) no
lee archivos woff2.

- `Montserrat-Bold.ttf`: Montserrat, peso 700 (títulos).
- `SourceSans3-Regular.ttf`: Source Sans 3, peso 400 (texto).
- `SourceSans3-Bold.ttf`: Source Sans 3, peso 700 (texto destacado).

Se generaron con fontTools (`varLib.instancer`) a partir de los archivos
variables de `design-system/fonts/`. Si el sistema de diseño cambia sus
fuentes, vuelva a generarlas desde allí.
