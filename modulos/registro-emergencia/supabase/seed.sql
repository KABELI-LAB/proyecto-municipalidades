-- GENERADO por scripts/generar-seed.ts. Datos ficticios: no editar a mano.

insert into registro.sectores (id, nombre, punto_encuentro_sugerido, orden) values
  ('00000000-0000-4000-8000-000100000001', 'Hualañé urbano', 'Plaza de Armas de Hualañé', 0),
  ('00000000-0000-4000-8000-000100000002', 'La Huerta', 'Cancha de La Huerta', 1),
  ('00000000-0000-4000-8000-000100000003', 'Sector rural ribera norte', 'Escuela rural ribera norte', 2)
on conflict do nothing;

insert into registro.juntas_vecinos (id, nombre, sector_id, hogares_estimados, meta_porcentaje, premio_descripcion) values
  ('00000000-0000-4000-8000-000200000001', 'Junta de vecinos Villa Los Aromos', '00000000-0000-4000-8000-000100000001', 40, 60, 'Señalética de evacuación para la villa'),
  ('00000000-0000-4000-8000-000200000002', 'Junta de vecinos Población Centro', '00000000-0000-4000-8000-000100000001', 60, 60, 'Caja comunitaria de emergencia'),
  ('00000000-0000-4000-8000-000200000003', 'Junta de vecinos El Molino', '00000000-0000-4000-8000-000100000002', 30, 60, 'Mejora de la plaza del sector'),
  ('00000000-0000-4000-8000-000200000004', 'Junta de vecinos Las Viñas', '00000000-0000-4000-8000-000100000002', 25, 60, 'Nuevas luminarias en el pasaje principal'),
  ('00000000-0000-4000-8000-000200000005', 'Junta de vecinos Ribera Alta', '00000000-0000-4000-8000-000100000003', 20, 60, 'Caja comunitaria de emergencia'),
  ('00000000-0000-4000-8000-000200000006', 'Junta de vecinos Los Canales', '00000000-0000-4000-8000-000100000003', 15, 60, 'Señalética de evacuación')
on conflict do nothing;

insert into registro.puntos_entrega (id, nombre, direccion, sector_id) values
  ('00000000-0000-4000-8000-000300000001', 'Gimnasio municipal', 'Calle ficticia 100, Hualañé', '00000000-0000-4000-8000-000100000001'),
  ('00000000-0000-4000-8000-000300000002', 'Sede social La Huerta', 'Camino ficticio s/n, La Huerta', '00000000-0000-4000-8000-000100000002')
on conflict do nothing;

insert into registro.items_ayuda (nombre, orden) values
  ('Agua embotellada', 0),
  ('Caja de alimentos', 1),
  ('Kit de higiene', 2),
  ('Frazada', 3),
  ('Colchón', 4),
  ('Pañales', 5),
  ('Alimento para mascotas', 6)
on conflict do nothing;

insert into registro.aliados (id, nombre, tipo, direccion) values
  ('00000000-0000-4000-8000-000400000001', 'Almacén Don Ficticio', 'comercio', 'Calle ficticia 210, Hualañé'),
  ('00000000-0000-4000-8000-000400000002', 'Panadería La Espiga (ficticia)', 'comercio', 'Calle ficticia 45, Hualañé'),
  ('00000000-0000-4000-8000-000400000003', 'Cuerpo de Bomberos (ejemplo)', 'institucion', 'Calle ficticia 1, Hualañé'),
  ('00000000-0000-4000-8000-000400000004', 'Ferretería El Clavo (ficticia)', 'comercio', 'Calle ficticia 330, Hualañé')
on conflict do nothing;

insert into registro.beneficios (id, titulo, descripcion_corta, condiciones, aliado_id, categoria, nivel_requerido, cupos, orden) values
  ('00000000-0000-4000-8000-000500000001', '10 % de descuento en tu compra', 'En productos de despensa, una vez al mes.', 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.', '00000000-0000-4000-8000-000400000001', 'comercio', 1, null, 1),
  ('00000000-0000-4000-8000-000500000002', 'Pan amasado de regalo', 'Media docena al mostrar tu tarjeta.', 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.', '00000000-0000-4000-8000-000400000002', 'comercio', 1, 100, 2),
  ('00000000-0000-4000-8000-000500000003', 'Prioridad en operativo de mascotas', 'Chip y vacuna antirrábica con hora reservada.', 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.', null, 'mascotas', 1, 80, 3),
  ('00000000-0000-4000-8000-000500000004', 'Taller de primeros auxilios', 'Cupo reservado en el taller de la temporada.', 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.', '00000000-0000-4000-8000-000400000003', 'capacitacion', 1, 40, 4),
  ('00000000-0000-4000-8000-000500000005', 'Entrada a actividades municipales', 'Acceso preferente a eventos con cupo.', 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.', null, 'actividad', 1, null, 5),
  ('00000000-0000-4000-8000-000500000006', '15 % en artículos de emergencia', 'Linternas, pilas y extintores.', 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.', '00000000-0000-4000-8000-000400000004', 'comercio', 2, null, 6),
  ('00000000-0000-4000-8000-000500000007', 'Visita de revisión de tu casa', 'Bomberos revisa riesgos de incendio en tu casa.', 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.', '00000000-0000-4000-8000-000400000003', 'servicio_municipal', 3, 20, 7),
  ('00000000-0000-4000-8000-000500000008', 'Premio para tu barrio', 'Si tu junta llega a la meta, el barrio gana su premio.', 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.', null, 'barrio', 1, null, 8)
on conflict do nothing;

insert into registro.campanas (id, nombre, inicio, fin, mensaje, beneficio_destacado_id) values
  ('00000000-0000-4000-8000-000800000001', 'Temporada de incendios 2026', '2026-10-01', '2027-03-31', 'Prepárate antes del verano.', '00000000-0000-4000-8000-000500000001')
on conflict do nothing;

insert into registro.usuarios (id, email, nombre, rol) values
  ('00000000-0000-4000-8000-000600000001', 'admin.demo@example.cl', 'Administración (demo)', 'admin'),
  ('00000000-0000-4000-8000-000600000002', 'funcionaria.demo@example.cl', 'Funcionaria demo', 'funcionario'),
  ('00000000-0000-4000-8000-000600000003', 'funcionario.demo@example.cl', 'Funcionario demo', 'funcionario')
on conflict do nothing;

insert into registro.hogares (id, codigo_familiar, jefe_nombre, jefe_rut, id_provisorio, whatsapp, sector_id, junta_vecinos_id, tenencia, direccion, total_personas, menores_18, bebes_menores_2, mayores_65, mascotas, ganado_texto, acepta_recordatorios, origen, estado_verificacion, nivel, beneficio_vigente_hasta, ultima_confirmacion_at) values
  ('00000000-0000-4000-8000-000700000001', 'FAM-VMB5-T8', 'Rosa Modelo Muestra', '44168327-8', null, '+56900001000', '00000000-0000-4000-8000-000100000003', '00000000-0000-4000-8000-000200000005', 'propia', 'Calle Larga 170, Hualañé', 4, 3, 1, 0, 0, null, true, 'asistido', 'verificado', 2, '2027-03-10', '2026-09-10T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000002', 'FAM-6V79-98', 'Tomás Muestra Ensayo', '41336937-1', null, '+56900001001', '00000000-0000-4000-8000-000100000003', '00000000-0000-4000-8000-000200000006', 'cedida', 'Camino Interior 577, Hualañé', 5, 2, 0, 0, 1, null, true, 'autorregistro', 'pendiente', 1, '2026-12-20', '2026-06-20T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000003', 'FAM-4J9D-SW', 'Valentina Prueba Ensayo', '43624222-0', null, '+56900001002', '00000000-0000-4000-8000-000100000003', '00000000-0000-4000-8000-000200000005', 'arrendada', 'Camino Interior 804, Hualañé', 2, 0, 0, 1, 0, null, false, 'autorregistro', 'pendiente', 1, '2026-12-29', '2026-06-29T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000004', 'FAM-FC2W-PR', 'Pedro Prueba Ficticia', '46713812-K', null, '+56900001003', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000001', 'cedida', 'Calle Nueva 45, Hualañé', 6, 1, 0, 0, 1, null, false, 'autorregistro', 'verificado', 1, '2026-11-04', '2026-05-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000005', 'FAM-Z6TE-85', 'Vicente Modelo Modelo', '48109658-8', null, '+56900001004', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000002', 'propia', 'Pasaje Uno 445, Hualañé', 4, 1, 0, 1, 3, null, true, 'autorregistro', 'pendiente', 1, '2026-12-25', '2026-06-25T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000006', 'FAM-67EB-7S', 'Benjamín Ejemplo Ejemplo', '47678246-5', null, '+56900001005', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000001', 'allegados', 'Pasaje Uno 917, Hualañé', 1, 0, 0, 0, 1, null, false, 'autorregistro', 'pendiente', 2, '2027-03-09', '2026-09-09T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000007', 'FAM-YQV8-3R', 'Camila Muestra Prueba', '40993985-6', null, '+56900001006', '00000000-0000-4000-8000-000100000002', '00000000-0000-4000-8000-000200000004', 'propia', 'Camino Interior 812, Hualañé', 5, 0, 0, 2, 0, null, true, 'autorregistro', 'verificado', 1, '2026-11-06', '2026-05-06T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000008', 'FAM-TDJM-FL', 'Valentina Modelo Ejemplo', '46567825-9', null, '+56900001007', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000001', 'cedida', 'Avenida Principal 411, Hualañé', 4, 0, 0, 0, 2, null, true, 'asistido', 'pendiente', 1, '2027-02-09', '2026-08-09T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000009', 'FAM-5N5N-RP', 'Benjamín Muestra Simulada', '47627961-5', null, '+56900001008', '00000000-0000-4000-8000-000100000003', '00000000-0000-4000-8000-000200000006', 'propia', 'Avenida Principal 332, Hualañé', 1, 0, 0, 1, 1, null, true, 'autorregistro', 'pendiente', 1, '2026-10-16', '2026-04-16T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000010', 'FAM-3UTP-J8', 'Joaquín Demostración Muestra', '47521593-1', null, '+56900001009', '00000000-0000-4000-8000-000100000003', '00000000-0000-4000-8000-000200000005', 'cedida', 'Pasaje Uno 927, Hualañé', 4, 2, 0, 0, 0, '6 gallinas', true, 'autorregistro', 'verificado', 1, '2027-03-03', '2026-09-03T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000011', 'FAM-29J2-32', 'Benjamín Modelo Muestra', '43867780-1', null, '+56900001010', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000002', 'propia', 'Camino Interior 925, Hualañé', 4, 2, 0, 1, 2, null, true, 'autorregistro', 'pendiente', 2, '2027-01-15', '2026-07-15T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000012', 'FAM-TA5E-AN', 'Benjamín Muestra Ficticia', '42656925-6', null, '+56900001011', '00000000-0000-4000-8000-000100000002', '00000000-0000-4000-8000-000200000003', 'cedida', 'Avenida Principal 197, Hualañé', 2, 0, 0, 2, 0, null, true, 'autorregistro', 'pendiente', 1, '2026-10-20', '2026-04-20T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000013', 'FAM-4ALW-VA', 'Valentina Ejemplo Ficticia', '42836674-3', null, '+56900001012', '00000000-0000-4000-8000-000100000003', '00000000-0000-4000-8000-000200000006', 'propia', 'Avenida Principal 229, Hualañé', 2, 1, 1, 0, 1, '6 gallinas', true, 'autorregistro', 'verificado', 1, '2026-12-04', '2026-06-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000014', 'FAM-WJSP-WB', 'Francisca Ejemplo Demostración', '48156649-5', null, '+56900001013', '00000000-0000-4000-8000-000100000003', '00000000-0000-4000-8000-000200000005', 'cedida', 'Calle Larga 426, Hualañé', 4, 1, 1, 0, 0, null, false, 'autorregistro', 'pendiente', 1, '2027-02-19', '2026-08-19T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000015', 'FAM-APJ4-Y9', 'Francisca Simulada Muestra', '45879591-6', null, '+56900001014', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000001', 'allegados', 'Calle Larga 187, Hualañé', 4, 0, 0, 2, 0, null, true, 'asistido', 'pendiente', 1, '2027-01-15', '2026-07-15T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000016', 'FAM-XFVH-HC', 'Benjamín Modelo Ensayo', '41471311-4', null, '+56900001015', '00000000-0000-4000-8000-000100000002', '00000000-0000-4000-8000-000200000003', 'cedida', 'Calle Larga 930, Hualañé', 1, 0, 0, 0, 0, null, true, 'autorregistro', 'verificado', 2, '2026-12-14', '2026-06-14T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000017', 'FAM-JKUB-Z5', 'Constanza Modelo Simulada', '44391816-7', null, '+56900001016', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000002', 'arrendada', 'Calle Larga 712, Hualañé', 4, 0, 0, 2, 2, null, true, 'autorregistro', 'pendiente', 1, '2027-03-04', '2026-09-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000018', 'FAM-ZLNJ-HE', 'Matías Ficticia Ensayo', '42972035-4', null, '+56900001017', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000001', 'cedida', 'Calle Larga 752, Hualañé', 1, 0, 0, 1, 2, null, true, 'autorregistro', 'pendiente', 1, '2026-12-06', '2026-06-06T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000019', 'FAM-49ND-Y7', 'Pedro Ficticia Modelo', '43183806-0', null, '+56900001018', '00000000-0000-4000-8000-000100000001', '00000000-0000-4000-8000-000200000002', 'propia', 'Calle Larga 143, Hualañé', 1, 0, 0, 1, 1, null, false, 'autorregistro', 'verificado', 1, '2026-12-05', '2026-06-05T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000020', 'FAM-Z79H-S4', 'Luis Ejemplo Modelo', null, 'PROV-DEMO-0020', '+56900001019', '00000000-0000-4000-8000-000100000003', '00000000-0000-4000-8000-000200000005', 'propia', 'Camino Interior 641, Hualañé', 3, 0, 0, 2, 3, null, true, 'autorregistro', 'pendiente', 1, '2026-11-16', '2026-05-16T15:46:23.235Z')
on conflict do nothing;

insert into registro.hitos_hogar (hogar_id, tipo, completado_at) values
  ('00000000-0000-4000-8000-000700000001', 'inscrito', '2026-09-10T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000001', 'mochila_lista', '2026-09-10T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000002', 'inscrito', '2026-06-20T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000003', 'inscrito', '2026-06-29T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000004', 'inscrito', '2026-05-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000005', 'inscrito', '2026-06-25T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000006', 'inscrito', '2026-09-09T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000006', 'mochila_lista', '2026-09-09T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000007', 'inscrito', '2026-05-06T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000008', 'inscrito', '2026-08-09T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000009', 'inscrito', '2026-04-16T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000010', 'inscrito', '2026-09-03T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000011', 'inscrito', '2026-07-15T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000011', 'mochila_lista', '2026-07-15T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000012', 'inscrito', '2026-04-20T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000013', 'inscrito', '2026-06-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000014', 'inscrito', '2026-08-19T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000015', 'inscrito', '2026-07-15T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000016', 'inscrito', '2026-06-14T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000016', 'mochila_lista', '2026-06-14T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000017', 'inscrito', '2026-09-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000018', 'inscrito', '2026-06-06T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000019', 'inscrito', '2026-06-05T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000020', 'inscrito', '2026-05-16T15:46:23.235Z')
on conflict do nothing;

insert into registro.consentimientos (hogar_id, version_texto, texto_hash, aceptado_at) values
  ('00000000-0000-4000-8000-000700000001', 'demo', 'seed', '2026-09-10T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000002', 'demo', 'seed', '2026-06-20T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000003', 'demo', 'seed', '2026-06-29T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000004', 'demo', 'seed', '2026-05-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000005', 'demo', 'seed', '2026-06-25T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000006', 'demo', 'seed', '2026-09-09T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000007', 'demo', 'seed', '2026-05-06T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000008', 'demo', 'seed', '2026-08-09T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000009', 'demo', 'seed', '2026-04-16T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000010', 'demo', 'seed', '2026-09-03T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000011', 'demo', 'seed', '2026-07-15T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000012', 'demo', 'seed', '2026-04-20T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000013', 'demo', 'seed', '2026-06-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000014', 'demo', 'seed', '2026-08-19T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000015', 'demo', 'seed', '2026-07-15T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000016', 'demo', 'seed', '2026-06-14T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000017', 'demo', 'seed', '2026-09-04T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000018', 'demo', 'seed', '2026-06-06T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000019', 'demo', 'seed', '2026-06-05T15:46:23.235Z'),
  ('00000000-0000-4000-8000-000700000020', 'demo', 'seed', '2026-05-16T15:46:23.235Z')
on conflict do nothing;
