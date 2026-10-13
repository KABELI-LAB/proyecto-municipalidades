# Oficio

Oficio ordinario sobre el Membrete: referencia, partes, texto, firma y distribución en el orden de la correspondencia pública chilena.

- Va dentro de `.mh-hoja-cuerpo` del Membrete. Bloques en orden:
  1. `.mh-oficio-ref` (a la derecha, 75 mm): `ORD. N°`, `ANT.:` (antecedente), `MAT.:` (materia en una frase) y `.mh-oficio-fecha` «Hualañé, [fecha]».
  2. `.mh-oficio-partes`: `DE:` y `A:`, con el nombre en mayúsculas y el cargo e institución debajo en `<small>`.
  3. `.mh-oficio-texto`: párrafos justificados en `cuerpo` (11 pt), con el saludo final «Saluda atentamente a usted,».
  4. `.mh-oficio-firma`: línea de firma de 80 mm centrada, nombre en mayúsculas, cargo e institución.
  5. `.mh-oficio-distribucion`: lista en 8,5 pt.
- Etiquetas (`ORD. N°`, `DE:`…) en Source Sans 3 SemiBold `azul-institucional`; todo el resto en `gris-texto`.
- El texto sigue el tono del sistema: trato de usted, institución en plural («informamos»), datos concretos y las cuatro preguntas cuando el oficio comunica una situación.
- Campos sin dato entre corchetes: `[000]`, `[fecha]`, `[Nombre]`, `[Cargo]`.
- La firma del documento es la del funcionario que lo suscribe por ley; no es un elemento de identidad y no se usa fuera de documentos.
