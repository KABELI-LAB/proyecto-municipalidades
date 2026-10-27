/**
 * Repositorio sobre Supabase Postgres (esquema privado `registro`).
 * Conexión: DATABASE_URL del pooler de Supabase en modo transacción (puerto
 * 6543), por eso `prepare: false`. Solo el servidor tiene esta URL.
 */
import postgres from 'postgres'
import type { Beneficio, BarrioAvance, Territorio } from '../shared/contrato.ts'
import { DuplicadoError, type Campana, type EntradaAuditoria, type HogarFila, type NuevoHogar, type NuevoToken, type Repositorio } from './repo.ts'

type Sql = postgres.Sql

let compartida: Sql | null = null

/** Una conexión por instancia de función (se reutiliza entre invocaciones). */
export function conexion(url: string): Sql {
  compartida ??= postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10, ssl: 'require' })
  return compartida
}

export function crearRepoPostgres(sql: Sql): Repositorio {
  return {
    async territorio(): Promise<Territorio> {
      const [sectores, juntas] = await Promise.all([
        sql<Territorio['sectores']>`
          select id, nombre, punto_encuentro_sugerido as "puntoEncuentroSugerido"
          from registro.sectores order by orden, nombre`,
        sql<Territorio['juntas']>`
          select id, nombre, sector_id as "sectorId" from registro.juntas_vecinos order by nombre`,
      ])
      return { sectores: [...sectores], juntas: [...juntas] }
    },

    async configuracion() {
      const filas = await sql<{ clave: string; valor: unknown }[]>`select clave, valor from registro.configuracion`
      const config: Record<string, number> = {}
      for (const f of filas) if (typeof f.valor === 'number') config[f.clave] = f.valor
      return config
    },

    async contarHogares() {
      const [f] = await sql<{ n: number }[]>`select count(*)::int as n from registro.hogares where deleted_at is null`
      return f?.n ?? 0
    },

    async campanaVigente(hoy): Promise<Campana | null> {
      const [c] = await sql<Campana[]>`
        select nombre, mensaje, beneficio_destacado_id as "beneficioDestacadoId"
        from registro.campanas where ${hoy}::date between inicio and fin
        order by inicio desc limit 1`
      return c ?? null
    },

    async beneficiosActivos(hoy): Promise<Beneficio[]> {
      const filas = await sql<Beneficio[]>`
        select b.id, b.titulo, b.descripcion_corta as "descripcionCorta", b.condiciones,
               a.nombre as aliado, b.categoria, b.nivel_requerido as "nivelRequerido",
               case when b.cupos is null then null
                    else greatest(b.cupos - (select count(*) from registro.canjes c where c.beneficio_id = b.id), 0)::int
               end as "cuposRestantes",
               to_char(b.vigente_hasta, 'YYYY-MM-DD') as "vigenteHasta"
        from registro.beneficios b
        left join registro.aliados a on a.id = b.aliado_id and a.activo
        where b.activo and ${hoy}::date >= b.vigente_desde
          and (b.vigente_hasta is null or ${hoy}::date <= b.vigente_hasta)
        order by b.orden, b.titulo`
      return [...filas]
    },

    async avanceBarrios(): Promise<BarrioAvance[]> {
      const filas = await sql<BarrioAvance[]>`
        select j.id as "juntaId", j.nombre, s.nombre as sector,
               count(h.id)::int as inscritos, j.hogares_estimados as estimados,
               least(100, round(100.0 * count(h.id) / j.hogares_estimados))::int as porcentaje,
               j.meta_porcentaje as meta, j.premio_descripcion as premio,
               (100.0 * count(h.id) / j.hogares_estimados) >= j.meta_porcentaje as "superoMeta"
        from registro.juntas_vecinos j
        join registro.sectores s on s.id = j.sector_id
        left join registro.hogares h on h.junta_vecinos_id = j.id and h.deleted_at is null
        group by j.id, s.nombre`
      return [...filas]
    },

    async rutExiste(rut) {
      const [f] = await sql`select 1 from registro.hogares where jefe_rut = ${rut} and deleted_at is null limit 1`
      return Boolean(f)
    },

    async crearHogar(n: NuevoHogar) {
      const h = n.hogar
      try {
        return await sql.begin(async (tx) => {
          const [fila] = await tx<{ id: string }[]>`
            insert into registro.hogares (
              codigo_familiar, jefe_nombre, jefe_rut, id_provisorio, whatsapp, sector_id, junta_vecinos_id,
              tenencia, direccion, lat, lng, total_personas, menores_18, bebes_menores_2, mayores_65,
              discapacidad_o_postrados, embarazada, electrodependiente, mascotas, ganado_texto,
              contacto_emergencia_nombre, contacto_emergencia_telefono, punto_encuentro,
              acepta_recordatorios, origen, beneficio_vigente_hasta
            ) values (
              ${n.codigoFamiliar}, ${h.jefeNombre}, ${h.jefeRut}, ${n.idProvisorio}, ${h.whatsapp}, ${h.sectorId}, ${h.juntaVecinosId},
              ${h.tenencia}, ${h.direccion}, ${h.lat}, ${h.lng}, ${h.totalPersonas}, ${h.menores18}, ${h.bebesMenores2}, ${h.mayores65},
              ${h.discapacidadOPostrados}, ${h.embarazada}, ${h.electrodependiente}, ${h.mascotas}, ${h.ganadoTexto},
              ${h.contactoEmergenciaNombre}, ${h.contactoEmergenciaTelefono}, ${h.puntoEncuentro},
              ${n.aceptaRecordatorios}, ${n.origen}, ${n.vigenteHasta}
            ) returning id`
          const id = fila!.id
          await tx`
            insert into registro.consentimientos (hogar_id, version_texto, texto_hash, ip, user_agent)
            values (${id}, ${n.consentimiento.version}, ${n.consentimiento.hash}, ${n.consentimiento.ip}, ${n.consentimiento.userAgent})`
          await tx`insert into registro.hitos_hogar (hogar_id, tipo) values (${id}, 'inscrito')`
          return { id }
        })
      } catch (err) {
        if (err instanceof postgres.PostgresError && err.code === '23505') {
          if (err.constraint_name === 'hogares_codigo_familiar_key') throw new DuplicadoError('codigo')
          if (err.constraint_name === 'hogares_jefe_rut_activo') throw new DuplicadoError('rut')
        }
        throw err
      }
    },

    async guardarToken(t: NuevoToken) {
      await sql`
        insert into registro.tokens_acceso (hogar_id, token_hash, proposito, expira_at)
        values (${t.hogarId}, ${t.tokenHash}, ${t.proposito}, ${t.expiraAt})`
    },

    async hogarPorToken(tokenHash, proposito, ahora): Promise<HogarFila | null> {
      const [f] = await sql<HogarFila[]>`
        select h.id, h.codigo_familiar as "codigoFamiliar", h.jefe_nombre as "jefeNombre", h.nivel,
               h.beneficio_estado as "beneficioEstado", to_char(h.beneficio_vigente_hasta, 'YYYY-MM-DD') as "vigenteHasta",
               s.nombre as sector, s.punto_encuentro_sugerido as "puntoEncuentroSugerido", j.nombre as junta,
               h.direccion, h.total_personas as "totalPersonas", h.menores_18 as "menores18",
               h.bebes_menores_2 as "bebesMenores2", h.mayores_65 as "mayores65", h.mascotas,
               h.ganado_texto as "ganadoTexto", h.punto_encuentro as "puntoEncuentro",
               h.contacto_emergencia_nombre as "contactoEmergenciaNombre",
               h.contacto_emergencia_telefono as "contactoEmergenciaTelefono",
               coalesce((select json_agg(json_build_object('tipo', x.tipo, 'completadoAt', x.completado_at) order by x.completado_at)
                         from registro.hitos_hogar x where x.hogar_id = h.id), '[]') as hitos
        from registro.tokens_acceso t
        join registro.hogares h on h.id = t.hogar_id and h.deleted_at is null
        join registro.sectores s on s.id = h.sector_id
        left join registro.juntas_vecinos j on j.id = h.junta_vecinos_id
        where t.token_hash = ${tokenHash} and t.proposito = ${proposito}
          and t.expira_at > ${ahora} and t.usado_at is null`
      return f ?? null
    },

    async auditar(e: EntradaAuditoria) {
      await sql`
        insert into registro.auditoria (actor_tipo, actor_id, accion, entidad, entidad_id, detalle)
        values (${e.actorTipo}, ${e.actorId}, ${e.accion}, ${e.entidad}, ${e.entidadId}, ${e.detalle ? sql.json(e.detalle as postgres.JSONValue) : null})`
    },

    async registrarEventoCuestionario(sesionHash, paso, evento) {
      await sql`insert into registro.eventos_cuestionario (sesion_hash, paso, evento) values (${sesionHash}, ${paso}, ${evento})`
    },

    async contarIntento(clave, ventanaInicio) {
      const [f] = await sql<{ intentos: number }[]>`
        insert into registro.limites (clave, ventana_inicio) values (${clave}, ${ventanaInicio})
        on conflict (clave, ventana_inicio) do update set intentos = registro.limites.intentos + 1
        returning intentos`
      return f?.intentos ?? 1
    },
  }
}
