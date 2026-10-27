-- GENERADO por scripts/generar-seed.ts. Datos ficticios: no editar a mano.

insert into registro.sectores (id, nombre, punto_encuentro_sugerido, orden) values
  ('00000000-0000-4000-8000-000100000001', 'Hualañé urbano', 'Plaza de Armas de Hualañé', 0),
  ('00000000-0000-4000-8000-000100000002', 'La Huerta', 'Cancha de La Huerta', 1),
  ('00000000-0000-4000-8000-000100000003', 'Sector rural ribera norte', 'Escuela rural ribera norte', 2)
on conflict do nothing;

insert into registro.aliados (id, nombre, tipo, direccion) values
  ('00000000-0000-4000-8000-000400000001', 'Almacén Don Ficticio', 'comercio', 'Calle ficticia 210, Hualañé'),
  ('00000000-0000-4000-8000-000400000002', 'Panadería La Espiga (ficticia)', 'comercio', 'Calle ficticia 45, Hualañé'),
  ('00000000-0000-4000-8000-000400000003', 'Cuerpo de Bomberos (ejemplo)', 'institucion', 'Calle ficticia 1, Hualañé'),
  ('00000000-0000-4000-8000-000400000004', 'Ferretería El Clavo (ficticia)', 'comercio', 'Calle ficticia 330, Hualañé')
on conflict do nothing;

insert into registro.beneficios (id, titulo, descripcion_corta, condiciones, aliado_id, categoria, cupos, orden) values
  ('00000000-0000-4000-8000-000500000001', '10 % de descuento en tu compra', 'En productos de despensa, una vez al mes.', 'Beneficio de ejemplo: el catálogo real está por definir.', '00000000-0000-4000-8000-000400000001', 'comercio', null, 1),
  ('00000000-0000-4000-8000-000500000002', 'Pan amasado de regalo', 'Media docena al mostrar tu tarjeta.', 'Beneficio de ejemplo: el catálogo real está por definir.', '00000000-0000-4000-8000-000400000002', 'comercio', 100, 2),
  ('00000000-0000-4000-8000-000500000003', 'Prioridad en operativo de mascotas', 'Chip y vacuna antirrábica con hora reservada.', 'Beneficio de ejemplo: el catálogo real está por definir.', null, 'mascotas', 80, 3),
  ('00000000-0000-4000-8000-000500000004', 'Taller de primeros auxilios', 'Cupo reservado en el taller de la temporada.', 'Beneficio de ejemplo: el catálogo real está por definir.', '00000000-0000-4000-8000-000400000003', 'capacitacion', 40, 4)
on conflict do nothing;

insert into registro.hogares (id, codigo_familiar, jefe_nombre, jefe_rut, id_provisorio, whatsapp, sector_id, tenencia, direccion, total_personas, menores_18, bebes_menores_2, mayores_65, mascotas, ganado_texto, acepta_recordatorios, origen, estado_verificacion, tarjeta_vigente_hasta, ultima_confirmacion_at) values
  ('00000000-0000-4000-8000-000700000001', 'FAM-WVMB-5T', 'Rosa Simulada Modelo', '44168327-8', null, '+56900010000', '00000000-0000-4000-8000-000100000002', 'propia', 'Calle Larga 170, Hualañé', 5, 2, 0, 2, 0, null, true, 'asistido', 'verificado', '2026-11-29', '2026-05-29T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000002', 'FAM-66V7-99', 'Carmen Muestra Muestra', '41336937-1', null, '+56900010001', '00000000-0000-4000-8000-000100000003', 'cedida', 'Camino Interior 577, Hualañé', 6, 3, 0, 1, 1, null, true, 'autorregistro', 'pendiente', '2027-04-07', '2026-10-07T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000003', 'FAM-4J9D-SW', 'Valentina Prueba Ensayo', '43624222-0', null, '+56900010002', '00000000-0000-4000-8000-000100000002', 'cedida', 'Calle Nueva 16, Hualañé', 5, 1, 0, 0, 3, null, true, 'autorregistro', 'pendiente', '2026-12-29', '2026-06-29T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000004', 'FAM-FC2W-PR', 'Pedro Prueba Ficticia', '40286579-2', null, '+56900010003', '00000000-0000-4000-8000-000100000002', 'cedida', 'Pasaje Uno 499, Hualañé', 6, 1, 0, 0, 2, null, false, 'autorregistro', 'verificado', '2026-11-04', '2026-05-04T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000005', 'FAM-Z6TE-85', 'Vicente Modelo Modelo', '41861254-1', null, '+56900010004', '00000000-0000-4000-8000-000100000001', 'propia', 'Calle Larga 800, Hualañé', 4, 1, 0, 1, 1, null, true, 'autorregistro', 'pendiente', '2026-12-25', '2026-06-25T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000006', 'FAM-67EB-7S', 'Benjamín Ejemplo Ejemplo', '41350575-5', null, '+56900010005', '00000000-0000-4000-8000-000100000003', 'propia', 'Avenida Principal 267, Hualañé', 1, 0, 0, 0, 3, null, true, 'autorregistro', 'pendiente', '2027-03-09', '2026-09-09T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000007', 'FAM-YQV8-3R', 'Camila Muestra Prueba', '46180213-3', null, '+56900010006', '00000000-0000-4000-8000-000100000001', 'cedida', 'Calle Nueva 249, Hualañé', 5, 0, 0, 2, 3, '5 gallinas', true, 'autorregistro', 'verificado', '2026-11-06', '2026-05-06T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000008', 'FAM-DJMF-LJ', 'Carmen Ejemplo Ensayo', '45872894-1', null, '+56900010007', '00000000-0000-4000-8000-000100000003', 'arrendada', 'Camino Interior 941, Hualañé', 1, 0, 0, 1, 2, null, false, 'asistido', 'pendiente', '2026-11-10', '2026-05-10T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000009', 'FAM-5NRP-YV', 'Luis Ejemplo Modelo', '40784663-K', null, '+56900010008', '00000000-0000-4000-8000-000100000001', 'arrendada', 'Pasaje Dos 730, Hualañé', 3, 2, 0, 1, 3, null, true, 'autorregistro', 'pendiente', '2027-01-28', '2026-07-28T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000010', 'FAM-UTPJ-8P', 'Valentina Muestra Ensayo', '46631541-9', null, '+56900010009', '00000000-0000-4000-8000-000100000001', 'allegados', 'Pasaje Uno 195, Hualañé', 2, 0, 0, 0, 3, null, true, 'autorregistro', 'verificado', '2026-11-03', '2026-05-03T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000011', 'FAM-29J2-32', 'Benjamín Modelo Muestra', '42662689-6', null, '+56900010010', '00000000-0000-4000-8000-000100000001', 'cedida', 'Avenida Principal 541, Hualañé', 4, 2, 0, 1, 2, '3 gallinas', true, 'autorregistro', 'pendiente', '2027-01-15', '2026-07-15T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000012', 'FAM-5EAN-QR', 'Camila Ensayo Modelo', '42020019-6', null, '+56900010011', '00000000-0000-4000-8000-000100000001', 'propia', 'Avenida Principal 445, Hualañé', 2, 1, 0, 1, 1, null, true, 'autorregistro', 'pendiente', '2027-02-07', '2026-08-07T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000013', 'FAM-ALWV-AT', 'Constanza Ficticia Ficticia', '44799737-1', null, '+56900010012', '00000000-0000-4000-8000-000100000003', 'propia', 'Pasaje Dos 191, Hualañé', 1, 0, 0, 1, 3, null, false, 'autorregistro', 'verificado', '2027-02-11', '2026-08-11T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000014', 'FAM-WJSP-WB', 'Francisca Ejemplo Demostración', '46904310-K', null, '+56900010013', '00000000-0000-4000-8000-000100000002', 'arrendada', 'Calle Larga 123, Hualañé', 4, 1, 1, 0, 2, null, true, 'autorregistro', 'pendiente', '2027-02-19', '2026-08-19T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000015', 'FAM-APJ4-Y9', 'Francisca Simulada Muestra', '40729247-2', null, '+56900010014', '00000000-0000-4000-8000-000100000003', 'arrendada', 'Pasaje Dos 197, Hualañé', 4, 0, 0, 2, 1, null, true, 'asistido', 'pendiente', '2027-01-15', '2026-07-15T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000016', 'FAM-XFVH-HC', 'Benjamín Modelo Ensayo', '44103490-3', null, '+56900010015', '00000000-0000-4000-8000-000100000003', 'arrendada', 'Avenida Principal 215, Hualañé', 1, 0, 0, 0, 1, null, true, 'autorregistro', 'verificado', '2026-12-14', '2026-06-14T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000017', 'FAM-JKUB-Z5', 'Constanza Modelo Simulada', '42426510-1', null, '+56900010016', '00000000-0000-4000-8000-000100000002', 'arrendada', 'Calle Nueva 588, Hualañé', 4, 0, 0, 2, 3, null, true, 'autorregistro', 'pendiente', '2027-03-04', '2026-09-04T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000018', 'FAM-ZLNJ-HE', 'Matías Ficticia Ensayo', '41306991-2', null, '+56900010017', '00000000-0000-4000-8000-000100000003', 'arrendada', 'Calle Nueva 538, Hualañé', 1, 0, 0, 1, 2, '3 gallinas', true, 'autorregistro', 'pendiente', '2026-12-06', '2026-06-06T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000019', 'FAM-NDY7-NJ', 'Pedro Ficticia Demostración', '41565517-7', null, '+56900010018', '00000000-0000-4000-8000-000100000001', 'arrendada', 'Camino Interior 866, Hualañé', 2, 1, 0, 1, 2, null, true, 'autorregistro', 'verificado', '2026-11-24', '2026-05-24T17:10:46.221Z'),
  ('00000000-0000-4000-8000-000700000020', 'FAM-HS4Q-EG', 'Constanza Muestra Ensayo', null, 'PROV-DEMO-0020', '+56900010019', '00000000-0000-4000-8000-000100000003', 'cedida', 'Calle Larga 737, Hualañé', 5, 3, 1, 2, 3, '5 gallinas', false, 'autorregistro', 'pendiente', '2026-11-24', '2026-05-24T17:10:46.221Z')
on conflict do nothing;

insert into registro.consentimientos (hogar_id, version_texto, texto_hash, aceptado_at)
select h.id, 'demo', 'seed', h.ultima_confirmacion_at from registro.hogares h
where h.id::text like '00000000-0000-4000-8000-0007%'
  and not exists (select 1 from registro.consentimientos c where c.hogar_id = h.id);
