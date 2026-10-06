# Módulo cv-empleabilidad · "Revisa tu CV"

Pestaña donde una persona sube su CV (PDF o DOCX), recibe feedback para mejorarlo y obtiene su CV reestructurado en **3 diseños** (Clásico, Moderno, Compacto) descargables en PDF.

## Estado actual

- **IA real** (gpt-5.5 en Azure AI Foundry) vía `server/` → función de Netlify `POST /api/cv/analyze`. Contrato y garantías: [docs/contrato-ia.md](docs/contrato-ia.md).
- Sin `VITE_CV_API_URL` (ej. sin `.env` local) se usa `mockAnalyzer` (reglas heurísticas) y la UI muestra "Modo demostración".
- La extracción de texto ocurre en el navegador (pdfjs-dist / mammoth, cargados bajo demanda); al servidor solo viaja el texto.

## Flujo

`UploadZone` → `validateCvFile` → `extractText` → `CvAnalyzer.analyze()` → `FeedbackPanel` + `DesignGallery`

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
| `src/lib/extractText.ts` | PDF/DOCX → texto |
| `src/templates/` | Las 3 plantillas A4 (794×1123px). Registro en `templates/index.ts` |
| `src/styles/ui.module.css` | Estilos de la UI; `print.css` es global a propósito (impresión) |
| `src/dev/` | Sitio anfitrión simulado, solo para `npm run dev`. No se exporta |
| `src/test/fixtures.ts` | CVs ficticios para tests |
| `server/` | Backend: handler, llamada al modelo, esquemas, prompt y plugin de Vite (ver docs/contrato-ia.md) |

## Comandos (desde esta carpeta)

`npm run dev` · `npm test` · `npm run typecheck` · `npm run lint` · `npm run build`

## Convenciones del módulo

- Textos de UI en español con trato de usted (ver CLAUDE.md raíz).
- Para agregar un 4º diseño: crear `src/templates/XTemplate.tsx`, usar las piezas de `parts.tsx`, registrarlo en `TEMPLATES` y añadir un caso al test de `CvTab`.
- Para agregar una regla al mock: añadirla en `analizarTexto` con `add({...})` y cubrirla en `mockAnalyzer.test.ts`.
- Las plantillas son el CV **del usuario**: usan la paleta con moderación y deben imprimirse bien en blanco y negro.
- Verifica cambios visuales con `npm run dev` (o el plugin Playwright si está instalado), no solo con tests.
- `server/` se carga también con el type stripping nativo de Node (config de Vite): imports relativos **con extensión `.ts`** y sin `enum`, `namespace` ni parameter properties.
- Si cambias `CvAnalysis`, actualiza en el mismo commit `server/schema.ts` (JSON schema + zod), el mock y `docs/contrato-ia.md`.
- **Nunca** leas, imprimas ni pidas el contenido de `.env` o de claves. Los tests usan valores ficticios.

## Próximos pasos conocidos

1. Rate limiting del endpoint por IP.
2. Exportar PDF real (hoy usa `window.print()`), y opcionalmente DOCX.
