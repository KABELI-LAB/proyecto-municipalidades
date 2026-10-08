# Cómo agregar tu sección al sitio

Cada integrante del equipo construye **su propia pestaña** dentro de `modulos/`. El sitio (`sitio/`) junta todas: una página de **Inicio** con una tarjeta por sección y un **navbar** con un enlace a cada una. Tú trabajas solo en tu carpeta; la integración al navbar es automática.

```
sitio/                ← Inicio + navbar (lo compartimos todos)
modulos/
  cv-empleabilidad/   ← "Revisa tu CV" (Benjamín)
  tu-modulo/          ← tu sección
design-system/        ← colores, fuentes y estilos de Muni Hualañé
```

## 1. Preparar tu computador (una sola vez)

1. Instala **Node.js 24**. Recomendado con [nvm](https://github.com/nvm-sh/nvm): `nvm install 24`.
2. Pide que te agreguen como colaborador del repositorio `KABELI-LAB/proyecto-municipalidades` y acepta la invitación que llega a tu correo. Usa **tu propia cuenta de GitHub**.
3. Clona el repo e instala las dependencias:

   ```bash
   git clone https://github.com/KABELI-LAB/proyecto-municipalidades.git
   cd proyecto-municipalidades
   nvm use
   npm install
   npm run dev        # abre http://localhost:5173 y revisa que el sitio cargue
   ```

## 2. Crear tu módulo

Crea una rama y genera tu carpeta con el script, que también agrega tu sección al navbar y al inicio:

```bash
git checkout -b tramites/estructura-inicial

npm run nuevo-modulo -- tramites "Trámites en línea" "Tu Nombre" "Consulte y realice trámites municipales."
#                       ^nombre   ^texto del navbar   ^responsable ^frase para la tarjeta del inicio

npm install
npm run dev
```

- **nombre**: en minúsculas y con guiones (`tramites`, `agenda-cultural`). Es el nombre de la carpeta y la ruta (`/tramites`).
- Abre http://localhost:5173: tu sección ya aparece en el navbar y en el inicio.

Si usas **Claude Code**, también puedes pedirle: *"crea mi módulo con /nuevo-modulo: tramites, Trámites en línea"*.

## 3. Desarrollar

- Tu código vive en `modulos/<nombre>/src/`. El punto de partida es `<Nombre>Tab.tsx`.
- `npm run dev -w @muni/<nombre>` levanta solo tu módulo, en un puerto propio.
- Mira `modulos/cv-empleabilidad/` como ejemplo de un módulo completo (estados de carga, servicios simulados, tests).
- Completa `modulos/<nombre>/CLAUDE.md`: es lo que leen los agentes de IA para entender tu módulo.

### Reglas del equipo (resumen de [CLAUDE.md](CLAUDE.md))

1. **No edites carpetas de otros** ni `design-system/`. Si necesitas un cambio compartido, coméntalo en el grupo.
2. En `sitio/` solo toca la línea de tu módulo en `sitio/src/modulos.ts` (el orden del arreglo es el orden del navbar).
3. Usa los componentes del design system (`import { Button, Alert } from '@muni/design-system'`) y, en CSS, solo sus variables (`var(--color-primary)`, `var(--space-4)`…). Lee [design-system/GUIA.md](design-system/GUIA.md). El amarillo **nunca** va como texto sobre blanco.
4. Textos en español con trato de **tú** (nunca "usted"), con el verbo primero en los botones ("Descargar PDF") y frases cortas, sin MAYÚSCULAS ni ¡¡signos repetidos!!
5. Revisa tu sección en el celular: debe verse bien a 390px de ancho.
6. Estilos con CSS Modules (`*.module.css`), nada de CSS global.
7. **Nunca subas ni pegues claves** (API keys, contraseñas) en el código, commits, PRs ni chats, incluidos los chats con IA. Van en `.env` local y en Netlify. Lee [docs/despliegue.md](docs/despliegue.md).
8. Nunca uses datos reales de personas en tests o ejemplos.

## 4. Subir tus cambios

```bash
npm run check                    # typecheck + lint + tests: debe pasar sin errores
git add modulos/<nombre> sitio/src/modulos.ts sitio/package.json package-lock.json
git commit -m "tramites: estructura inicial del módulo"
git push -u origin tramites/estructura-inicial
```

Luego abre un **Pull Request** hacia `main` en GitHub. Otra persona del equipo lo revisa y lo integra.

- Ramas: `<modulo>/<descripcion-corta>`.
- Commits: en español, con el prefijo de tu módulo (`tramites: agrega formulario de búsqueda`).
- Si dos personas agregan su módulo al mismo tiempo, puede haber un conflicto en `sitio/src/modulos.ts`: conserva **ambas** líneas.

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `command not found: node` | Abre una terminal nueva o ejecuta `nvm use` |
| Mi sección no aparece en el navbar | Ejecuta `npm install` y revisa que esté en `sitio/src/modulos.ts` |
| `Cannot find module '@muni/<nombre>'` | Falta `npm install` después de crear el módulo |
| El puerto 5173 está ocupado | Cierra el otro `npm run dev` o usa el puerto que muestra Vite |
