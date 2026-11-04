# @muni/design-system · Hualañé

Design system oficial del proyecto: tokens, componentes React, logos y guías. Viene de Claude Design ("Hualañé Design System"). La guía completa de marca, voz, color y forma está en **[GUIA.md](GUIA.md)**: léela antes de diseñar.

## Uso

```ts
// Estilos (una vez). El sitio importa base.css; un módulo solo necesita tokens.css si se usa aislado.
import '@muni/design-system/base.css'

// Componentes React
import { Button, Alert, Badge, Icon, Logo, Tabs, Loader, Cauce } from '@muni/design-system'
```

```tsx
<Button variant="primary" iconLeft="send">Enviar solicitud</Button>
<Alert tone="warning" title="Falta un documento">Sube tu certificado de residencia.</Alert>
<Icon name="file-text" size={24} />
```

Las clases `.hds-*` (botones, campos, chips, tarjetas, alertas) también se pueden usar directo en el JSX cuando hace falta un elemento propio, por ejemplo un `Link` del router con `className="hds-btn hds-btn--primary"`.

## Contenido

| Ruta | Qué es |
|---|---|
| `tokens/` | Variables CSS: `colors.css` (escalas blue/green/yellow/neutral + alias `--color-*`), `themes.css` (oscuro y alto contraste), `typography.css`, `spacing.css`, `effects.css` (radios, sombras, motion), `base.css`, `fonts.css` |
| `tokens.css` | Entrada para módulos: tokens + capa de componentes `.hds-*`. Sin estilos globales sobre elementos |
| `base.css` | `tokens.css` + estilos base (body, enlaces, foco). **Solo el sitio** y los dev servers |
| `components/<grupo>/<Nombre>.jsx` | Componentes React, con `.d.ts` (tipos) y `.prompt.md` (cuándo y cómo usarlos) |
| `index.js` / `index.d.ts` | Punto de entrada: importar siempre desde aquí, nunca archivos internos |
| `assets/logo/` | Escudo, wordmark, lockups y marca digital. **Nunca redibujar**: usar `<Logo>` |
| `guidelines/` | Tarjetas HTML de fundamentos (color, tipografía, espaciado, accesibilidad…) |
| `ui_kits/` | Referencias de pantallas (sitio, app, dashboard, asistente). Sus datos de contacto son **ilustrativos**: no copiarlos |
| `SKILL.md` | Instrucciones para usar el sistema como skill de agente |

## Reglas clave

- **Voz:** tú, verbo primero, frases de ≤ 20 palabras. Nunca "usted". Ver *Content fundamentals* en GUIA.md.
- **Color:** Blue 700 `#253786` primario. El amarillo **nunca** es texto sobre blanco: encima va Blue 950. Proporción 60 blanco · 25 azul · 10 verde · 5 amarillo.
- **Tipografía:** Atkinson Hyperlegible Next (texto) y Mono (cifras, RUT, horas). Cuerpo 18px.
- **Forma:** radios 6/12/20/28. Cards con borde 1px Neutral 200, sin sombra en reposo. **Nunca** borde izquierdo de color como acento.
- **Toque:** 48px mínimo (56px en flujos para personas mayores). Foco con `--focus-ring`.
- **Íconos:** Lucide, siempre acompañados de texto en navegación y estados. Sin emoji.

## Adaptaciones hechas para el proyecto

El export original estaba pensado para prototipos que cargan todo desde CDN. Para producción se cambió:

1. **Fuentes locales** (`tokens/fonts.css`): `@fontsource` con subconjunto latino, en vez de Google Fonts.
2. **Íconos locales** (`components/core/Icon.jsx` + `icons.js`): `lucide-react` con un registro acotado, en vez de descargar cada SVG desde unpkg. Para usar un ícono nuevo, agrégalo en `components/core/icons.js` (en desarrollo, la consola avisa si falta).
3. **Logos empaquetables** (`components/core/Logo.jsx`): los archivos se resuelven con `new URL(..., import.meta.url)` para que Vite los incluya.
4. **Tipos para React 19:** `JSX.Element` → `React.JSX.Element` en los `.d.ts`.
5. **Punto de entrada** `index.js`/`index.d.ts` (el export solo traía un bundle global para prototipos).
6. **Temas de otros municipios (demostración):** además de Hualañé (predeterminado), el design system trae los temas de **Curepto** y **Vichuquén**, tomados de sus proyectos hermanos (`Proyecto Curepto`, `Proyecto Vichuquen`). Se activan con `data-tema="curepto|vichuquen"` en `<html>` (lo hace el sitio desde la franja "Ver municipio de"):
   - `tokens/temas/<municipio>.css`: colores, tipografía, radios y modos oscuro/alto contraste, bajo `:root[data-tema="…"]`. Mismos nombres de rampas (`--blue-*`, `--yellow-*`, `--green-*`): en Curepto azul municipal y amarillo aviso; en Vichuquén `--blue-*` = teal y `--yellow-*` = dorado.
   - `components/hds.css`: reglas `[data-tema="…"] .hds-*` al final (botones píldora de Curepto, kicker y header de Vichuquén). `--color-action` es el fondo del botón primario (en Curepto, rojo concejo).
   - `MunicipioProvider` / `useMunicipio()` (`components/core/Municipio.jsx`): nombre del municipio activo para textos. `Logo` elige los archivos del municipio activo (`assets/logo/curepto-*`, `assets/logo/vichuquen-*`).
   - `Oleaje` y `Trazo`: formas propias de Vichuquén.
   - Los módulos ajustan lo suyo con `:global([data-tema='…']) .clase` en sus CSS Modules y `useMunicipio()` en lo que se dibuja fuera del CSS (canvas, PDF, QR).
7. No se incluyeron las fotos ni los archivos originales entregados por la Municipalidad (`uploads/`, `assets/photos/`), ni las piezas estáticas (`applications/`, `slides/`).

Cambios al design system: acordarlos en el equipo y, si se actualiza desde Claude Design, volver a aplicar estas adaptaciones.
