# Plataforma de Tenencia Responsable — Municipalidad de Hualañé

Prototipo GovTech: un portal ciudadano y un panel municipal conectados por un
ciclo de datos (Ciudadanía → Datos → Inteligencia → Decisión → Operativo →
Resultados → Datos). No es un portal de publicaciones.

## Antes de cualquier tarea
1. Lee `docs/concepto.md`: es la fuente de verdad sobre roles, flujos,
   entidades, alcance del MVP y qué es público o privado.
2. Para cualquier interfaz, lee `design-system/README.md` (Hualañé Design
   System) y usa los tokens de `design-system/tokens/`.
3. Si una tarea contradice el concepto, detente y pregunta antes de seguir.

## Sistema de diseño (obligatorio)
- Colores, tipografía, espacios, radios, sombras y movimiento SOLO desde
  `design-system/tokens/*.css` (copiados a `src/estilos/tokens.css` por
  `npm run diseno`). No inventes colores ni tamaños fuera de los tokens.
- Fondo de página: blanco (`--color-surface`); panel municipal sobre
  `--color-surface-sunken`. Tarjetas: blanco, borde 1 px `--color-border`,
  `--radius-large`, sin sombra en reposo (sombra media solo al pasar el cursor).
- Radios: small 6 (insignias), medium 12 (botones, campos), large 20
  (tarjetas), xl 28 (portadas, modales), full (chips). Color plano: sin
  degradados (salvo el de protección bajo texto sobre foto).
- Atkinson Hyperlegible Next para todo; Atkinson Hyperlegible Mono para cifras,
  RUT, folios y horas. Cuerpo de 18 px. Las sirve next/font (src/app/layout.tsx).
- Azul `--color-primary` (Blue 700) para institución y acción principal;
  verde para comunidad y éxito; amarillo solo para atención, plazos y alertas,
  nunca como texto sobre blanco (encima va Blue 950).
- Estados y prioridades: siempre color + texto (+ ícono), nunca solo color.
- Marca: logotipo ciudadano (nivel B) en el portal; escudo + nombre oficial
  (nivel A) en el panel; versión vertical blanca sobre azul. Archivos desde
  `design-system/assets/logo/`, nunca redibujados ni recoloreados.
- Forma propia: el Cauce (ondas del escudo, `src/componentes/Cauce.tsx`) y el
  corte inclinado. Sin hojitas, huellas decorativas, montañas ni ilustración.
  Única excepción aprobada: Pawni, el quiltro guía del portal
  (`public/pawni/`, `src/componentes/portal/pawni/`). No se agregan otras.
- Íconos: set Lucide (`lucide-react`), trazo 2 px, siempre con texto.
- Referencias de componentes en `design-system/components/` y kits en
  `design-system/ui_kits/` (website y dashboard).

## Tono y formato
- Se tutea («tú», «tu solicitud»); la institución habla en primera persona
  plural («Te avisamos»). Botones: verbo + objeto, en minúscula inicial.
- Frases cortas (20 palabras o menos). Sin siglas sin explicar.
- Sin emoji, sin MAYÚSCULAS sostenidas (solo en sobretítulos), sin urgencia
  artificial. En texto corriente, «vecinas y vecinos»; «tod@s» solo en la marca.
- Formato chileno: coma decimal, espacio antes de % (`45 %`), horas `10:00`.
- Campos sin dato entre corchetes: `[fecha]`, `[lugar]`.
- Nunca atribuir logros a autoridades ni usar nombres o fotos de autoridades.

## Reglas del producto
- Toda vista con datos simulados muestra la franja «Datos de demostración».
- Ubicación mínima: el sector. Nunca pedir ni mostrar direcciones exactas.
- Contacto entre ciudadanos siempre protegido (sin exponer teléfonos).
- La entidad Municipio es configurable: nada de "Hualañé" escrito en el código;
  nombre, sectores e identidad vienen de configuración.
- Los datos simulados viven separados de los reales y se pueden borrar de una vez.
- Recomendaciones: "se recomienda evaluar", nunca "debe"; mostrar las cifras
  que las explican.
- No asumir APIs externas no confirmadas (por ejemplo, Registro Nacional de
  Mascotas).

## Forma de trabajo
- Avanza por etapas pequeñas y verificables; propone el plan antes de escribir
  mucho código.
- Fuera del alcance del MVP (sección 15 del concepto) no se construye nada sin
  pedirlo.

## Datos de demostración
- Los datos ficticios están en `demo/datos/` (ver `demo/README.md`). Úsalos
  tal cual; no inventes otros datos dentro del código.
- Fotos: solo las de `demo/fotos/`. Nunca generes, descargues ni uses imágenes
  de otras fuentes. Solo se muestran animales con foto: las pantallas que
  muestran animales (fichas, listas, mapa público y bandejas) muestran y
  cuentan solo los que tienen foto; los datos de `demo/datos/` no se borran.
- Coordenadas: aproximadas, en `demo/coordenadas.json`. Cada punto trae su
  `lat`/`lng` en `posicion`. No inventes ni corrijas coordenadas en el código;
  si falta alguna, avisa. El mapa no muestra direcciones ni casas.
- Mapa de calor: mostrar calor solo donde haya 3 o más registros. Los reportes
  ciudadanos (todos los tipos) se ven solo en el panel municipal. El mapa
  público muestra únicamente mascotas perdidas y encontradas, por sector, y
  los perros comunitarios en su lugar de referencia.

## Principios de interfaz
- Cada pantalla responde una sola pregunta y tiene una sola acción principal.
- Primera vista sin desplazamiento: máximo 4 bloques. El resto, a un clic
  («Ver más», panel lateral o pestaña).
- Máximo 4 cifras por fila y un solo gráfico por tarjeta. Cifras grandes,
  etiquetas de 2 a 4 palabras.
- Títulos de máximo 6 palabras; texto explicativo de una línea.
- Un solo color de acento por pantalla. Amarillo solo para prioridad alta
  y alertas.
- Mapa: una capa a la vez, controles plegados, leyenda mínima.
- Espaciado generoso según los tokens; ante la duda, más espacio.
- Movimiento sutil («flujo»): 120 ms en detalles, 240 ms al abrir o cambiar
  de estado; cifras que cuentan una
  vez al entrar, cambios de capa con fundido. Respetar
  prefers-reduced-motion.
- Carga con bloques de esqueleto, nunca pantallas vacías ni íconos girando.
- Portal pensado primero para celular; panel para escritorio, salvo la
  vista de terreno, que es para celular. Áreas táctiles de al menos 48 px.
- Prueba de 5 segundos: si alguien no entiende qué hacer en una pantalla
  en 5 segundos, sobra información.
- Referencia visual: los kits `design-system/ui_kits/website` (portal) y
  `dashboard` (panel). Respetar su jerarquía y espaciado.
