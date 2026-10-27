/**
 * Genera supabase/seed.sql con los datos FICTICIOS de server/datosDemo.ts:
 * 3 sectores, 6 juntas de vecinos, 2 puntos de entrega, 4 aliados,
 * 8 beneficios, 20 hogares, 1 admin y 2 funcionarios.
 *
 *   npm run seed     # luego aplicar el SQL en Supabase
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { datosDemo } from '../server/datosDemo.ts'

const { uuid, sectores, juntas, puntos, aliados, beneficios, usuarios, items, hogares } = datosDemo()

const q = (v: string | number | boolean | null): string =>
  v === null ? 'null' : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v)

const lineas: string[] = []
const insert = (tabla: string, cols: string[], filas: (string | number | boolean | null)[][]) => {
  lineas.push(`insert into registro.${tabla} (${cols.join(', ')}) values`)
  lineas.push(filas.map((f) => `  (${f.map(q).join(', ')})`).join(',\n') + '\non conflict do nothing;\n')
}

lineas.push('-- GENERADO por scripts/generar-seed.ts. Datos ficticios: no editar a mano.\n')
insert('sectores', ['id', 'nombre', 'punto_encuentro_sugerido', 'orden'], sectores.map((s, i) => [s.id, s.nombre, s.punto, i]))
insert(
  'juntas_vecinos',
  ['id', 'nombre', 'sector_id', 'hogares_estimados', 'meta_porcentaje', 'premio_descripcion'],
  juntas.map((j) => [j.id, j.nombre, sectores[j.sector]!.id, j.estimados, 60, j.premio]),
)
insert('puntos_entrega', ['id', 'nombre', 'direccion', 'sector_id'], puntos.map((p) => [p.id, p.nombre, p.direccion, sectores[p.sector]!.id]))
insert('items_ayuda', ['nombre', 'orden'], items.map((n, i) => [n, i]))
insert('aliados', ['id', 'nombre', 'tipo', 'direccion'], aliados.map((a) => [a.id, a.nombre, a.tipo, a.direccion]))
insert(
  'beneficios',
  ['id', 'titulo', 'descripcion_corta', 'condiciones', 'aliado_id', 'categoria', 'nivel_requerido', 'cupos', 'orden'],
  beneficios.map((b) => [
    b.id,
    b.titulo,
    b.desc,
    'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.',
    b.aliado === null ? null : aliados[b.aliado]!.id,
    b.cat,
    b.nivel,
    b.cupos,
    b.orden,
  ]),
)
lineas.push(
  `insert into registro.campanas (id, nombre, inicio, fin, mensaje, beneficio_destacado_id) values\n  (${q(uuid(8, 1))}, 'Temporada de incendios 2026', '2026-10-01', '2027-03-31', 'Prepárate antes del verano.', ${q(beneficios[0]!.id)})\non conflict do nothing;\n`,
)
insert('usuarios', ['id', 'email', 'nombre', 'rol'], usuarios.map((u) => [u.id, u.email, u.nombre, u.rol]))
insert(
  'hogares',
  [
    'id', 'codigo_familiar', 'jefe_nombre', 'jefe_rut', 'id_provisorio', 'whatsapp', 'sector_id', 'junta_vecinos_id',
    'tenencia', 'direccion', 'total_personas', 'menores_18', 'bebes_menores_2', 'mayores_65', 'mascotas', 'ganado_texto',
    'acepta_recordatorios', 'origen', 'estado_verificacion', 'nivel', 'beneficio_vigente_hasta', 'ultima_confirmacion_at',
  ],
  hogares.map((h) => [
    h.id, h.codigo, h.nombre, h.rut, h.provisorio, h.whatsapp, h.sector, h.junta, h.tenencia, h.direccion, h.total,
    h.menores, h.bebes, h.mayores, h.mascotas, h.ganado, h.recordatorios, h.origen,
    h.verificado ? 'verificado' : 'pendiente', h.nivel, h.vigente, h.confirmado,
  ]),
)
insert(
  'hitos_hogar',
  ['hogar_id', 'tipo', 'completado_at'],
  hogares.flatMap((h) => [
    [h.id, 'inscrito', h.confirmado],
    ...(h.nivel >= 2 ? [[h.id, 'mochila_lista', h.confirmado]] : []),
  ]),
)
insert(
  'consentimientos',
  ['hogar_id', 'version_texto', 'texto_hash', 'aceptado_at'],
  hogares.map((h) => [h.id, 'demo', 'seed', h.confirmado]),
)

const destino = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url))
writeFileSync(destino, lineas.join('\n'))
console.log(`Seed escrito en ${destino} (${hogares.length} hogares).`)
