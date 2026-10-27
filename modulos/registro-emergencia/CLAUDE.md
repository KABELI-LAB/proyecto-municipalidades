# Módulo registro-emergencia · "Registro de emergencia"

Responsable: Benjamín Alarcón.

Registro de hogares para emergencias de la Municipalidad de Hualañé. Antes de una emergencia, la familia se inscribe en un cuestionario breve, recibe su **Tarjeta Hogar Preparado** (código `FAM-XXXX-XX` + QR) y desbloquea beneficios. El día de la emergencia, un funcionario la encuentra por QR o RUT y registra las entregas. Brief completo: `RegistroDeEmergencia/registro-emergencia-brief.md` (fuera del repo).

## Estado actual (por hito del brief)

- **Hito 0 · Base: listo.** Módulo, esquema Supabase con RLS, seed ficticio, API `/api/emergencia/*` (función de Netlify + plugin de Vite), tests.
- **Hito 1 · Cuestionario (R2): listo.** Una pregunta por pantalla, avance automático, contadores, RUT en vivo, mapa Leaflet, condicionales, casa que se arma en vivo, barra de desbloqueo, guardado en sessionStorage, modo asistido (`?modo=asistido`), "Menos movimiento". **No** se pregunta la junta de vecinos (se guarda null).
- **Hito 2 · Tarjeta (R1, R3): listo.** Landing con tarjeta héroe y contador real, creación de hogar + consentimiento **obligatorio** (sin consentimiento no hay tarjeta; lo exigen la UI y el servidor) + código + QR, entrega animada, plan familiar, PNG y PDF.
- **Alcance (decisión del equipo):** el módulo solo **recopila** el registro de personas para emergencias. La vista del funcionario, la entrega de ayuda y la administración municipal las hará otro equipo. También quedan fuera juntas de vecinos, niveles, Mi hogar y termómetro de barrios.
- **Beneficios: por definir con el equipo.** La UI muestra `PorDefinir` en la landing, en R3 y en `/emergencia/beneficios`. Las tablas `beneficios` y `aliados` existen (con ejemplos del seed) pero ninguna pantalla las usa.
- **Pendiente:** R4 recordatorios, R5 edición de datos, R6 recuperar código, y endurecimiento (accesibilidad, e2e, rendimiento). Sus rutas muestran "Estamos preparando esta sección".
- WhatsApp usa `ConsoleProvider` (no envía nada): el proveedor real está pendiente de decisión.

## Arquitectura

- **Tablas** (`registro`): `hogares`, `sectores`, `consentimientos`, `tokens_acceso` (link personal a la tarjeta, guardado como hash), `recordatorios`; `beneficios` y `aliados` (por definir); apoyo: `configuracion`, `auditoria`, `limites`, `eventos_cuestionario`.
- **Datos:** esquema privado `registro` en Supabase (proyecto `hclrzxfpmowqdbjgpvrd`). **No se expone por la Data API**: `anon` y `authenticated` no tienen permisos; RLS activo sin políticas como defensa en profundidad. Solo el servidor conecta, con la variable `SUPABASEKEY` (o `DATABASE_URL`): cadena del pooler en modo transacción. Lectura y escritura verificadas el 27-10-2026.
- **Servidor** (`server/`): handler `Request → Response` (`handler.ts`), reglas (`servicio.ts`), repositorio Postgres (`repoPostgres.ts`) y en memoria (`repoMemoria.ts`, mismo contrato `repo.ts`). Sin `DATABASE_URL`, el dev server usa el repositorio en memoria con datos demo.
- **Compartido** (`shared/`): RUT, código familiar, celular, fechas es-CL, validación Zod, reglas de incentivos y plan familiar, contrato HTTP. Lo importan navegador y servidor.
- **UI** (`src/`): rutas anidadas bajo `/emergencia/*` (el sitio monta los módulos con `path/*`). La pestaña recibe `api` por props (por defecto HTTP).

## Mapa de archivos

| Ruta | Qué hace |
|---|---|
| `src/index.ts` | **API pública**: `RegistroEmergenciaTab`, `registroEmergenciaTabMeta`, `crearApiHttp` |
| `src/RegistroEmergenciaTab.tsx` | Rutas internas del módulo |
| `src/pantallas/` | `Landing` (R1), `Cuestionario` (R2), `Recompensa` (R3), `Beneficios` (por definir) |
| `src/componentes/` | `TarjetaHogar`, `CasaEnVivo`, controles (contador, opciones, RUT), `MapaUbicacion` (lazy), `PlanFamiliarVista`, `PorDefinir` |
| `src/lib/borrador.ts` | Estado del cuestionario → cuerpo de la inscripción |
| `src/lib/descargas.ts`, `planPdf.tsx` | Tarjeta PNG (canvas) y PDF (react-pdf, lazy) |
| `shared/contrato.ts` | Contrato HTTP. Cambiarlo obliga a actualizar servidor, repo en memoria y `docs/api.md` |
| `server/datosDemo.ts` | Datos ficticios (seed y repo en memoria) |
| `shared/tarjeta.ts` | Vigencia, nombre de la tarjeta y plan familiar |
| `supabase/migrations/` | Migraciones versionadas (aplicadas en Supabase vía MCP) |
| `supabase/seed.sql` | Generado por `npm run seed` (o `npm run seed -- 500` para 500 hogares). No editar a mano |

## Comandos (desde esta carpeta)

`npm run dev` (http://localhost:5175/emergencia) · `npm test` · `npm run typecheck` · `npm run lint` · `npm run seed`

## Convenciones del módulo

- Diseño: **solo** `@muni/design-system` (decisión del equipo: reemplaza la sección 9 del brief, que usaba el borrador de octubre). Trato de **tú**.
- La tarjeta mide su contenido en `cqw` (escala como objeto físico). El escudo va siempre original sobre placa blanca.
- **Privacidad:** el QR y las URLs nunca llevan datos personales. El token de "Mi hogar" va en el fragmento (`#t=`), que no llega a logs del servidor. Tokens guardados como SHA-256. Las respuestas de la API nunca incluyen RUT, WhatsApp ni datos sensibles. Los logs del servidor solo dicen ruta y tipo de error.
- Datos sensibles (discapacidad, embarazo, electrodependencia) son opcionales y **no** entran en reglas de beneficios ni nivel.
- RUT de prueba: cuerpos de 40 a 49 millones (fuera del rango de personas naturales). Nunca datos reales en seeds ni tests.
- `server/` y `shared/` se cargan con type stripping de Node: imports relativos **con extensión `.ts`**, sin `enum` ni parameter properties.
- Migración nueva: archivo en `supabase/migrations/` + aplicarla en Supabase + revisar advisors (seguridad y rendimiento). Desde Claude Code en VS Code, `apply_migration` con `drop` puede quedar rechazado: en ese caso se corre en el SQL Editor del panel.
