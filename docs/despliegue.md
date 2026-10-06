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

   `VITE_CV_API_URL=/api` ya viene en `netlify.toml` (no es secreto).
4. Haga un deploy y pruebe la pestaña "Revisa tu CV": el aviso bajo la zona de carga debe mencionar el servicio de inteligencia artificial y no debe aparecer el banner "Modo demostración".

## Desarrollo local con IA

```bash
cp .env.example .env     # luego complete los valores en su editor
npm run dev              # el plugin de Vite sirve /api/cv/analyze
```

Sin `.env` (o sin `VITE_CV_API_URL`), el módulo de CV usa el analizador simulado: así se puede desarrollar sin acceso a la clave.

## Endpoints actuales

| Ruta | Función | Módulo |
|---|---|---|
| `POST /api/cv/analyze` | `netlify/functions/cv-analyze.mts` | `modulos/cv-empleabilidad/server/` |

Para agregar un endpoint de otro módulo: ponga la lógica en `modulos/<nombre>/server/` como un handler `Request → Response`, cree un wrapper delgado en `netlify/functions/` con `config.path = '/api/<nombre>/...'` y documente sus variables en `.env.example` y en esta tabla.
