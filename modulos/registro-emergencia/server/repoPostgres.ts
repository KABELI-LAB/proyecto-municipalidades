/**
 * Repositorio sobre Supabase Postgres (esquema privado `registro`).
 * Conexión: DATABASE_URL del pooler de Supabase en modo transacción (puerto
 * 6543), por eso `prepare: false`. Solo el servidor tiene esta URL.
 */
import postgres from 'postgres'
import type { Territorio } from '../shared/contrato.ts'
import { DuplicadoError, type EntradaAuditoria, type HogarFila, type NuevoHogar, type NuevoToken, type Repositorio } from './repo.ts'

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
      const sectores = await sql<Territorio['sectores']>`
        select id, nombre, punto_encuentro_sugerido as "puntoEncuentroSugerido"
        from registro.sectores order by orden, nombre`
      return { sectores: [...sectores] }
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
              codigo_familiar, jefe_nombre, jefe_rut, id_provisorio, whatsapp, sector_id,
              tenencia, direccion, lat, lng, total_personas, menores_18, bebes_menores_2, mayores_65,
              discapacidad_o_postrados, embarazada, electrodependiente, mascotas, ganado_texto,
              contacto_emergencia_nombre, contacto_emergencia_telefono, punto_encuentro,
              acepta_recordatorios, origen, tarjeta_vigente_hasta
            ) values (
              ${n.codigoFamiliar}, ${h.jefeNombre}, ${h.jefeRut}, ${n.idProvisorio}, ${h.whatsapp}, ${h.sectorId},
              ${h.tenencia}, ${h.direccion}, ${h.lat}, ${h.lng}, ${h.totalPersonas}, ${h.menores18}, ${h.bebesMenores2}, ${h.mayores65},
              ${h.discapacidadOPostrados}, ${h.embarazada}, ${h.electrodependiente}, ${h.mascotas}, ${h.ganadoTexto},
              ${h.contactoEmergenciaNombre}, ${h.contactoEmergenciaTelefono}, ${h.puntoEncuentro},
              ${n.aceptaRecordatorios}, ${n.origen}, ${n.vigenteHasta}
            ) returning id`
          const id = fila!.id
          await tx`
            insert into registro.consentimientos (hogar_id, version_texto, texto_hash, ip, user_agent)
            values (${id}, ${n.consentimiento.version}, ${n.consentimiento.hash}, ${n.consentimiento.ip}, ${n.consentimiento.userAgent})`
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
        select h.id, h.codigo_familiar as "codigoFamiliar", h.jefe_nombre as "jefeNombre",
               h.tarjeta_estado as "tarjetaEstado", to_char(h.tarjeta_vigente_hasta, 'YYYY-MM-DD') as "vigenteHasta",
               s.nombre as sector, s.punto_encuentro_sugerido as "puntoEncuentroSugerido",
               h.direccion, h.total_personas as "totalPersonas", h.menores_18 as "menores18",
               h.bebes_menores_2 as "bebesMenores2", h.mayores_65 as "mayores65", h.mascotas,
               h.ganado_texto as "ganadoTexto", h.punto_encuentro as "puntoEncuentro",
               h.contacto_emergencia_nombre as "contactoEmergenciaNombre",
               h.contacto_emergencia_telefono as "contactoEmergenciaTelefono"
        from registro.tokens_acceso t
        join registro.hogares h on h.id = t.hogar_id and h.deleted_at is null
        join registro.sectores s on s.id = h.sector_id
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
