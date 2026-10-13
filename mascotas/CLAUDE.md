# Plataforma de Tenencia Responsable — Municipalidad de Hualañé

Prototipo GovTech: un portal ciudadano y un panel municipal conectados por un
ciclo de datos (Ciudadanía → Datos → Inteligencia → Decisión → Operativo →
Resultados → Datos). No es un portal de publicaciones.

## Antes de cualquier tarea
1. Lee `docs/concepto.md`: es la fuente de verdad sobre roles, flujos,
   entidades, alcance del MVP y qué es público o privado.
2. Para cualquier interfaz, lee `design-system/README.md` y usa
   `design-system/tokens.json`.
3. Si una tarea contradice el concepto, detente y pregunta antes de seguir.

## Sistema de diseño (obligatorio)
- Colores, tipografía, espacios y radios SOLO desde `design-system/tokens.json`.
  No inventes colores ni tamaños fuera de los tokens.
- Fondo de página: `marfil-institucional`. Tarjetas y paneles: `blanco`.
  `azul-institucional` para encabezados y fondos de portada.
- Un solo radio (`radio-base`, 4 px). Sin sombras ni degradados.
- Montserrat para títulos; Source Sans 3 para texto, formularios y tablas.
  Fuentes locales en `design-system/fonts/`.
- `amarillo-senal` solo para alertas y llamados, nunca dominante.
  Nunca texto blanco sobre `celeste-rio` ni `amarillo-senal`.
- Estados y prioridades: siempre color + texto (+ ícono), nunca solo color.
- Escudo: siempre desde `design-system/assets/Escudo/`; `escudo-negativo.png`
  sobre azul. No deformar ni recolorear.
- Referencias visuales de componentes en `design-system/components/*/`
  (README.md + preview.html) y `components/bundle.css`.

## Tono y formato
- Trato de usted; la institución habla en primera persona plural.
- Sin emoji, sin MAYÚSCULAS sostenidas, sin urgencia artificial.
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
- Movimiento sutil: transiciones de 150 a 250 ms, cifras que cuentan una
  vez al entrar, cambios de capa con fundido. Respetar
  prefers-reduced-motion.
- Carga con bloques de esqueleto, nunca pantallas vacías ni íconos girando.
- Portal pensado primero para celular; panel para escritorio, salvo la
  vista de terreno, que es para celular. Botones de al menos 44 px de alto.
- Prueba de 5 segundos: si alguien no entiende qué hacer en una pantalla
  en 5 segundos, sobra información.
- Referencia visual: la maqueta del portal (inicio) y del panel (resumen)
  aprobada por el equipo. Respetar su jerarquía, orden de bloques y espaciado.
