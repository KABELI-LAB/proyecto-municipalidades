# Módulo cv-empleabilidad · "Revisa tu CV"

Pestaña donde una persona sube su CV (PDF o DOCX), recibe feedback para mejorarlo y obtiene su CV reestructurado en **3 diseños** (Clásico, Moderno, Compacto) descargables en PDF.

## Estado actual

- La IA está **simulada**: `mockAnalyzer` aplica reglas heurísticas. El backend real aún no existe (ver [docs/contrato-ia.md](docs/contrato-ia.md)).
- La extracción de texto es real y ocurre en el navegador (pdfjs-dist / mammoth, cargados bajo demanda).

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
| `src/services/httpAnalyzer.ts` | Cliente del futuro backend (`POST {VITE_CV_API_URL}/cv/analyze`) |
| `src/services/analyzer.ts` | Elige mock o HTTP según `VITE_CV_API_URL` |
| `src/lib/parseCv.ts` | Estructura texto plano → `CvData` (heurístico) |
| `src/lib/extractText.ts` | PDF/DOCX → texto |
| `src/templates/` | Las 3 plantillas A4 (794×1123px). Registro en `templates/index.ts` |
| `src/styles/ui.module.css` | Estilos de la UI; `print.css` es global a propósito (impresión) |
| `src/dev/` | Sitio anfitrión simulado, solo para `npm run dev`. No se exporta |
| `src/test/fixtures.ts` | CVs ficticios para tests |

## Comandos (desde esta carpeta)

`npm run dev` · `npm test` · `npm run typecheck` · `npm run lint` · `npm run build`

## Convenciones del módulo

- Textos de UI en español con trato de usted (ver CLAUDE.md raíz).
- Para agregar un 4º diseño: crear `src/templates/XTemplate.tsx`, usar las piezas de `parts.tsx`, registrarlo en `TEMPLATES` y añadir un caso al test de `CvTab`.
- Para agregar una regla al mock: añadirla en `analizarTexto` con `add({...})` y cubrirla en `mockAnalyzer.test.ts`.
- Las plantillas son el CV **del usuario**: usan la paleta con moderación y deben imprimirse bien en blanco y negro.
- Verifica cambios visuales con `npm run dev` (o el plugin Playwright si está instalado), no solo con tests.

## Próximos pasos conocidos

1. Backend de IA (Claude API) según `docs/contrato-ia.md`, con validación del JSON de respuesta.
2. Cuando se conecte la IA, actualizar el aviso de privacidad en `CvTab.tsx` (marcado con `TODO(ia)`).
3. Exportar PDF real (hoy usa `window.print()`), y opcionalmente DOCX.
