# Módulo cv-empleabilidad · "Revisa tu CV"

Pestaña donde una persona sube su CV (PDF o DOCX), recibe feedback para mejorarlo y obtiene su CV reestructurado en **3 diseños** (Clásico, Moderno, Compacto). Del diseño elegido puede descargar PDF y Word, recibir ambos en su correo, y **compararlo con el CV original** que subió.

## Estado actual

- **IA real** (gpt-5.5 en Azure AI Foundry) vía `server/` → función de Netlify `POST /api/cv/analyze`. Contrato y garantías: [docs/contrato-ia.md](docs/contrato-ia.md).
- Sin `VITE_CV_API_URL` (ej. sin `.env` local) se usa `mockAnalyzer` (reglas heurísticas) y la UI muestra "Modo demostración".
- La extracción de texto ocurre en el navegador (pdfjs-dist / mammoth, cargados bajo demanda) y **cuenta** las imágenes; al servidor solo viajan el texto y ese número, nunca las imágenes.
- Antes de analizar se decide si el documento es un CV (`CvResultado` con `esCv`); si no lo es, la UI muestra el aviso "no parece ser un currículum" y no hay diseños.
- Pendiente de decisión del equipo: leer CVs escaneados enviando las páginas como imagen al modelo (implica actualizar el aviso de privacidad).

## Flujo

`UploadZone` → `validateCvFile` → `extractText` → `CvAnalyzer.analyze()` → `FeedbackPanel` + `DesignGallery` → `generarArchivos()` (PDF + Word) → descarga o `EnvioCorreo` → `CvMailer.enviar()`

`DesignGallery` → botón "Comparar con mi CV original" → `Comparacion` (diálogo: lado a lado en escritorio, pestañas en móvil) → `renderOriginal()` (PDF a imágenes con pdfjs; Word a HTML en iframe `sandbox`). El archivo subido vive solo en memoria, en el estado `listo` de `CvTab`.

El estado vive en `CvTab.tsx` como unión discriminada (`inicio | leyendo | analizando | listo | error`).

## Mapa de archivos

| Ruta | Qué hace |
|---|---|
| `src/index.ts` | **API pública**. Lo único que importa la app anfitriona. |
| `src/CvTab.tsx` | Componente raíz y máquina de estados |
| `src/services/types.ts` | Contrato `CvAnalysis` / `CvData`. Cambiarlo obliga a actualizar el mock y `docs/contrato-ia.md` |
| `src/services/mockAnalyzer.ts` | Analizador heurístico (reglas + puntaje) |
| `src/services/httpAnalyzer.ts` | Cliente del backend (`POST {VITE_CV_API_URL}/cv/analyze`) |
| `src/services/analyzer.ts` | Elige mock o HTTP según `VITE_CV_API_URL` |
| `src/lib/parseCv.ts` | Estructura texto plano → `CvData` (heurístico) |
| `src/lib/extractText.ts` | PDF/DOCX → texto + cantidad de imágenes. El Word se lee desde el HTML de mammoth (`htmlATexto`) para no perder saltos de línea ni viñetas |
| `src/lib/renderOriginal.ts` | Vista del archivo original para la comparación |
| `src/lib/useFitScale.ts` | Escala una página A4 al ancho disponible |
| `src/components/Comparacion.tsx` | Diálogo de comparación original vs. diseño sugerido |
| `src/templates/` | Las 3 plantillas A4 en HTML (vista previa, 794×1123px). Registro en `templates/index.ts` |
| `src/export/` | Los mismos 3 diseños como PDF real (`pdf.tsx`, @react-pdf/renderer) y Word (`docx.ts`). Carga diferida |
| `src/services/mailer.ts` | Cliente de envío por correo (`POST {VITE_CV_API_URL}/cv/enviar`) + mock |
| `src/components/EnvioCorreo.tsx` | Formulario de correo (validación, honeypot, estados) |
| `src/styles/ui.module.css` | Estilos de la UI |
| `src/dev/` | Sitio anfitrión simulado, solo para `npm run dev`. No se exporta |
| `src/test/fixtures.ts` | CVs ficticios para tests |
| `server/` | Backend: análisis (`handler.ts`, `analyze.ts`, `schema.ts`, `prompt.ts`), correo (`email.ts`) y plugin de Vite. Ver docs/contrato-ia.md |

## Comandos (desde esta carpeta)

`npm run dev` · `npm test` · `npm run typecheck` · `npm run lint` · `npm run build`

## Convenciones del módulo

- Textos de UI en español con trato de **tú** y verbo primero en botones (ver GUIA.md del design system). El prompt de la IA (`server/prompt.ts`) también pide tú.
- Usa los componentes de `@muni/design-system` (`Button`, `Alert`, `Badge`, `Loader`, `Tabs`, `Icon`…). Para elementos propios, las clases `.hds-*`; en `ui.module.css`, solo tokens.
- Un diseño existe en **tres lugares** que deben verse igual: `src/templates/` (HTML), `src/export/pdf.tsx` y `src/export/docx.ts`. Para agregar un 4º: implementarlo en los tres, registrarlo en `TEMPLATES` y en los mapas `PAGINAS`/`DISENOS`, y sumarlo a `export.test.tsx`.
- En react-pdf, fija `lineHeight` en textos grandes: el heredado se calcula con el tamaño base y se superponen.
- Para agregar una regla al mock: añadirla en `analizarTexto` con `add({...})` y cubrirla en `mockAnalyzer.test.ts`.
- Las plantillas son el CV **del usuario**: usan la paleta con moderación y deben imprimirse bien en blanco y negro.
- Verifica cambios visuales con `npm run dev` (o el plugin Playwright si está instalado), no solo con tests.
- `server/` se carga también con el type stripping nativo de Node (config de Vite): imports relativos **con extensión `.ts`** y sin `enum`, `namespace` ni parameter properties.
- Si cambias `CvAnalysis`, actualiza en el mismo commit `server/schema.ts` (JSON schema + zod), el mock y `docs/contrato-ia.md`.
- **Nunca** leas, imprimas ni pidas el contenido de `.env` o de claves. Los tests usan valores ficticios.

## Próximos pasos conocidos

1. Rate limiting por IP de `/api/cv/analyze` y `/api/cv/enviar`.
2. CAPTCHA en el formulario de correo si aparece abuso.
