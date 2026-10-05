---
name: nuevo-modulo
description: Crea un módulo nuevo (una pestaña del sitio, con su enlace en el navbar y su tarjeta en el inicio) en el monorepo. Úsalo cuando alguien del equipo pida empezar una nueva sección o pestaña.
---

# Crear un módulo nuevo

Necesitas: **nombre** en kebab-case (ej. `tramites`), **etiqueta** del navbar (ej. "Trámites en línea"), **responsable** y una **descripción** de una frase para la tarjeta del inicio (trato de usted). Pregunta lo que falte.

1. Asegúrate de estar en una rama `<nombre>/estructura-inicial` (créala si estás en `main`).
2. Ejecuta desde la raíz:
   `npm run nuevo-modulo -- <nombre> "<Etiqueta>" "<Responsable>" "<Descripción>"`
   El script copia `plantillas/modulo/`, registra el módulo en `sitio/src/modulos.ts` y agrega la dependencia en `sitio/package.json`. No repitas esos pasos a mano.
3. Ejecuta `npm install` y luego `npm run check`. Todo debe pasar.
4. Agrega el módulo a la tabla de estructura del `CLAUDE.md` raíz y del `README.md`.
5. Reporta: carpeta creada, ruta (`/<nombre>`), puerto del dev server aislado (lo imprime el script) y cómo verlo (`npm run dev` → http://localhost:5173).

Si el script falla porque faltan los marcadores `<nuevo-modulo:...>` en `sitio/src/modulos.ts`, regístralo a mano siguiendo el patrón de la entrada de `cv-empleabilidad` y avisa al usuario.
