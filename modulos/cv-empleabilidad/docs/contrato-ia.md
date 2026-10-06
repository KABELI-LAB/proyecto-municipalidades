# Contratos de los servicios del módulo CV

## 1. Análisis de CV

Implementado en `server/` y publicado como función de Netlify (`netlify/functions/cv-analyze.mts`). El frontend lo usa cuando existe `VITE_CV_API_URL` (en Netlify: `/api`).

### Endpoint

`POST /api/cv/analyze`

```json
// Request
{ "texto": "María José Fuentes...\nPerfil profesional\n...", "nombreArchivo": "mi-cv.pdf" }
```

- `texto`: obligatorio, máximo 20.000 caracteres (si no, `413`).
- `nombreArchivo`: opcional; **no** se envía al modelo.

Respuesta `200`: un `CvAnalysis` sin `origen` (fuente de verdad: `src/services/types.ts`; el cliente agrega `origen: "ia"`):

```json
{
  "puntaje": 72,
  "resumen": "Su CV tiene una buena base...",
  "fortalezas": ["Sus datos de contacto están completos y visibles."],
  "sugerencias": [
    { "id": "s1", "seccion": "experiencia", "prioridad": "alta",
      "titulo": "Cuantifique sus resultados", "detalle": "...", "ejemplo": "..." }
  ],
  "cvMejorado": {
    "nombre": "", "titular": "",
    "contacto": { "email": "", "telefono": "" },
    "perfil": "",
    "experiencia": [{ "cargo": "", "organizacion": "", "periodo": "", "logros": [""] }],
    "educacion": [{ "titulo": "", "institucion": "", "periodo": "" }],
    "habilidades": [""],
    "idiomas": [""]
  }
}
```

Errores: `{ "error": "<mensaje para mostrar en pantalla>" }` con `400` (solicitud inválida), `405`, `413` (texto muy largo), `502` (el modelo falló o devolvió algo inválido), `503` (no configurado o límite de solicitudes del modelo), `504` (timeout).

### Implementación

| Archivo | Rol |
|---|---|
| `server/handler.ts` | Valida la solicitud, maneja errores y responde (Request → Response) |
| `server/analyze.ts` | Llama a Azure AI Foundry (`{AZURE_OPENAI_ENDPOINT}/chat/completions`, header `api-key`) con *structured outputs* y valida la respuesta |
| `server/schema.ts` | JSON schema estricto que se envía al modelo + esquema zod que valida lo que vuelve. **Deben mantenerse sincronizados con `src/services/types.ts`** |
| `server/prompt.ts` | Instrucciones del modelo (criterios, tono, reglas anti-invención y anti-inyección) |
| `server/vitePlugin.ts` | Sirve el mismo endpoint en `npm run dev` |

Variables: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` (ver `docs/despliegue.md` en la raíz).

### Garantías

- La API key solo existe en el servidor (Netlify env vars / `.env` local).
- El texto del CV y la respuesta del modelo **nunca se registran en logs**; solo códigos de error. Hay un test que lo verifica.
- El CV se envía delimitado por `<cv>…</cv>` y el prompt indica ignorar instrucciones dentro de él (inyección de prompt).
- El modelo no debe inventar datos: lo que falta va entre `[corchetes]` para que la persona lo complete.
- Timeout de 55 s (las funciones síncronas de Netlify cortan a los 60 s).

## 2. Envío del CV por correo

`POST /api/cv/enviar` (`server/email.ts`, función `netlify/functions/cv-enviar.mts`). El navegador genera el PDF y el Word del diseño elegido (`src/export/`) y los envía en base64:

```json
{
  "email": "persona@example.com",
  "nombre": "María José Fuentes",
  "diseno": "moderno",
  "adjuntos": [
    { "nombre": "CV-Maria-Jose-Fuentes-moderno.pdf", "contenido": "<base64>" },
    { "nombre": "CV-Maria-Jose-Fuentes-moderno.docx", "contenido": "<base64>" }
  ],
  "sitioWeb": ""
}
```

Respuesta `200 { "ok": true }` o `{ "error": "<mensaje para mostrar>" }` con `400` (correo o adjuntos inválidos), `405`, `502`, `503` (sin configurar o límite de Resend).

Protecciones contra abuso (el endpoint envía correos a direcciones arbitrarias):

- Asunto y cuerpo **fijos** (`contenidoCorreo`); el nombre solo se usa para el saludo y se escapa en el HTML.
- Máximo 2 adjuntos, 2 MB cada uno, uno PDF y uno DOCX, verificados por **firma de archivo** (`%PDF` / `PK`), no solo por la extensión.
- Honeypot `sitioWeb`: si viene lleno, se responde `200` sin enviar.
- No se guarda el correo ni el CV; los logs solo registran códigos de estado.

Variables: `RESEND_API_KEY`, `CV_EMAIL_FROM`.

## Pendiente

- Rate limiting por IP en ambos endpoints (hoy hay límites de tamaño y honeypot). Evaluar las reglas de rate limit de Netlify o un contador en Netlify Blobs.
- Si aparece abuso del envío: agregar un CAPTCHA (ej. Cloudflare Turnstile) al formulario de correo.
