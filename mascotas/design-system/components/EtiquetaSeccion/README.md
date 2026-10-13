# EtiquetaSeccion

Antetítulo que abre cada diapositiva o sección: una barra de 48 × 8 px y el nombre de la sección en MAYÚSCULAS, seguido del título.

- Marcado: `<div class="mh-etiqueta"><span>01 · Fundamentos</span></div>` y luego `<h2 class="mh-titulo">…</h2>`.
- El texto sigue el formato `NN · Nombre de la sección` (número de dos cifras, punto medio). El consumidor escribe el texto en tipo oración; el CSS lo pasa a mayúsculas.
- Sobre `marfil-institucional` o `blanco`: barra `verde-territorio`, texto `azul-institucional`.
- Dentro de `.mh-sobre-azul`: barra `amarillo-senal`, texto y título `marfil-institucional`.
- El título usa el estilo `titulo-diapositiva` (72 px en el lienzo 1920; la vista previa lo reduce a 56 px por espacio).
- No: cambiar el color de la barra por otro de la paleta ni usar la etiqueta sin título.
