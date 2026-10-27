# Módulo registro-emergencia · "Registro de emergencia"

Responsable: Benjamín Alarcón.

Registro de hogares para emergencias de la Municipalidad de Hualañé. Antes de una emergencia, la familia se inscribe en un cuestionario breve, recibe su **Tarjeta Hogar Preparado** (código `FAM-XXXX-XX` + QR) y desbloquea beneficios. El día de la emergencia, un funcionario la encuentra por QR o RUT y registra las entregas. Brief completo: `RegistroDeEmergencia/registro-emergencia-brief.md` (fuera del repo).

## Estado actual (por hito del brief)

- **Hito 0 · Base: listo.** Módulo, esquema Supabase con RLS, seed ficticio, API `/api/emergencia/*` (función de Netlify + plugin de Vite), tests.
- **Hito 1 · Cuestionario (R2): listo.** Una pregunta por pantalla, avance automático, contadores, RUT en vivo, mapa Leaflet, condicionales, casa que se arma en vivo, barra de desbloqueo, guardado en sessionStorage, modo asistido (`?modo=asistido`), "Menos movimiento".
- **Hito 2 · Recompensa (R1, R3, B1): listo.** Landing con tarjeta héroe y contador real, creación de hogar + consentimiento + código + QR, entrega animada, beneficios desbloqueados/por desbloquear, plan familiar, PNG y PDF, catálogo con filtro.
- **Pendiente:** hito 3 (B2 Mi hogar, niveles, B3 barrios), 4 (R4 recordatorios, R5 edición, R6 recuperar), 5 (R7 funcionario), 6 (admin), 7 (endurecimiento). Sus rutas muestran "Estamos preparando esta sección".
- WhatsApp usa `ConsoleProvider` (no envía nada): el proveedor real está pendiente de decisión.

## Arquitectura

- **Datos:** esquema privado `registro` en Supabase (proyecto `hclrzxfpmowqdbjgpvrd`). **No se expone por la Data API**: `anon` y `authenticated` no tienen permisos; RLS activo sin políticas como defensa en profundidad. Solo el servidor conecta con `DATABASE_URL` (pooler, modo transacción).
- **Servidor** (`server/`): handler `Request → Response` (`handler.ts`), reglas (`servicio.ts`), repositorio Postgres (`repoPostgres.ts`) y en memoria (`repoMemoria.ts`, mismo contrato `repo.ts`). Sin `DATABASE_URL`, el dev server usa el repositorio en memoria con datos demo.
- **Compartido** (`shared/`): RUT, código familiar, celular, fechas es-CL, validación Zod, reglas de incentivos y plan familiar, contrato HTTP. Lo importan navegador y servidor.
- **UI** (`src/`): rutas anidadas bajo `/emergencia/*` (el sitio monta los módulos con `path/*`). La pestaña recibe `api` por props (por defecto HTTP).

## Mapa de archivos

| Ruta | Qué hace |
|---|---|
| `src/index.ts` | **API pública**: `RegistroEmergenciaTab`, `registroEmergenciaTabMeta`, `crearApiHttp` |
| `src/RegistroEmergenciaTab.tsx` | Rutas internas del módulo |
| `src/pantallas/` | `Landing` (R1), `Cuestionario` (R2), `Recompensa` (R3), `Beneficios` (B1) |
| `src/componentes/` | `TarjetaHogar`, `CasaEnVivo`, controles (contador, opciones, RUT), `MapaUbicacion` (lazy), `BeneficioTarjeta`, `PlanFamiliarVista` |
| `src/lib/borrador.ts` | Estado del cuestionario → cuerpo de la inscripción |
| `src/lib/descargas.ts`, `planPdf.tsx` | Tarjeta PNG (canvas) y PDF (react-pdf, lazy) |
| `shared/contrato.ts` | Contrato HTTP. Cambiarlo obliga a actualizar servidor, repo en memoria y `docs/api.md` |
| `server/datosDemo.ts` | Datos ficticios (seed y repo en memoria) |
| `supabase/migrations/` | Migraciones versionadas (aplicadas en Supabase vía MCP) |
| `supabase/seed.sql` | Generado por `npm run seed`. No editar a mano |

## Comandos (desde esta carpeta)

`npm run dev` (http://localhost:5175/emergencia) · `npm test` · `npm run typecheck` · `npm run lint` · `npm run seed`

## Convenciones del módulo

- Diseño: **solo** `@muni/design-system` (decisión del equipo: reemplaza la sección 9 del brief, que usaba el borrador de octubre). Trato de **tú**.
- La tarjeta mide su contenido en `cqw` (escala como objeto físico). El escudo va siempre original sobre placa blanca.
- **Privacidad:** el QR y las URLs nunca llevan datos personales. El token de "Mi hogar" va en el fragmento (`#t=`), que no llega a logs del servidor. Tokens guardados como SHA-256. Las respuestas de la API nunca incluyen RUT, WhatsApp ni datos sensibles. Los logs del servidor solo dicen ruta y tipo de error.
- Datos sensibles (discapacidad, embarazo, electrodependencia) son opcionales y **no** entran en reglas de beneficios ni nivel.
- RUT de prueba: cuerpos de 40 a 49 millones (fuera del rango de personas naturales). Nunca datos reales en seeds ni tests.
- `server/` y `shared/` se cargan con type stripping de Node: imports relativos **con extensión `.ts`**, sin `enum` ni parameter properties.
- Migración nueva: archivo en `supabase/migrations/` + aplicarla en Supabase + revisar advisors (seguridad y rendimiento).
