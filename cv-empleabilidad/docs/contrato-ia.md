# Contrato del servicio de análisis de CV

El frontend ya está listo para consumir este servicio: basta con definir `VITE_CV_API_URL` (ver `src/services/httpAnalyzer.ts`).

## Endpoint

`POST {VITE_CV_API_URL}/cv/analyze`

```json
// Request
{ "texto": "María José Fuentes...\nPerfil profesional\n...", "nombreArchivo": "mi-cv.pdf" }
```

Respuesta `200` con un objeto `CvAnalysis` (fuente de verdad: `src/services/types.ts`):

```json
{
  "puntaje": 72,
  "resumen": "Su CV tiene una buena base...",
  "fortalezas": ["Sus datos de contacto están completos y visibles."],
  "sugerencias": [
    {
      "id": "s1",
      "seccion": "experiencia",          // contacto|perfil|experiencia|educacion|habilidades|idiomas|formato
      "prioridad": "alta",               // alta|media|baja
      "titulo": "Cuantifique sus resultados",
      "detalle": "Los números hacen creíbles sus logros...",
      "ejemplo": "Atendí a más de 40 usuarios diarios..."
    }
  ],
  "cvMejorado": {
    "nombre": "", "titular": "",
    "contacto": { "email": "", "telefono": "", "ubicacion": "", "linkedin": "" },
    "perfil": "",
    "experiencia": [{ "cargo": "", "organizacion": "", "periodo": "", "logros": [""] }],
    "educacion": [{ "titulo": "", "institucion": "", "periodo": "" }],
    "habilidades": [""],
    "idiomas": [""]
  }
}
```

Errores: cualquier código distinto de 2xx. El frontend muestra un mensaje genérico.

## Requisitos del backend

- La API key vive solo en el servidor (variable de entorno), nunca en el bundle.
- Modelo sugerido: Claude, con salida estructurada (JSON schema derivado de `CvAnalysis`) y validación del resultado antes de responder.
- Instrucciones al modelo: español de Chile, trato de usted, tono del manual (directo, respetuoso, útil); **no inventar** experiencia ni datos que no estén en el CV, y usar `[corchetes]` para lo que el usuario deba completar; no incluir datos sensibles (RUT, edad, estado civil) en `cvMejorado`.
- No guardar el CV ni registrarlo en logs. Limitar el tamaño del texto (~20.000 caracteres) y aplicar rate limiting.
- Alternativa: el backend puede recibir el PDF original (Claude lee PDFs de forma nativa) si la extracción en el navegador resulta insuficiente; habría que cambiar el request a `multipart/form-data`.
