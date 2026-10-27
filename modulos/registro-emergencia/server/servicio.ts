/**
 * Reglas de negocio del registro (independientes del transporte HTTP y de la base).
 */
import { generarCodigoFamiliar } from '../shared/codigo.ts'
import type { InscripcionCreada, MiHogar, ResumenPublico } from '../shared/contrato.ts'
import type { Inscripcion } from '../shared/esquemas.ts'
import { diaSantiago } from '../shared/fechas.ts'
import { generarPlanFamiliar, nombreTarjeta, vigenteHasta } from '../shared/incentivos.ts'
import { CONSENTIMIENTO } from '../shared/textos.ts'
import type { MessagingProvider } from './mensajeria.ts'
import { DuplicadoError, type HogarFila, type Repositorio } from './repo.ts'
import { generarToken, sha256 } from './seguridad.ts'

export interface Contexto {
  repo: Repositorio
  mensajeria: MessagingProvider
  ahora: () => Date
  /** URL pública del sitio, para links en mensajes (ej. https://…/emergencia). */
  urlBase: string
}

export class RutExistenteError extends Error {
  constructor() {
    super('rut_existente')
  }
}

const DIAS_TOKEN_MI_HOGAR = 180

export async function resumenPublico(ctx: Contexto): Promise<ResumenPublico> {
  const hoy = diaSantiago(ctx.ahora())
  const [config, total, campana, beneficios, barrios] = await Promise.all([
    ctx.repo.configuracion(),
    ctx.repo.contarHogares(),
    ctx.repo.campanaVigente(hoy),
    ctx.repo.beneficiosActivos(hoy),
    ctx.repo.avanceBarrios(),
  ])
  const minimo = config.minimo_contador_landing ?? 50
  const minimoBarrio = config.minimo_barrio_publico ?? 10
  const destacado = beneficios.find((b) => b.id === campana?.beneficioDestacadoId) ?? beneficios[0] ?? null
  return {
    hogaresPreparados: total >= minimo ? total : null,
    campana: campana ? { nombre: campana.nombre, mensaje: campana.mensaje } : null,
    beneficioDestacado: destacado,
    beneficios,
    barrios: barrios.filter((b) => b.inscritos >= minimoBarrio).sort((a, b) => b.porcentaje - a.porcentaje),
  }
}

export async function inscribir(
  ctx: Contexto,
  datos: Inscripcion,
  meta: { ip: string | null; userAgent: string | null },
): Promise<InscripcionCreada> {
  const { hogar } = datos
  if (hogar.jefeRut && (await ctx.repo.rutExiste(hogar.jefeRut))) throw new RutExistenteError()

  const config = await ctx.repo.configuracion()
  const ahora = ctx.ahora()
  const base = {
    hogar,
    idProvisorio: hogar.jefeRut ? null : `PROV-${generarToken(6).toUpperCase()}`,
    origen: datos.origen,
    aceptaRecordatorios: datos.aceptaRecordatorios,
    vigenteHasta: vigenteHasta(ahora, config.meses_vigencia ?? 6),
    consentimiento: {
      version: CONSENTIMIENTO.version,
      hash: await sha256(CONSENTIMIENTO.texto),
      ip: meta.ip,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  }

  // El código es aleatorio: si choca con uno existente se reintenta.
  let creado: { id: string } | null = null
  let codigo = ''
  for (let intento = 0; intento < 5 && !creado; intento++) {
    codigo = generarCodigoFamiliar()
    try {
      creado = await ctx.repo.crearHogar({ ...base, codigoFamiliar: codigo })
    } catch (err) {
      if (err instanceof DuplicadoError && err.campo === 'codigo') continue
      if (err instanceof DuplicadoError && err.campo === 'rut') throw new RutExistenteError()
      throw err
    }
  }
  if (!creado) throw new Error('no se pudo generar un código único')

  const token = generarToken()
  await ctx.repo.guardarToken({
    hogarId: creado.id,
    tokenHash: await sha256(token),
    proposito: 'mi_hogar',
    expiraAt: new Date(ahora.getTime() + DIAS_TOKEN_MI_HOGAR * 86_400_000),
  })
  await ctx.repo.auditar({ actorTipo: 'ciudadano', actorId: null, accion: 'inscripcion', entidad: 'hogar', entidadId: creado.id, detalle: { origen: datos.origen } })

  const fila = await ctx.repo.hogarPorToken(await sha256(token), 'mi_hogar', ahora)
  if (!fila) throw new Error('hogar recién creado no encontrado')

  // El aviso por WhatsApp no debe impedir la inscripción si el proveedor falla.
  try {
    await ctx.mensajeria.sendTemplate(hogar.whatsapp, 'tarjeta_activada', {
      nombre: hogar.jefeNombre.split(' ')[0] ?? '',
      codigo,
      vigente_hasta: fila.vigenteHasta,
      link: `${ctx.urlBase}/mi-hogar#t=${token}`,
    })
  } catch (err) {
    console.error('[emergencia] no se pudo enviar tarjeta_activada:', err instanceof Error ? err.message : 'error')
  }

  return { token, hogar: aMiHogar(fila) }
}

export async function miHogar(ctx: Contexto, token: string): Promise<MiHogar | null> {
  const fila = await ctx.repo.hogarPorToken(await sha256(token), 'mi_hogar', ctx.ahora())
  return fila ? aMiHogar(fila) : null
}

export function aMiHogar(f: HogarFila): MiHogar {
  return {
    codigoFamiliar: f.codigoFamiliar,
    nombreTarjeta: nombreTarjeta(f.jefeNombre),
    nivel: f.nivel,
    beneficioEstado: f.beneficioEstado,
    vigenteHasta: f.vigenteHasta,
    sector: f.sector,
    junta: f.junta,
    direccion: f.direccion,
    totalPersonas: f.totalPersonas,
    menores18: f.menores18,
    bebesMenores2: f.bebesMenores2,
    mayores65: f.mayores65,
    mascotas: f.mascotas,
    hitos: f.hitos,
    plan: generarPlanFamiliar({
      totalPersonas: f.totalPersonas,
      menores18: f.menores18,
      bebesMenores2: f.bebesMenores2,
      mayores65: f.mayores65,
      mascotas: f.mascotas,
      ganadoTexto: f.ganadoTexto,
      puntoEncuentro: f.puntoEncuentro,
      puntoEncuentroSugerido: f.puntoEncuentroSugerido,
      contactoEmergenciaNombre: f.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: f.contactoEmergenciaTelefono,
    }),
  }
}
