# TablaDatos

Tabla con bordes de 2 px, encabezado tenue y filas alternas en gris claro.

- `<table class="mh-tabla">` con `<thead>` y `<tbody>`. Bordes `borde-filete` en `tabla-borde`; encabezado en peso 600 sobre `tabla-encabezado`; filas pares en `gris-claro`. Relleno de celda 0,35em × 0,6em.
- Números alineados a la derecha con `.num`, con coma decimal y espacios: `13,2 : 1`, `35 mm`, `140 px`.
- Celdas de resultado: `.ok` (`verde-territorio`) o `.no` (`terracota`), siempre con la palabra completa («Cumple AA», «No usar para texto»).
- La tabla va a 26 px en el lienzo 1920: `verde-territorio` y `terracota` sobre `blanco` o `gris-claro` quedan entre 3,6 y 4,8:1, válidos solo como texto grande. Si la tabla se lleva a un tamaño de cuerpo menor, pon los resultados en `gris-texto` y deja el color para un ícono.
