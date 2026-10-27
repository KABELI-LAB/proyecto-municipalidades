# API `/api/emergencia/*`

Tipos en [`shared/contrato.ts`](../shared/contrato.ts). Errores: `{ error, codigo?, campos? }` con mensaje en español listo para mostrar.

| Método y ruta | Cuerpo | Respuesta | Notas |
|---|---|---|---|
| `GET /territorio` | — | `Territorio` | Sectores y juntas para el cuestionario. Cache 5 min |
| `GET /resumen` | — | `ResumenPublico` | Contador (null bajo el mínimo), campaña, beneficios, barrios con ≥ mínimo de inscritos. Cache 1 min |
| `POST /inscripcion` | `InscripcionEntrada` | `201 InscripcionCreada` | `409 rut_existente` si el RUT ya tiene tarjeta. `400 validacion` con `campos`. Máx. 20 intentos por IP y hora |
| `POST /mi-hogar` | `{ token }` | `MiHogar` | `401 token_invalido`. Token por POST (nunca en la URL) |
| `POST /eventos` | `{ sesion, paso, evento }` | `204` | Métrica anónima del cuestionario (abandono por paso). La sesión se guarda como hash |

## Variables de entorno

| Variable | Dónde | Notas |
|---|---|---|
| `SUPABASEKEY` (o `DATABASE_URL`) | Netlify (secreta) y `.env` local | Cadena de conexión del pooler de Supabase en **modo transacción** (puerto 6543), no una API key. Sin ella en desarrollo se usa el repositorio en memoria; el dev server dice en consola qué modo usa |
| `EMERGENCIA_URL_BASE` | Netlify | URL pública de la pestaña, para los links de WhatsApp (ej. `https://…/emergencia`) |
