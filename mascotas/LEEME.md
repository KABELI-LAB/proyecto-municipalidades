# Cómo empezar

Esta carpeta contiene todo lo que Claude Code necesita para construir el
prototipo con la identidad de la Municipalidad de Hualañé:

- `CLAUDE.md` — instrucciones permanentes del proyecto.
- `docs/concepto.md` — diseño conceptual completo (los 17 puntos).
- `design-system/` — README, tokens, fuentes, componentes de referencia,
  escudo y ondas del río.

El sistema de diseño es un borrador para validación institucional; si cambia,
reemplace `design-system/` con la nueva versión.

## Primeros mensajes sugeridos, en orden

1. «Lee CLAUDE.md, docs/concepto.md y design-system/README.md. Propón la
   estructura técnica del proyecto para el MVP de la sección 15, sin escribir
   código todavía.»
2. «Convierte design-system/tokens.json en variables CSS, carga las fuentes
   locales y crea una página de muestra con colores, tipografía y una tarjeta,
   para comprobar que coincide con el sistema de diseño.»
3. «Implementa el modelo de datos de la sección 1 y un script de datos de
   demostración con sectores, solicitudes, reportes, operativos y atenciones,
   separado de los datos reales.»
4. «Construye el portal ciudadano: inicio con las cinco acciones, formularios
   de tres pasos y Mis solicitudes.»
5. «Construye el panel municipal: resumen, ficha de sector y el ciclo completo
   de operativos.»
6. «Agrega el índice de prioridad de la sección 12 y el mapa por sectores de
   la sección 11.»

Revise el resultado de cada paso antes de pasar al siguiente.
