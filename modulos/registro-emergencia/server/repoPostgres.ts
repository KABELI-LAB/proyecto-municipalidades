/**
 * Repositorio sobre Supabase Postgres (esquema privado `registro`).
 * Conexión: cadena del pooler de Supabase en modo transacción (puerto 6543),
 * por eso `prepare: false`. Solo el servidor tiene esta URL.
 *
 * Con postgres-js a través del pooler, una conexión puede quedar muerta y una
 * consulta colgarse sin error (ver "Troubleshooting CONNECT_TIMEOUT or hanging
 * queries" en la documentación de Supabase). Por eso cada consulta tiene un
 * tiempo máximo: si se agota, la conexión se descarta y se abre otra. Las
 * lecturas se reintentan una vez; las escrituras no, para no duplicar datos.
 */
import postgres from 'postgres'
import type { Territorio } from '../shared/contrato.ts'
import { DuplicadoError, type EntradaAuditoria, type HogarFila, type NuevoHogar, type NuevoToken, type Repositorio } from './repo.ts'

type Sql = postgres.Sql
/** `max_pipeline` existe en postgres-js (src/index.js) pero no está en sus tipos. */
type OpcionesPostgres = NonNullable<Parameters<typeof postgres>[1]> & { max_pipeline?: number }

const TIEMPO_MAXIMO_MS = 8_000

/** La base no respondió a tiempo. El handler responde 503 con un mensaje para reintentar. */
export class TiempoAgotadoError extends Error {
  constructor() {
    super('la base no respondió a tiempo')
    this.name = 'TiempoAgotadoError'
  }
}

let compartida: { url: string; sql: Sql } | null = null

/** Un cliente por instancia de función (se reutiliza entre invocaciones). */
function cliente(url: string): Sql {
  if (compartida?.url !== url) {
    const opciones: OpcionesPostgres = {
      prepare: false,
      // Una consulta a la vez por conexión: el pooler en modo transacción no
      // tolera varias consultas encadenadas en la misma conexión (pipelining),
      // y quedaban colgadas hasta el statement timeout.
      max_pipeline: 1,
      max: 3,
      idle_timeout: 20,
      max_lifetime: 60 * 5,
      connect_timeout: 10,
      ssl: 'require',
    }
    compartida = { url, sql: postgres(url, opciones) }
  }
  return compartida.sql
}

/** Descarta el cliente actual (sus conexiones pueden estar muertas). */
function reiniciar(): void {
  const viejo = compartida?.sql
  compartida = null
  void viejo?.end({ timeout: 0 }).catch(() => undefined)
}

async function conTiempo<T>(url: string, consulta: (sql: Sql) => Promise<T>): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const limite = new Promise<never>((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new TiempoAgotadoError()), TIEMPO_MAXIMO_MS)
  })
  const promesa = consulta(cliente(url))
  // Si gana el tiempo máximo, el error tardío de la consulta no debe quedar sin atender
  // (en Node, un rechazo sin atender cierra el proceso).
  promesa.catch(() => undefined)
  try {
    return await Promise.race([promesa, limite])
  } catch (err) {
    if (err instanceof TiempoAgotadoError) reiniciar()
    throw err
  } finally {
    clearTimeout(temporizador)
  }
}

export function crearRepoPostgres(url: string): Repositorio {
  /** Lectura: si la conexión estaba muerta, se reintenta una vez con una nueva. */
  const leer = async <T>(consulta: (sql: Sql) => Promise<T>): Promise<T> => {
    try {
      return await conTiempo(url, consulta)
    } catch (err) {
      if (err instanceof TiempoAgotadoError) return conTiempo(url, consulta)
      throw err
    }
  }
  /** Escritura: sin reintento automático (podría haberse guardado igual). */
  const escribir = <T>(consulta: (sql: Sql) => Promise<T>): Promise<T> => conTiempo(url, consulta)

  return {
    territorio: () =>
      leer(async (sql) => {
        const sectores = await sql<Territorio['sectores']>`
          select id, nombre, punto_encuentro_sugerido as "puntoEncuentroSugerido"
          from registro.sectores order by orden, nombre`
        return { sectores: [...sectores] }
      }),

    configuracion: () =>
      leer(async (sql) => {
        const filas = await sql<{ clave: string; valor: unknown }[]>`select clave, valor from registro.configuracion`
        const config: Record<string, number> = {}
        for (const f of filas) if (typeof f.valor === 'number') config[f.clave] = f.valor
        return config
      }),

    contarHogares: () =>
      leer(async (sql) => {
        const [f] = await sql<{ n: number }[]>`select count(*)::int as n from registro.hogares where deleted_at is null`
        return f?.n ?? 0
      }),

    rutExiste: (rut) =>
      leer(async (sql) => {
        const [f] = await sql`select 1 from registro.hogares where jefe_rut = ${rut} and deleted_at is null limit 1`
        return Boolean(f)
      }),

    crearHogar: (n: NuevoHogar) =>
      escribir(async (sql) => {
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
      }),

    guardarToken: (t: NuevoToken) =>
      escribir(async (sql) => {
        await sql`
          insert into registro.tokens_acceso (hogar_id, token_hash, proposito, expira_at)
          values (${t.hogarId}, ${t.tokenHash}, ${t.proposito}, ${t.expiraAt})`
      }),

    hogarPorToken: (tokenHash, proposito, ahora) =>
      leer(async (sql) => {
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
      }),

    auditar: (e: EntradaAuditoria) =>
      escribir(async (sql) => {
        await sql`
          insert into registro.auditoria (actor_tipo, actor_id, accion, entidad, entidad_id, detalle)
          values (${e.actorTipo}, ${e.actorId}, ${e.accion}, ${e.entidad}, ${e.entidadId}, ${e.detalle ? sql.json(e.detalle as postgres.JSONValue) : null})`
      }),

    registrarEventoCuestionario: (sesionHash, paso, evento) =>
      escribir(async (sql) => {
        await sql`insert into registro.eventos_cuestionario (sesion_hash, paso, evento) values (${sesionHash}, ${paso}, ${evento})`
      }),

    contarIntento: (clave, ventanaInicio) =>
      escribir(async (sql) => {
        const [f] = await sql<{ intentos: number }[]>`
          insert into registro.limites (clave, ventana_inicio) values (${clave}, ${ventanaInicio})
          on conflict (clave, ventana_inicio) do update set intentos = registro.limites.intentos + 1
          returning intentos`
        return f?.intentos ?? 1
      }),
  }
}
