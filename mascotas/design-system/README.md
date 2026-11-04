# Hualañé — Municipal Design System

Sistema visual y funcional para la **Ilustre Municipalidad de Hualañé**, Región del Maule, Chile. Un solo lenguaje para sitio web, portal de trámites, app, sistemas internos, dashboards, asistente IA / WhatsApp, tótems, presentaciones, documentos, redes sociales, señalética y emergencias.

Principio rector: **evolución + sistematización + simplificación + digitalización**. No es un rebranding: el escudo y el logotipo “Hualañé · Somos tod@s” se preservan tal cual; el sistema se construye alrededor de ellos. *“Hualañé somos tod@s”* se traduce en una regla de diseño: **un municipio para todas las personas** — se diseña primero para quien tiene más dificultad (adultos mayores, baja visión, baja alfabetización digital, mala conectividad).

## Fuentes

Materiales entregados por la Municipalidad (copiados en `assets/`):
- `uploads/ESCUDO_huala2.png` — lockup oficial: escudo + logotipo “Hualañé” + barra “Somos tod@s”. Recortado en `assets/logo/escudo.png`, `wordmark.png`, `wordmark-somos-todos.png`; original en `logo-full-color.png`.
- `uploads/logo_footer.png` — versión vertical monocromática blanca → `assets/logo/logo-vertical-white.png`.
- `uploads/hero-parquimetros.jpeg`, `uploads/images.jpeg` — fachada del edificio municipal → `assets/photos/municipalidad-fachada.jpg`, `municipalidad-palmeras.jpg`.
- `uploads/WhatsApp-Image-…jpeg` — operativo en terreno con camioneta municipal → `assets/photos/feria-terreno.jpg`.
- `uploads/infografia-ley-20423.jpg` — infografía turística actual (referencia, `assets/reference/`), rediseñada en `applications/infographic.html`.

No se entregó codebase, Figma ni archivos tipográficos. Los colores se muestrearon por píxel del PNG oficial.

### Auditoría (resumen)
- **Preservar:** escudo (corona amarilla, hojas de parra verdes, pato sobre ondas azules), logotipo con remates inclinados y la tilde de la ñ como arco, la tríada azul/verde/amarillo.
- **Inconsistencias:** el logotipo usa degradados (verde, amarillo→naranjo) que no funcionan a tamaño pequeño ni en una tinta; la infografía actual mezcla morado, naranjo, celeste, ilustración IA y montañas de stock; tipografías y estilos de ícono distintos en cada pieza.
- **Problemas digitales:** el lockup completo es ilegible bajo ~120px de ancho; amarillo y verde claro no alcanzan contraste como texto; no existe una marca cuadrada para avatar/app.
- **Oportunidades:** derivar la geometría del propio escudo (ondas = río Mataquito) y del logotipo (remate inclinado, arco de la ñ) en vez de importar clichés rurales.

## Arquitectura de marca
- **Nivel A — Institucional:** escudo + “Ilustre Municipalidad de Hualañé” (tipografía del sistema). Decretos, certificados, oficios, credenciales, cuenta pública, tótem. → `<Logo variant="institutional">`
- **Nivel B — Ciudadano:** logotipo “Hualañé” + “Somos tod@s”. Servicios, campañas, redes, eventos, sitio web. → `variant="citizen"` (o `wordmark` solo, en blanco sobre color)
- **Nivel C — Digital:** `assets/logo/digital-mark.svg` — cuadrado Blue 700 con tres bandas (ondas del escudo en azul/blanco/verde) y el arco amarillo de la ñ. Favicon, avatar, app, WhatsApp, dashboards. **Es una extensión propuesta, no un reemplazo del escudo; validar con la Municipalidad.**
- El lockup original (escudo + logotipo) se mantiene para vehículos, patrimonio y piezas existentes.

---

## CONTENT FUNDAMENTALS

**Voz: clara, directa, humana, respetuosa, útil.** La Municipalidad habla como una funcionaria amable que conoce el trámite, no como un decreto.

- **Persona:** tutea (“tú”, “tu solicitud”). Nunca “usted”, “el contribuyente”, “el solicitante”. La Municipalidad habla en primera persona plural: “Te avisamos”, “Revisamos tus documentos”.
- **Verbos primero.** Botones = verbo + objeto: “Solicita tu certificado”, “Paga tu patente”, “Postular”. Nunca “Enviar formulario” cuando se puede decir qué se envía.
- **Cada pantalla responde:** qué necesitas · cuánto demora · cuánto cuesta · en qué estado está · qué pasa después.
- **Frases cortas** (≤ 20 palabras, una idea). Sin siglas sin explicar: “Ayudas sociales (DIDECO)”.
- **Casing:** sentence case en títulos y botones. MAYÚSCULAS solo en overlines/etiquetas de categoría (con tracking +10%).
- **Género:** “tod@s” vive solo en la marca. En textos corrientes: “vecinas y vecinos”, “todas las personas”, o formas neutras.
- **Fechas y números:** “30 de octubre”, “8:30 a 14:00”, “$ 22.000”, “1.284” (punto de miles, coma decimal). Números, RUT, folios y horas en la tipografía mono.
- **Emoji:** no en canales oficiales (web, app, documentos, WhatsApp institucional). Unicode decorativo tampoco; los íconos vienen del set Lucide.
- **Errores:** dicen qué pasó y cómo arreglarlo, sin culpar: “No pudimos leer tu archivo. Sube una foto más nítida o un PDF de menos de 10 MB.”
- **Emergencias:** imperativo, concreto, sin adjetivos: “Evacúa la ribera del Mataquito. Sal ahora con documentos y medicamentos.”

| No | Sí |
|---|---|
| Proceda a efectuar la solicitud correspondiente. | Solicita tu beneficio. |
| El contribuyente deberá presentar… | Necesitas presentar… |
| Su requerimiento se encuentra en proceso de evaluación. | Estamos revisando tu solicitud. Te avisamos el jueves. |
| Departamento de Desarrollo Comunitario | Ayudas sociales (DIDECO) |
| Error 403 | No pudimos entrar a tu cuenta. Revisa tu RUT y clave. |

**Asistente Hualañé:** se presenta como canal oficial, responde en ≤ 3 frases, siempre da costo y demora, ofrece quick replies, pide confirmación explícita antes de enviar algo en nombre de la persona y deriva a un funcionario con nombre y número de atención.

---

## VISUAL FOUNDATIONS

Dirección: **public service design + Swiss information design + identidad latinoamericana contemporánea + diseño territorial**. Mucho blanco, jerarquía tipográfica fuerte, color con significado, geometría propia derivada del escudo.

### Color (tokens en `tokens/colors.css`)
- **Hualañé Blue** `#253786` (Blue 700, del logotipo) — institución, información, confianza. Primario de UI. **River Blue** `#1270B7` (Blue 500, ondas del escudo) — enlaces, datos, agua.
- **Hualañé Green** `#3AAA35` (Green 500, hojas) para superficies y gráficos; **Green 700** `#316B2C` para texto/botones verdes. Territorio, comunidad, beneficios, éxito.
- **Hualañé Yellow** `#FAC22F` (Yellow 400, corona) / `#F8E71E` (300). Atención, plazos, eventos, foco. **Nunca texto sobre blanco**; encima va Blue 950. El amarillo como texto legible es Yellow 700 `#9E5F05`.
- **Neutrales** fríos teñidos hacia el azul (50–950). Texto 950, secundario 600, mínimo 500 (4.8:1).
- **Semánticos:** Success `#1F7A36`, Warning (fill Yellow 400 / texto Yellow 700), Error `#C42B2B`, Info `#1A58A0`, cada uno con fondo suave.
- Proporción típica: 60 blanco · 25 azul · 10 verde · 5 amarillo. Los degradados del logotipo **no** se extienden al sistema: todo es color plano.
- Temas: `[data-theme="dark"]` y `[data-theme="high-contrast"]` reasignan los alias semánticos (`--color-*`).

### Tipografía (`tokens/typography.css`)
- **Atkinson Hyperlegible Next** (Braille Institute, OFL, Google Fonts) para todo; **Atkinson Hyperlegible Mono** para datos. Elegida por legibilidad en baja visión: I/l/1 y O/0 inconfundibles, aperturas abiertas, español completo. El cero lleva barra.
- Escala: Display XL 80 · Display L 60 · H1 44 · H2 34 · H3 26 · H4 21 · Body L 21 · **Body 18 (base)** · Body S 16 · Label 16/700 · Caption 14 · Overline 13/700/+10% · Data 40 mono.
- Display y títulos en 800/700 con tracking negativo (−3% a −1%). Cuerpo 400, interlineado 1.55.

### Espaciado y layout (`tokens/spacing.css`)
- Base 8px con medios pasos 2/4/12: 2·4·8·12·16·24·32·40·48·64·80·96·128.
- Grids: Desktop 1440 (12 col, 24 gutter, 80 margen, max 1280) · Laptop 1280 (12/24/48) · Tablet 768 (8/16/32) · Mobile 390 (4/16/16).
- Áreas táctiles: 48px mínimo, 56px en tótem y flujos para adultos mayores.

### Geometría — Shape language
Tres formas, todas tomadas del patrimonio existente:
1. **Cauce** — las tres ondas del escudo (sube de izquierda a derecha y se aplana). Bandas de 3 colores al pie de piezas, fondos de sección, máscaras de foto, separadores. Componente `<Cauce>`; en estático `data-cauce` (`assets/js/hds-static.js`).
2. **Corte** — el remate inclinado (~8°) de las letras H, u, l. Bloques de título y fotos con `clip-path: polygon(0 8%, 100% 0, 100% 100%, 0 100%)`; el marcador amarillo del overline.
3. **Arco** — la tilde de la ñ. Acento de foco y del Nivel C.
Prohibido: hojitas, montañas, soles, ilustración rural de stock, 3D, glassmorphism, degradados IA.

### Fondos e imágenes
- Fondos planos: blanco, Neutral 50, Blue 700/800/900, Green 700, Yellow 400 (solo piezas de actividad). Sin texturas ni patrones repetidos; la única “textura” es el Cauce.
- Fotografía **documental, honesta, luminosa, territorial**: personas reales de Hualañé haciendo algo real, luz de día, saturación natural, a la altura de los ojos. Sin filtros cálidos, sin HDR, sin stock corporativo.
- Overlays: solo degradado de protección Blue 950 → transparente bajo texto. Nunca tinte de color plano sobre la foto.
- Crop: 16:10 en cards, 16:8 en eventos, a sangre en slides/afiches; foto con *corte* en heroes.

### Bordes, radios, sombras
- Radios: small 6 (badges, checkbox) · medium 12 (botones, inputs) · large 20 (cards, search) · xl 28 (modales, sheets, hero) · full (chips, avatares).
- Cards: fondo blanco, **borde 1px Neutral 200, sin sombra en reposo**, radio 20. Variantes `flat` (Neutral 50 sin borde) y `raised` (shadow.medium). Nunca borde izquierdo de color como acento.
- Inputs: borde 2px Neutral 500 para que se vean (baja visión).
- Sombras teñidas de azul, solo cuando algo flota: small (sticky), medium (hover, menús), large (modal, drawer).

### Estados
- **Hover:** el color de fondo baja un paso (700→800); secundarios/ghost ganan un fondo suave (Blue 50 / Neutral 100); cards ganan borde Neutral 400 + shadow.medium. Enlaces: subrayado 1px → 2px.
- **Press:** un paso más oscuro (→900) + `translateY(1px)`. Sin escalado.
- **Focus:** anillo doble — 2px Blue 950 + 3px Yellow 400 (`--focus-ring`). Visible sobre blanco, azul y foto.
- **Disabled:** Neutral 100 / texto Neutral 500, sin opacidad.
- **Loading:** spinner en el botón + `aria-busy`; skeletons en contenido.

### Motion (`tokens/effects.css`)
- “Flujo”: `cubic-bezier(.2,0,0,1)` — arranque decidido, llegada larga, sin rebote.
- micro 120ms (hover, toggle) · standard 240ms (abrir, cambiar estado, entrar) · complex 420ms (pantallas, gráficos) · progress 1200ms (indeterminado).
- Solo para comunicar progreso, estado, transición o confirmación. Entradas: fade + 6px hacia arriba. Respeta `prefers-reduced-motion`.

### Transparencia y blur
- Casi nunca. Scrim de modales `rgba(13,21,51,.55)`. Paneles sobre azul usan blanco al 8% con borde blanco 18%. Sin blur/backdrop-filter.

### Datos
- Una serie destacada en Blue 700, el resto en Blue 200; orden categórico `--data-1…6`. Etiquetas directas en vez de leyendas, cifras en mono, gridlines Neutral 200. Mapas: placeholder hasta conectar con el SIG municipal.

---

## ICONOGRAPHY

- **Set: Lucide** (`lucide-static@0.469.0` vía unpkg), 24-grid, **stroke 2px**, puntas y uniones redondeadas. Se usa porque la Municipalidad no tiene un set propio; su geometría simple y trazo uniforme encaja con la tipografía. ⚠️ **Sustitución:** no se entregó iconografía municipal; Lucide es la elección del sistema, no una copia de algo existente.
- Uso en React: `<Icon name="file-text" size={24} />` — descarga el SVG una vez, lo inserta inline y hereda `currentColor`. En piezas estáticas: `<span data-i="file-text" style="width:24px;height:24px">` + `assets/js/hds-static.js`.
- Mapa municipal: trámites `file-text` · salud `heart-pulse` · educación `graduation-cap` · seguridad `shield-check` · deporte `trophy` · turismo `map` · cultura `drama` · obras `construction` · tránsito `traffic-cone`/`car` · pagos `credit-card` · beneficios `gift` · adulto mayor `hand-heart` · familia `users` · emprendimiento `store` · agricultura `wheat` · emergencias `siren` · documentos `files` · calendario `calendar-days` · ubicación `map-pin` · teléfono `phone` · WhatsApp `message-circle` (Lucide no incluye logos de marca) · avisos `bell` · municipio `landmark` · accesibilidad `accessibility`.
- Íconos siempre acompañados de texto en navegación y estados. Contenedor “tile”: cuadrado 48px radio 14 con fondo suave del color de la categoría.
- Tamaños: 16–20 en UI densa, 24 en cards, 40–68 en señalética/tótem (stroke 1.75 en tamaños grandes).
- **Sin emoji, sin caracteres unicode como íconos, sin PNG de íconos.**

---

## Índice

**Raíz**
- `styles.css` — punto de entrada (solo `@import`). Enlaza tokens + capa de componentes.
- `tokens/` — `fonts.css`, `colors.css`, `themes.css` (dark / high-contrast), `typography.css`, `spacing.css`, `effects.css` (radios, sombras, motion), `base.css`.
- `components/hds.css` — clases `hds-*` usadas por los componentes React (hover/focus/pressed).
- `assets/logo/` — escudo, wordmark, wordmark + Somos tod@s, lockup original, vertical blanco, `digital-mark.svg` (Nivel C).
- `assets/photos/` — 3 fotografías reales. `assets/reference/` — infografía original.
- `assets/js/hds-static.js`, `assets/css/static.css` — helpers para piezas estáticas (íconos, Cauce, artboards escalables).
- `guidelines/` — tarjetas de fundamentos (Brand, Colors, Type, Spacing, Imagery, Motion, Content, Accessibility).
- `SKILL.md` — para usar el sistema como Agent Skill.

**Components** (`components/<grupo>/<Name>.jsx` + `.d.ts` + `.prompt.md`, una tarjeta por carpeta)
- **core/** — Icon, Logo, Cauce
- **actions/** — Button, IconButton
- **forms/** — TextField, Select, Checkbox, Radio, Switch, FileUpload, SearchBar
- **navigation/** — SiteHeader, Tabs, Breadcrumbs, Pagination, BottomNav, Sidebar
- **feedback/** — Alert, Badge, StatusBadge, EmptyState, Loader
- **overlays/** — Modal, Drawer, Tooltip, Popover
- **cards/** — Card, ServiceTile, NewsCard, EventCard, PersonCard, DocumentCard
- **municipal/** — TramiteCard, BeneficioCard, EmergencyAlert, ServiceStatus
- **data/** — MetricCard, BarChart, LineChart, DonutChart, ProgressBar, Timeline, DataTable
- **conversational/** — ChatMessage, QuickReplies, ChatComposer, HandoffCard

Intentional additions (no hay fuente de componentes; inventario de autor según el brief): `Icon` (wrapper Lucide), `Logo` (lockups oficiales sin redibujar), `Cauce` (primitiva de forma), `Loader`, `ServiceTile`.

**UI kits** (`ui_kits/<producto>/index.html`)
- `website/` — homepage centrada en “¿Qué necesitas hacer?” → portal de trámites con filtros → ficha de trámite → flujo en 3 pasos → confirmación con seguimiento.
- `app/` — app móvil (iOS): inicio, trámites, seguimiento, avisos, asistente, perfil con ajustes de accesibilidad; light / dark / alto contraste.
- `dashboard/` — panel municipal: KPIs, canales, presupuesto, sectores, servicios, obras.
- `assistant/` — Asistente Hualañé (WhatsApp / IA) con conversación guiada, carga de documentos, confirmación y derivación a funcionario.

**Applications** (`applications/`, piezas estáticas a tamaño real)
social-system (8 categorías 1080×1350), instagram-post (1080×1080), instagram-story (1080×1920, emergencia), documents-report (cuenta pública A4), documents-official (certificado + comunicado A4), wayfinding (señalética), credential (credencial), tourism-campaign, infographic, totem (1080×1920).

**Slides** (`slides/`, 1920×1080): Cover, Section, Statement, Data, Quote, Image, Comparison, Process, Timeline, Map, Closing.

## Uso
```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, TramiteCard, SearchBar } = window.HualaDesignSystem_c0b80f;
</script>
```
Datos de contacto, montos y nombres de personas en los ejemplos son ilustrativos.
