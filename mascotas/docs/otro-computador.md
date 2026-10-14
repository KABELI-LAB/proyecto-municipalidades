# Trabajar desde otro computador

Guía corta para retomar el proyecto en otro equipo. El sitio en Netlify, la
base de producción (Turso) e Instagram funcionan por su cuenta: no dependen
de ningún computador.

## Qué llevar

| Qué | Cómo |
| --- | --- |
| El código | Desde GitHub (recomendado) o la carpeta copiada (OneDrive, pendrive). |
| `.env` y `.env.produccion` | A mano y de forma segura. Nunca por correo, chat ni GitHub. |
| `node_modules`, `.next` | No se llevan: se regeneran. |
| `prisma/dev.db`, `almacen/` | Opcional: es la base y las fotos de prueba locales; se puede crear una nueva. |

La conversación con Claude no viaja con la carpeta (se guarda aparte, en
`%USERPROFILE%\.claude\`). No hace falta: `CLAUDE.md` y `docs/` explican el
proyecto a una conversación nueva.

## Requisitos

- Node.js 20 o superior.
- Git (para subir cambios).
- Claude Code (app de escritorio o terminal).

## Opción recomendada: trabajar en el repositorio

Así los cambios se suben con `git push` y Netlify se actualiza solo.

```bash
git clone https://github.com/KABELI-LAB/proyecto-municipalidades.git
cd proyecto-municipalidades
git checkout mascotas/plataforma-inicial
cd mascotas
```

Copia ahí `.env` y `.env.produccion`. Luego:

```bash
npm install
npm run demo:cargar
npm run dev
```

El portal queda en http://localhost:3000 y el panel en
http://localhost:3000/panel/ingresar (cuentas en `demo/datos/usuarios.json`,
contraseña `DEMO_CONTRASENA` del `.env`).

## Si copiaste la carpeta (OneDrive)

1. Descárgala a una carpeta local (no la abras directo desde la nube mientras
   corre el proyecto: la base local se puede dañar al sincronizar).
2. En esa carpeta: `npm install` y `npm run dev`.
3. Para subir cambios a GitHub, cópialos a la carpeta `mascotas/` del
   repositorio clonado (opción anterior) o trabaja directamente ahí.

## Reglas al subir

- Solo se trabaja en la rama `mascotas/plataforma-inicial` y en la carpeta
  `mascotas/` (el repositorio es compartido con otras áreas).
- Nunca se suben `.env`, `.env.produccion`, bases de datos ni `almacen/`
  (ya están en `.gitignore`).
- `main` no se toca sin revisión del equipo.
- Si un cambio trae una migración nueva, antes del push:
  `npm run db:migrar-turso` (usa `.env.produccion`).

## Comandos útiles

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Vista previa local |
| `npm test` | Pruebas |
| `npm run build` | Compilar como en Netlify |
| `npm run demo:cargar` | Cargar la demostración en la base local |
| `npm run db:migrar-turso` | Aplicar migraciones a la base de producción |
| `npm run demo:cargar-produccion` | Recargar la demostración en producción |

Despliegue y variables de Netlify: `docs/despliegue-netlify.md`.
