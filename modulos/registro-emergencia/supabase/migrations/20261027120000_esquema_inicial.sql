-- Registro de Emergencia · esquema inicial.
--
-- Todo vive en el esquema privado `registro`, que NO se expone por la Data API
-- de Supabase: el navegador nunca consulta estas tablas. Solo el backend
-- (funciones de Netlify, conexión Postgres con DATABASE_URL) las lee y escribe.
-- RLS queda activado en cada tabla, sin políticas, como defensa en profundidad.

create schema if not exists registro;
revoke all on schema registro from public, anon, authenticated;

create extension if not exists pgcrypto with schema extensions;

-- ── Tipos ────────────────────────────────────────────────────────────────────
create type registro.tenencia as enum ('propia', 'arrendada', 'cedida', 'allegados');
create type registro.origen_hogar as enum ('autorregistro', 'asistido', 'meson');
create type registro.estado_verificacion as enum ('pendiente', 'verificado');
create type registro.beneficio_estado as enum ('activo', 'pausado');
create type registro.alojamiento as enum ('vivienda', 'albergue', 'familiares', 'otro');
create type registro.categoria_beneficio as enum ('comercio', 'actividad', 'servicio_municipal', 'mascotas', 'capacitacion', 'barrio');
create type registro.tipo_aliado as enum ('comercio', 'institucion', 'empresa');
create type registro.tipo_hito as enum ('inscrito', 'mochila_lista', 'plan_practicado');
create type registro.rol_usuario as enum ('funcionario', 'admin', 'aliado');
create type registro.proposito_token as enum ('editar', 'mi_hogar');

-- ── Utilidades ───────────────────────────────────────────────────────────────
create function registro.tocar_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Territorio y configuración ───────────────────────────────────────────────
create table registro.sectores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  punto_encuentro_sugerido text,
  orden int not null default 0
);

create table registro.juntas_vecinos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sector_id uuid not null references registro.sectores (id),
  hogares_estimados int not null check (hogares_estimados > 0),
  meta_porcentaje int not null default 60 check (meta_porcentaje between 1 and 100),
  premio_descripcion text,
  unique (sector_id, nombre)
);
create index on registro.juntas_vecinos (sector_id);

create table registro.puntos_entrega (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  direccion text not null,
  sector_id uuid references registro.sectores (id),
  activo boolean not null default true
);
create index on registro.puntos_entrega (sector_id);

create table registro.items_ayuda (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  unidad text not null default 'unidad',
  activo boolean not null default true,
  orden int not null default 0
);

-- Plazos y parámetros editables desde el panel (ej. dias_segundo_aviso = 15).
create table registro.configuracion (
  clave text primary key,
  valor jsonb not null,
  descripcion text,
  updated_at timestamptz not null default now()
);

-- ── Hogares ──────────────────────────────────────────────────────────────────
create table registro.hogares (
  id uuid primary key default gen_random_uuid(),
  codigo_familiar text not null unique
    check (codigo_familiar ~ '^FAM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$'),
  jefe_nombre text not null check (length(trim(jefe_nombre)) between 2 and 120),
  jefe_rut text check (jefe_rut ~ '^[0-9]{7,8}-[0-9K]$'),
  id_provisorio text,
  whatsapp text not null check (whatsapp ~ '^\+569[0-9]{8}$'),
  sector_id uuid not null references registro.sectores (id),
  junta_vecinos_id uuid references registro.juntas_vecinos (id),
  tenencia registro.tenencia not null,
  direccion text not null,
  lat numeric(9, 6) check (lat between -90 and 90),
  lng numeric(9, 6) check (lng between -180 and 180),
  total_personas int not null check (total_personas >= 1),
  menores_18 int not null default 0 check (menores_18 >= 0),
  bebes_menores_2 int not null default 0 check (bebes_menores_2 >= 0),
  mayores_65 int not null default 0 check (mayores_65 >= 0),
  -- Datos sensibles: opcionales (null = no respondió) y nunca afectan beneficios.
  discapacidad_o_postrados int check (discapacidad_o_postrados >= 0),
  embarazada boolean,
  electrodependiente boolean,
  mascotas int not null default 0 check (mascotas >= 0),
  ganado_texto text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  punto_encuentro text,
  acepta_recordatorios boolean not null default false,
  origen registro.origen_hogar not null default 'autorregistro',
  estado_verificacion registro.estado_verificacion not null default 'pendiente',
  nivel int not null default 1 check (nivel between 1 and 3),
  beneficio_estado registro.beneficio_estado not null default 'activo',
  beneficio_vigente_hasta date not null,
  ultima_confirmacion_at timestamptz not null default now(),
  alojamiento_actual registro.alojamiento,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint hogares_identificacion check (jefe_rut is not null or id_provisorio is not null),
  constraint hogares_menores check (menores_18 <= total_personas),
  constraint hogares_bebes check (bebes_menores_2 <= menores_18),
  constraint hogares_mayores check (mayores_65 <= total_personas)
);
-- Un RUT activo por hogar (los borrados lógicamente esperan su purga).
create unique index hogares_jefe_rut_activo on registro.hogares (jefe_rut) where deleted_at is null;
create unique index hogares_id_provisorio_activo on registro.hogares (id_provisorio) where deleted_at is null;
create index on registro.hogares (sector_id);
create index on registro.hogares (junta_vecinos_id);
-- Job diario de recordatorios: hogares activos ordenados por vencimiento.
create index hogares_vencimiento on registro.hogares (beneficio_vigente_hasta) where deleted_at is null;
create trigger hogares_updated_at before update on registro.hogares
  for each row execute function registro.tocar_updated_at();

create table registro.consentimientos (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references registro.hogares (id) on delete cascade,
  version_texto text not null,
  texto_hash text not null,
  aceptado_at timestamptz not null default now(),
  ip text,
  user_agent text
);
create index on registro.consentimientos (hogar_id);

create table registro.tokens_acceso (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references registro.hogares (id) on delete cascade,
  token_hash text not null unique,
  proposito registro.proposito_token not null,
  expira_at timestamptz not null,
  usado_at timestamptz,
  created_at timestamptz not null default now()
);
create index on registro.tokens_acceso (hogar_id);

create table registro.hitos_hogar (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references registro.hogares (id) on delete cascade,
  tipo registro.tipo_hito not null,
  completado_at timestamptz not null default now(),
  evidencia text,
  unique (hogar_id, tipo)
);

create table registro.recordatorios (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references registro.hogares (id) on delete cascade,
  tipo text not null,
  enviado_at timestamptz not null default now(),
  estado_proveedor text,
  respuesta text,
  respondido_at timestamptz,
  mensaje_id_proveedor text unique
);
create index on registro.recordatorios (hogar_id, enviado_at desc);

-- ── Incentivos ───────────────────────────────────────────────────────────────
create table registro.aliados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo registro.tipo_aliado not null,
  direccion text,
  contacto text,
  logo_url text,
  activo boolean not null default true
);

create table registro.beneficios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion_corta text not null,
  condiciones text,
  aliado_id uuid references registro.aliados (id),
  categoria registro.categoria_beneficio not null,
  nivel_requerido int not null default 1 check (nivel_requerido between 1 and 3),
  cupos int check (cupos > 0),
  canjes_por_hogar int not null default 1 check (canjes_por_hogar >= 1),
  vigente_desde date not null default current_date,
  vigente_hasta date,
  imagen_url text,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  check (vigente_hasta is null or vigente_hasta >= vigente_desde)
);
create index on registro.beneficios (aliado_id);

create table registro.campanas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  inicio date not null,
  fin date not null,
  mensaje text,
  beneficio_destacado_id uuid references registro.beneficios (id),
  check (fin >= inicio)
);
create index on registro.campanas (beneficio_destacado_id);

-- ── Personal municipal ───────────────────────────────────────────────────────
-- auth_user_id se enlaza en el primer inicio de sesión (Supabase Auth) por correo.
create table registro.usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  email text not null unique check (email = lower(email)),
  nombre text not null,
  rol registro.rol_usuario not null,
  aliado_id uuid references registro.aliados (id),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  check (rol <> 'aliado' or aliado_id is not null)
);
create index on registro.usuarios (aliado_id);

create table registro.canjes (
  id uuid primary key default gen_random_uuid(),
  beneficio_id uuid not null references registro.beneficios (id),
  hogar_id uuid references registro.hogares (id) on delete set null,
  canjeado_at timestamptz not null default now(),
  canjeado_por uuid references registro.usuarios (id),
  codigo_validacion text not null unique
);
create index on registro.canjes (beneficio_id);
create index on registro.canjes (hogar_id);
create index on registro.canjes (canjeado_por);

-- ── Emergencia ───────────────────────────────────────────────────────────────
create table registro.entregas (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid references registro.hogares (id) on delete set null,
  punto_entrega_id uuid not null references registro.puntos_entrega (id),
  funcionario_id uuid references registro.usuarios (id),
  entregado_at timestamptz not null default now(),
  -- [{ "item_id": uuid, "nombre": text, "cantidad": int }]
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  retira_nombre text not null,
  retira_rut text,
  retira_es_jefe boolean not null default false,
  observacion text,
  created_offline boolean not null default false,
  sincronizado_at timestamptz
);
create index on registro.entregas (hogar_id, entregado_at desc);
create index on registro.entregas (punto_entrega_id);
create index on registro.entregas (funcionario_id);

-- ── Soporte ──────────────────────────────────────────────────────────────────
-- Borrador del cuestionario ligado a una sesión anónima; expira en 48 h.
create table registro.borradores (
  id uuid primary key default gen_random_uuid(),
  sesion_hash text not null unique,
  datos jsonb not null,
  expira_at timestamptz not null default now() + interval '48 hours'
);

create table registro.auditoria (
  id bigint generated always as identity primary key,
  actor_tipo text not null check (actor_tipo in ('ciudadano', 'funcionario', 'admin', 'aliado', 'sistema')),
  actor_id uuid,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  detalle jsonb,
  created_at timestamptz not null default now()
);
create index on registro.auditoria (entidad, entidad_id);
create index on registro.auditoria (created_at);

-- Ventanas de rate limit (R6, webhook, login, canjes). La clave nunca es un RUT
-- en claro: se guarda su hash.
create table registro.limites (
  clave text not null,
  ventana_inicio timestamptz not null,
  intentos int not null default 1,
  primary key (clave, ventana_inicio)
);

-- Métricas del cuestionario sin datos personales (abandono por paso).
create table registro.eventos_cuestionario (
  id bigint generated always as identity primary key,
  sesion_hash text not null,
  paso text not null,
  evento text not null check (evento in ('vista', 'completado', 'abandono', 'enviado')),
  created_at timestamptz not null default now()
);
create index on registro.eventos_cuestionario (paso, evento);

-- ── RLS: activado en todo, sin políticas (solo el backend con rol postgres) ──
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'registro' loop
    execute format('alter table registro.%I enable row level security', t);
    execute format('revoke all on registro.%I from public, anon, authenticated', t);
  end loop;
end;
$$;
revoke all on all functions in schema registro from public, anon, authenticated;
alter default privileges in schema registro revoke all on tables from public, anon, authenticated;
alter default privileges in schema registro revoke all on functions from public, anon, authenticated;

-- ── Configuración por defecto (plazos del brief, editables) ──────────────────
insert into registro.configuracion (clave, valor, descripcion) values
  ('meses_vigencia', '6', 'Meses de vigencia de la tarjeta desde la última confirmación'),
  ('dias_segundo_aviso', '15', 'Días sin respuesta antes del segundo aviso'),
  ('dias_pausa', '30', 'Días sin respuesta antes de pausar los beneficios'),
  ('horas_alerta_entrega', '24', 'Ventana para alertar entrega repetida del mismo ítem'),
  ('dias_purga', '30', 'Días entre el borrado lógico y la purga definitiva'),
  ('minimo_contador_landing', '50', 'Bajo este número no se muestra el contador de hogares'),
  ('minimo_barrio_publico', '10', 'Bajo este número de inscritos un barrio no se muestra en el termómetro');
