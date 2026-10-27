/**
 * Genera supabase/seed.sql con los datos FICTICIOS de server/datosDemo.ts:
 * 3 sectores, aliados y beneficios de ejemplo, y N hogares (20 por defecto),
 * cada uno con su consentimiento.
 *
 *   npm run seed            # 20 hogares
 *   npm run seed -- 500     # 500 hogares
 *
 * El SQL usa `on conflict do nothing`: se puede aplicar sobre una base con datos.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { datosDemo } from '../server/datosDemo.ts'

const cantidad = Number(process.argv[2] ?? 20)
if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 50_000) {
  console.error('Indica una cantidad de hogares entre 1 y 50000, ej. npm run seed -- 500')
  process.exit(1)
}

const { sectores, aliados, beneficios, hogares } = datosDemo(new Date(), cantidad)

const q = (v: string | number | boolean | null): string =>
  v === null ? 'null' : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v)

const lineas: string[] = ['-- GENERADO por scripts/generar-seed.ts. Datos ficticios: no editar a mano.\n']
const insert = (tabla: string, cols: string[], filas: (string | number | boolean | null)[][]) => {
  // Lotes de 500 filas para no armar una sola sentencia gigante.
  for (let i = 0; i < filas.length; i += 500) {
    lineas.push(`insert into registro.${tabla} (${cols.join(', ')}) values`)
    lineas.push(filas.slice(i, i + 500).map((f) => `  (${f.map(q).join(', ')})`).join(',\n') + '\non conflict do nothing;\n')
  }
}

insert('sectores', ['id', 'nombre', 'punto_encuentro_sugerido', 'orden'], sectores.map((s, i) => [s.id, s.nombre, s.punto, i]))
insert('aliados', ['id', 'nombre', 'tipo', 'direccion'], aliados.map((a) => [a.id, a.nombre, a.tipo, a.direccion]))
insert(
  'beneficios',
  ['id', 'titulo', 'descripcion_corta', 'condiciones', 'aliado_id', 'categoria', 'cupos', 'orden'],
  beneficios.map((b) => [
    b.id,
    b.titulo,
    b.desc,
    'Beneficio de ejemplo: el catálogo real está por definir.',
    b.aliado === null ? null : aliados[b.aliado]!.id,
    b.cat,
    b.cupos,
    b.orden,
  ]),
)
insert(
  'hogares',
  [
    'id', 'codigo_familiar', 'jefe_nombre', 'jefe_rut', 'id_provisorio', 'whatsapp', 'sector_id',
    'tenencia', 'direccion', 'total_personas', 'menores_18', 'bebes_menores_2', 'mayores_65', 'mascotas', 'ganado_texto',
    'acepta_recordatorios', 'origen', 'estado_verificacion', 'tarjeta_vigente_hasta', 'ultima_confirmacion_at',
  ],
  hogares.map((h) => [
    h.id, h.codigo, h.nombre, h.rut, h.provisorio, h.whatsapp, h.sector, h.tenencia, h.direccion, h.total,
    h.menores, h.bebes, h.mayores, h.mascotas, h.ganado, h.recordatorios, h.origen,
    h.verificado ? 'verificado' : 'pendiente', h.vigente, h.confirmado,
  ]),
)
// Un consentimiento por hogar, solo si aún no tiene (el seed se puede aplicar dos veces).
lineas.push(`insert into registro.consentimientos (hogar_id, version_texto, texto_hash, aceptado_at)
select h.id, 'demo', 'seed', h.ultima_confirmacion_at from registro.hogares h
where h.id::text like '00000000-0000-4000-8000-0007%'
  and not exists (select 1 from registro.consentimientos c where c.hogar_id = h.id);
`)

const destino = fileURLToPath(new URL('../supabase/seed.sql', import.meta.url))
writeFileSync(destino, lineas.join('\n'))
console.log(`Seed escrito en ${destino} (${hogares.length} hogares).`)
