# Despliegue y secretos

El sitio se publica en **Netlify**: los archivos estáticos salen de `sitio/dist` y los endpoints de backend son funciones en `netlify/functions/`. Toda la configuración versionada está en [`netlify.toml`](../netlify.toml).

## Regla de oro: los secretos nunca entran al repositorio

El repositorio es **público**. Las API keys, contraseñas y endpoints privados:

- **no** se escriben en el código, en `netlify.toml`, en commits, issues ni Pull Requests,
- **no** se pegan en chats (incluidos los chats con agentes de IA),
- viven solo en las **variables de entorno de Netlify** (producción) y en un archivo **`.env` local** (desarrollo), que está en `.gitignore`.

Si una clave se filtra por error: **rótela de inmediato** en el proveedor (Azure) y actualícela en Netlify. Borrar el commit no basta.

## Configurar Netlify (una sola vez)

1. En Netlify: **Add new project → Import an existing project → GitHub** y elija `KABELI-LAB/proyecto-municipalidades`.
2. Netlify lee `netlify.toml`: no cambie el comando de build ni la carpeta de publicación.
3. En **Project configuration → Environment variables**, agregue:

   | Variable | Valor | Marcar como secreto |
   |---|---|---|
   | `AZURE_OPENAI_ENDPOINT` | Endpoint de Azure AI Foundry (termina en `/openai/v1`) | Sí |
   | `AZURE_OPENAI_API_KEY` | API key del recurso | **Sí** |
   | `AZURE_OPENAI_DEPLOYMENT` | Nombre del deployment del modelo | No |
   | `SMTP_HOST` | Servidor SMTP, ej. `smtp.gmail.com` | No |
   | `SMTP_PORT` | `465` (TLS directo) o `587` (STARTTLS) | No |
   | `SMTP_USER` | Cuenta que envía, ej. `cv@su-dominio.cl`. Es también la dirección del remitente | No |
   | `SMTP_PASS` | Contraseña de aplicación de esa cuenta | **Sí** |
   | `CV_EMAIL_FROM_NAME` | (Opcional) nombre visible del remitente. Por defecto "Municipalidad de Hualañé" | No |
   | `CV_EMAIL_REPLY_TO` | (Opcional) dirección que recibe las respuestas | No |
   | `DATABASE_URL` | Registro de emergencia: cadena del *Transaction pooler* de Supabase (puerto 6543) | **Sí** |
   | `EMERGENCIA_URL_BASE` | URL pública de la pestaña, ej. `https://su-sitio.netlify.app/emergencia` | No |

   `VITE_CV_API_URL=/api` ya viene en `netlify.toml` (no es secreto).
4. Haga un deploy y pruebe la pestaña "Revisa tu CV": el aviso bajo la zona de carga debe mencionar el servicio de inteligencia artificial y no debe aparecer el banner "Modo demostración".

## Correo (SMTP con Gmail / Google Workspace)

1. La cuenta que envía (`SMTP_USER`) debe tener **verificación en dos pasos** activada.
2. En esa cuenta: **Cuenta de Google → Seguridad → Contraseñas de aplicaciones**, crea una para "CV Hualañé". Pégala directamente en Netlify (`SMTP_PASS`, marcada como secreta) y en tu `.env`. Los espacios que muestra Google no importan.
3. El remitente siempre es `SMTP_USER` (Gmail no permite enviar como otra dirección). `CV_EMAIL_FROM_NAME` solo cambia el nombre visible.
4. Límites de Gmail: ~500 correos al día en cuentas gratuitas y ~2.000 en Workspace. Si se supera, el sitio responde "Inténtalo en unos minutos".
5. Si la contraseña de aplicación se filtra: **revócala** en la misma pantalla, crea otra y actualízala en Netlify.

## Desarrollo local con IA y correo

```bash
cp .env.example .env     # luego complete los valores en su editor
npm run dev              # el plugin de Vite sirve /api/cv/analyze
```

Sin `.env` (o sin `VITE_CV_API_URL`), el módulo de CV usa el analizador simulado: así se puede desarrollar sin acceso a la clave.

## Endpoints actuales

| Ruta | Función | Módulo |
|---|---|---|
| `POST /api/cv/analyze` | `netlify/functions/cv-analyze.mts` | `modulos/cv-empleabilidad/server/handler.ts` |
| `POST /api/cv/enviar` | `netlify/functions/cv-enviar.mts` | `modulos/cv-empleabilidad/server/email.ts` |
| `/api/emergencia/*` | `netlify/functions/emergencia-api.mts` | `modulos/registro-emergencia/server/handler.ts` (ver su `docs/api.md`) |

Para agregar un endpoint de otro módulo: ponga la lógica en `modulos/<nombre>/server/` como un handler `Request → Response`, cree un wrapper delgado en `netlify/functions/` con `config.path = '/api/<nombre>/...'` y documente sus variables en `.env.example` y en esta tabla.
