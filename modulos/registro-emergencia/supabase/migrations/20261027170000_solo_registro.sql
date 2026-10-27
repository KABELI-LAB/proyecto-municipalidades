-- Deja el esquema enfocado en recopilar el registro de personas para
-- emergencias. Fuera de este módulo (decisión del equipo, 27-10-2026): juntas
-- de vecinos, niveles, campañas, canjes, la entrega de ayuda y la vista de
-- funcionarios (la administración municipal la hará otro equipo).
-- Se mantienen beneficios y aliados para definirlos después.
-- Las tablas eliminadas solo tenían datos ficticios del seed.

-- ── Tablas fuera de alcance ──────────────────────────────────────────────────
-- Orden: primero las tablas que apuntan a otras (canjes y entregas → usuarios).
drop table registro.canjes;
drop table registro.entregas;
drop table registro.usuarios;
drop table registro.campanas;
drop table registro.puntos_entrega;
drop table registro.items_ayuda;
drop table registro.hitos_hogar;
drop table registro.borradores;

alter table registro.hogares drop column junta_vecinos_id;
drop table registro.juntas_vecinos;

-- ── Sin niveles ni datos del día de la emergencia ────────────────────────────
alter table registro.hogares drop column nivel;
alter table registro.hogares drop column alojamiento_actual;
alter table registro.beneficios drop column nivel_requerido;

-- La vigencia es de la tarjeta (datos confirmados en los últimos 6 meses),
-- no de beneficios: se renombra para que diga lo que es.
alter table registro.hogares rename column beneficio_estado to tarjeta_estado;
alter table registro.hogares rename column beneficio_vigente_hasta to tarjeta_vigente_hasta;
alter type registro.beneficio_estado rename to tarjeta_estado;
alter index registro.hogares_vencimiento rename to hogares_tarjeta_vencimiento;

-- ── Tipos y configuración sin uso ────────────────────────────────────────────
drop type registro.alojamiento;
drop type registro.tipo_hito;
drop type registro.rol_usuario;
delete from registro.configuracion where clave in ('horas_alerta_entrega', 'minimo_barrio_publico');
