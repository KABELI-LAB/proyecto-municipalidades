# Publicar en Netlify

El sitio se publica en Netlify, con la base de datos en **Turso** (SQLite en la
nube) y las fotos que suben los vecinos en **Netlify Blobs**. El proyecto vive en
una carpeta propia dentro del repositorio compartido de la municipalidad.

Nunca escriba tokens ni contraseñas en el código, en el repositorio ni en el
chat: van solo en las variables de entorno de Netlify y en `.env.produccion`
(que git no sube).

## 1. Base de datos en Turso (una vez)

1. Cree una cuenta en https://turso.tech y una base de datos (región más cercana:
   por ejemplo, São Paulo).
2. Copie su dirección (`libsql://…turso.io`) y cree un token de acceso.
3. En la carpeta del proyecto, cree el archivo `.env.produccion` con:

   ```
   MUNICIPIO="hualane"
   DATABASE_URL="libsql://…turso.io"
   DATABASE_AUTH_TOKEN="(su token)"
   DEMO_CONTRASENA="(contraseña de las cuentas de demostración)"
   ```

4. Cree las tablas y cargue la demostración:

   ```
   npm run db:migrar-turso
   npm run demo:cargar-produccion
   ```

   Cada vez que haya una migración nueva, vuelva a correr `npm run db:migrar-turso`.

## 2. Sitio en Netlify (una vez)

1. En Netlify: **Add new site → Import an existing project → GitHub**, y elija el
   repositorio compartido.
2. **Base directory:** la carpeta del proyecto dentro del repositorio. El resto
   (comando y carpeta de publicación) lo toma de `netlify.toml`.
3. **Variables de entorno** (Site configuration → Environment variables):

   | Variable | Valor |
   | --- | --- |
   | `MUNICIPIO` | `hualane` |
   | `DATABASE_URL` | la dirección `libsql://…` de Turso |
   | `DATABASE_AUTH_TOKEN` | el token de Turso |
   | `SESION_SECRETO` | una frase larga al azar (firma las sesiones del panel) |
   | `APP_URL` | la dirección del sitio en Netlify, por ejemplo `https://….netlify.app` |
   | `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN` | los de la cuenta de Instagram (opcional) |
   | `INSTAGRAM_APP_SECRET`, `META_APP_SECRET`, `INSTAGRAM_WEBHOOK_TOKEN` | para responder comentarios y mensajes (opcional; vea abajo) |
   | `BREVO_API_KEY` o `SMTP_…`, y `CORREO_REMITENTE` | para enviar correos (opcional) |
   | `AZURE_SPEECH_ENDPOINT`, `AZURE_SPEECH_KEY` (y `PAWNI_VOZ`, `PAWNI_VOZ_TONO`) | la voz de Pawni (opcional; sin ellas usa la voz del navegador) |
   | `OPENAI_API_KEY` (y `OPENAI_MODEL`, `OPENAI_BASE_URL` si es Azure) | para la inteligencia artificial (opcional; se enciende en Panel › Instagram) |

4. Publique (**Deploy**). Las fotos de los vecinos se guardan solas en Netlify Blobs.

## Respuestas automáticas en Instagram (opcional)

La plataforma puede responder comentarios y mensajes de Instagram con el enlace
que corresponde (el operativo, el aviso o la adopción). Para eso, Instagram
tiene que avisarle cada comentario y mensaje a una dirección del sitio (el
«webhook»). Se configura en Meta for Developers, en la app de Instagram:

1. **Permisos:** agrega `instagram_business_manage_comments` e
   `instagram_business_manage_messages` y genera un token nuevo con ellos
   (reemplaza `INSTAGRAM_ACCESS_TOKEN` en Netlify).
2. **Variables en Netlify:**
   - `INSTAGRAM_APP_SECRET`: la «Clave secreta de la aplicación de Instagram»
     (Casos de uso → API de Instagram → Configuración de la API).
   - `META_APP_SECRET` (opcional): la «Clave secreta de la aplicación» de Meta
     (Configuración de la app → Información básica). Se acepta cualquiera de las
     dos, porque Meta no precisa cuál firma los avisos.
   - `INSTAGRAM_WEBHOOK_TOKEN`: un texto que inventes, por ejemplo una frase
     larga al azar.
3. **Webhook** (Instagram → Configuración de la API → Webhooks):
   - URL de devolución: `https://<tu-sitio>.netlify.app/api/instagram/webhook`
   - Token de verificación: el mismo `INSTAGRAM_WEBHOOK_TOKEN`.
   - Suscribe los campos `comments` y `messages`, y activa la suscripción de
     la cuenta de Instagram de la municipalidad.
4. **Modo de la app:** Meta solo envía avisos con la app en modo **Live**; los
   comentarios exigen además **acceso avanzado** (revisión de la app) y la
   verificación del negocio. Mientras tanto, solo funcionan con las cuentas
   agregadas como probadoras. La cuenta de Instagram debe ser pública.
5. En el panel, **Instagram → Responder comentarios y mensajes** (administración).

Límites de Meta: una respuesta privada por comentario, hasta 7 días después; y
los mensajes directos se responden dentro de las 24 horas.

## 3. Actualizaciones

Cada cambio que se suba a la carpeta del proyecto en GitHub se publica solo. Si
el cambio trae una migración nueva, córrala antes con `npm run db:migrar-turso`.

## Velocidad

- **Misma región:** la base Turso está en São Paulo (`sa-east-1`). En Netlify,
  **Project configuration → Build & deploy → Functions → Region**, elija
  **São Paulo** (o la más cercana): cada consulta deja de cruzar el continente.
- **Fotos de la demo:** están en WebP (`demo/fotos/`) y al armar el sitio se
  copian a `public/fotos/`, así que se entregan como archivos estáticos desde
  la red de Netlify.
- **Caché del portal:** las cifras de la portada (retrato, impacto, mapa,
  collage) y la franja de demostración se guardan 60 segundos.

## Qué cambia respecto de este computador

- Ya no hace falta el túnel temporal: `APP_URL` es la dirección fija de Netlify y
  Instagram descarga las imágenes desde ahí.
- La base `prisma/dev.db` y la carpeta `almacen/` quedan solo en este computador.
