-- Integrantes del hogar: nombre y RUT de cada persona que vive en la casa,
-- además del jefe o jefa de hogar (que sigue en registro.hogares).
-- Un hogar puede no registrar integrantes: el cuestionario no los exige.

create table registro.integrantes (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references registro.hogares (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 2 and 120),
  -- Opcional: hay personas sin RUT (ej. extranjeras en trámite).
  rut text check (rut ~ '^[0-9]{7,8}-[0-9K]$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Traer los integrantes de un hogar.
create index integrantes_hogar on registro.integrantes (hogar_id);
-- Un mismo RUT no se repite dentro de un hogar. No es único en toda la base a
-- propósito: así nadie puede bloquear la inscripción de otra persona usando su RUT.
create unique index integrantes_rut_por_hogar on registro.integrantes (hogar_id, rut) where rut is not null;
-- Buscar en qué hogares aparece un RUT (revisión de duplicados).
create index integrantes_rut on registro.integrantes (rut) where rut is not null;

create trigger integrantes_updated_at before update on registro.integrantes
  for each row execute function registro.tocar_updated_at();

-- Igual que el resto del esquema: solo el backend (rol postgres) accede.
alter table registro.integrantes enable row level security;
revoke all on registro.integrantes from public, anon, authenticated;
