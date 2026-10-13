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
   | `BREVO_API_KEY` o `SMTP_…`, y `CORREO_REMITENTE` | para enviar correos (opcional) |

4. Publique (**Deploy**). Las fotos de los vecinos se guardan solas en Netlify Blobs.

## 3. Actualizaciones

Cada cambio que se suba a la carpeta del proyecto en GitHub se publica solo. Si
el cambio trae una migración nueva, córrala antes con `npm run db:migrar-turso`.

## Qué cambia respecto de este computador

- Ya no hace falta el túnel temporal: `APP_URL` es la dirección fija de Netlify y
  Instagram descarga las imágenes desde ahí.
- La base `prisma/dev.db` y la carpeta `almacen/` quedan solo en este computador.
