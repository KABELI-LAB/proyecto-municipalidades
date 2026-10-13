Sistema de identidad de la Ilustre Municipalidad de Hualañé (Región del Maule), basado en el Manual de Imagen Corporativa. Lema de la presentación: *Territorio que conecta*. Es un **borrador para validación institucional** (octubre de 2026): colores y tipografía son una propuesta de trabajo.

## Principios

- **Permanente.** La identidad pertenece a la comuna y no a una administración en particular.
- **No partidista.** Ninguna pieza lleva nombres, fotografías, firmas, lemas ni colores de autoridades o partidos.
- **Clara y accesible.** Reconocible, confiable y comprensible para todas las personas, sobre todo en una emergencia.

El sistema sirve para hacer reconocible a la municipalidad en todas sus piezas, ordenar el uso del escudo y los símbolos oficiales, separar la identidad institucional de cualquier marca de gestión, facilitar el trabajo de funcionarios, proveedores, imprentas y agencias, y preparar la comunicación de emergencias con reglas comunes.

## Tono de comunicación

Cada mensaje responde cuatro preguntas, en este orden:

1. **Qué ocurrió** — «El camino hacia La Huerta se encuentra temporalmente interrumpido por trabajos de despeje.»
2. **A quién afecta** — «La interrupción comenzó a las 08:30 y será evaluada por el equipo municipal durante la jornada.»
3. **Qué debe hacer** — «Evite circular por el sector y revise las actualizaciones en los canales oficiales.»
4. **Dónde pedir ayuda** — «Para reportar una situación, indique localidad, punto de referencia y, si es posible, adjunte una fotografía.»

Reglas de redacción:

- Trata a la persona de **usted** («Evite circular»); la institución habla en primera persona plural («Informamos que…»).
- Frases completas, informativas y en tipo oración. Nada de MAYÚSCULAS sostenidas, signos repetidos («!!!»), urgencia artificial ni «Comparta».
- Nunca atribuyas logros a una autoridad («Gracias a la gestión de nuestra autoridad…»): habla la municipalidad.
- Datos concretos: fecha, horario («de 10:00 a 14:00 horas»), lugar, costo («La entrada es liberada») y dónde informarse («www.hualane.cl»). Campos aún sin dato van entre corchetes: `[fecha]`, `[lugar]`.
- Sin emoji. Los únicos signos gráficos en texto son ✓ y ✕, siempre acompañados de su palabra.
- Formato chileno: coma decimal (`13,2 : 1`), espacio antes de `%` y unidades (`45 %`, `35 mm`), comillas «» para citar términos y “ ” para mensajes.

> ✓ «La feria de emprendedores locales se realizará el sábado [fecha], de 10:00 a 14:00 horas, en [lugar]. La entrada es liberada. Más información en www.hualane.cl.»
>
> ✕ «¡¡Gracias a la gestión de nuestra autoridad, llega la mega feria!! No te la pierdas.»

## Color

Paleta preliminar de trabajo. Cada color tiene un significado:

| Token | Hex | Uso |
|---|---|---|
| `azul-institucional` | #174A6E | Encabezados, documentos, señalética y fondos principales |
| `verde-territorio` | #4E7D52 | Naturaleza, ambiente, desarrollo local y acentos |
| `marfil-institucional` | #F5F1E8 | Fondos cálidos y piezas culturales |
| `celeste-rio` | #6BA8B8 | Trámites y servicios |
| `terracota` | #B96545 | Cultura y patrimonio |
| `amarillo-senal` | #E5B84B | Alertas y llamados |
| `gris-texto` | #263238 | Cuerpo de texto |
| `gris-claro` | #E8EDF0 | Fondos y tablas |

El fondo de página es siempre `marfil-institucional` (ver Forma, espacio y composición); `blanco` se usa encima, en tarjetas y paneles.

**Proporción de uso** en cada pieza: 45 % `azul-institucional`; 30 % marfil, blanco y grises; 15 % `verde-territorio`; 10 % acentos (`celeste-rio`, `terracota`, `amarillo-senal`). `amarillo-senal` es para llamados y alertas, **nunca como color dominante**. En emergencias el color nunca identifica solo: siempre con **texto, ícono y nivel de prioridad**.

**Combinaciones legibles (WCAG AA):**

| Texto sobre fondo | Contraste | Resultado |
|---|---|---|
| `gris-texto` sobre `blanco` | 13,2 : 1 | Cumple AA |
| `azul-institucional` sobre `marfil-institucional` | 8,3 : 1 | Cumple AA |
| `blanco` sobre `azul-institucional` | 9,4 : 1 | Cumple AA |
| `gris-texto` sobre `amarillo-senal` | 7,1 : 1 | Cumple AA |
| `blanco` sobre `verde-territorio` | 4,8 : 1 | Cumple AA |
| `blanco` sobre `terracota` | 4,2 : 1 | Solo texto grande |
| `blanco` sobre `celeste-rio` | 2,7 : 1 | No usar para texto |
| `blanco` sobre `amarillo-senal` | 1,9 : 1 | No usar para texto |

Sobre `celeste-rio` y `amarillo-senal` el texto es siempre `gris-texto`. `verde-territorio` y `terracota` como color de texto solo en negrita ≥ 19 px o a 24 px o más. `azul-filete` es decorativo (filetes sobre azul), nunca texto.

## Tipografía

Dos familias, cada una con su rol, ambas con soporte completo del español (Ñ ñ á é í ó ú ü ¿? ¡!):

- **Montserrat** (`--font-titulos`): títulos, portadas, señalética y llamados. Regular, SemiBold y Bold.
- **Source Sans 3** (`--font-textos`): cuerpos de texto, formularios, documentos, tablas y contenido digital. Regular, SemiBold y Bold.

Jerarquía para impresión (grupo *Impresión*): `h1` Montserrat Bold 28–36 pt · `h2` Montserrat SemiBold 20–24 pt · `h3` Montserrat SemiBold 14–16 pt · `cuerpo` Source Sans 3 Regular 10,5–12 pt · `nota` Source Sans 3 Regular 8,5–9 pt.

Para presentaciones en lienzo 1920 × 1080 usa el grupo *Presentación*: `titulo-diapositiva` (72 px) para cada título, `etiqueta-seccion` en mayúsculas sobre él, `titulo-bloque` + `texto-bloque` para el contenido y `texto-base` para pies y notas. Títulos en `azul-institucional`, texto en `gris-texto`.

## Identificador visual

El escudo se usa **siempre desde los archivos originales** (`assets/Escudo/`), nunca desde capturas de pantalla o fotografías. Cuatro versiones:

- `escudo-color.png` — versión principal.
- `escudo-mono-azul.png` — impresión a una tinta (`azul-institucional`).
- `escudo-mono-negro.png` — una tinta negra.
- `escudo-negativo.png` — fondos oscuros y `azul-institucional`.

**Dos firmas, dos usos.** La *firma institucional* (nivel principal, permanente; componente `FirmaInstitucional`) va en decretos, oficios y membrete, formularios y trámites, señalética, carteles de obra y vehículos, credenciales y piezas de emergencia. La *firma con lema* (`assets/Firmas/firma-lema.png`, nivel secundario, reemplazable) solo en redes sociales y sitio web, campañas de difusión, actividades, ferias y eventos; **nunca en documentos oficiales ni en emergencias**.

**Resguardo:** 1x por lado, con x = ¼ del alto del identificador horizontal. **Tamaños mínimos:** horizontal 35 mm de ancho en impresión, 140 px en pantalla; vertical 15 mm / 48 px de alto.

**Usos incorrectos:** deformar · cambiar los colores · agregar sombras o efectos · rotar · reducir sin legibilidad · fondo sin contraste.

## Forma, espacio y composición

- Un solo radio, `radio-base` (4 px), para tarjetas, muestras, barras y fotografías; `radio-circulo` solo para discos numerados. Sin sombras ni degradados.
- Las superficies se separan por tono: tarjetas `blanco` sobre fondo `marfil-institucional`. Los ítems de una lista se separan con filetes de `borde-filete` (2 px) en `gris-claro`.
- Lienzo de presentación 1920 × 1080: márgenes `espacio-32` (128 px) a los lados y arriba, `espacio-40` abajo; pie a 64 px del borde. Relleno de tarjeta `espacio-10`; separación entre tarjetas `espacio-6`.
- **Fondo por defecto: `marfil-institucional`.** Toda diapositiva de contenido, pieza digital y página va sobre marfil, también las de datos, tablas y paleta. `blanco` nunca es fondo de página: es la superficie de tarjetas, paneles y tablas *sobre* marfil, y ese contraste blanco/marfil es la firma visual del sistema. `azul-institucional` es el fondo de portadas y cierres de sección.
- Única excepción: el papel de documentos oficiales (`Membrete`, `Oficio`) y la señalética, que son blancos por su soporte.

## Gráficos e imágenes

- **Ondas del río** (`assets/Graficos/ondas-rio.svg`): motivo derivado de las aguas del escudo, cuatro ondas en `celeste-rio` con bloques de `verde-territorio`, `terracota`, `amarillo-senal` y `marfil-institucional`. Va a sangre en la mitad derecha de la portada, sobre `azul-institucional`.
- `FranjaColor` en el borde inferior de portadas y cierres.
- Fotografía: imágenes reales de la comuna (`assets/Fotografia/`), con `radio-base`, sin filtros ni texto encima. No uses fotografías de autoridades.

## Iconografía

La municipalidad **aún no define un set de íconos**. Mientras tanto usa íconos de trazo simple de 48 px en `azul-institucional`, siempre junto a texto; en emergencias el ícono acompaña al texto y al nivel de prioridad, nunca los sustituye. No uses emoji.

## Papelería oficial

Propuesta para validar. Todo documento oficial (decretos, oficios, cartas, certificados) se escribe sobre el `Membrete`: hoja carta 216 × 279 mm (u oficio 216 × 330 mm), márgenes de 25 mm a los lados y 15 mm arriba y abajo, firma institucional arriba a la izquierda con el escudo a 18 mm de alto y pie con `FranjaColor` de 1,5 mm y los datos institucionales en 8,5 pt.

- Texto en la escala de *Impresión*: `cuerpo` a 11 pt, justificado; etiquetas y títulos en `azul-institucional`; todo lo demás en `gris-texto`. Nada de colores de acento en el cuerpo del documento.
- Escudo en color en impresora a color; `escudo-mono-negro.png` en blanco y negro o fotocopia (sin franja en el pie); `escudo-mono-azul.png` en imprenta a una tinta.
- Los oficios siguen el componente `Oficio`: ORD. N°, ANT., MAT., lugar y fecha; DE y A; texto; firma; distribución.
- Solo la firma institucional. Nunca la firma con lema, logos de programas, ni nombres o fotos de autoridades como elemento gráfico.

## Pendientes de validación

Colores y tipografía oficiales (validar esta propuesta); si «Somos tod@s» es lema institucional o marca de gestión — hasta resolverlo, trátalo como marca de gestión y no lo uses en piezas oficiales; recursos gráficos (patrón, íconos y estilo fotográfico); arquitectura de marca y firma de áreas; aplicaciones: validar la papelería propuesta y definir señalética y canales digitales.

## Datos institucionales

Ilustre Municipalidad de Hualañé · Av. Libertad 90, Hualañé, Región del Maule · www.hualane.cl
