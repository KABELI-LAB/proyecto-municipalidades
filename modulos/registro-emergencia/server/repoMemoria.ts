/**
 * Repositorio en memoria con los datos de demostración. Se usa en tests y en
 * desarrollo cuando no hay base configurada. Reproduce las restricciones que
 * importan de la base real (RUT y código únicos, tokens vigentes).
 */
import type { Territorio } from '../shared/contrato.ts'
import { datosDemo } from './datosDemo.ts'
import { DuplicadoError, type EntradaAuditoria, type HogarFila, type NuevoHogar, type NuevoToken, type Repositorio } from './repo.ts'

interface HogarMem {
  id: string
  codigo: string
  nombre: string
  rut: string | null
  sectorId: string
  direccion: string
  total: number
  menores: number
  bebes: number
  mayores: number
  mascotas: number
  ganado: string | null
  puntoEncuentro: string | null
  contactoNombre: string | null
  contactoTelefono: string | null
  estado: 'activo' | 'pausado'
  vigente: string
  borrado: boolean
}

export interface RepoMemoria extends Repositorio {
  /** Para inspeccionar en tests. */
  readonly estado: {
    hogares: HogarMem[]
    tokens: (NuevoToken & { usadoAt: Date | null })[]
    auditoria: EntradaAuditoria[]
    consentimientos: (NuevoHogar['consentimiento'] & { hogarId: string })[]
    eventos: { paso: string; evento: string }[]
  }
}

export function crearRepoMemoria(opciones: { conDemo?: boolean; hoy?: Date } = {}): RepoMemoria {
  const demo = datosDemo(opciones.hoy)
  const conDemo = opciones.conDemo ?? true
  const config: Record<string, number> = {
    meses_vigencia: 6,
    dias_segundo_aviso: 15,
    dias_pausa: 30,
    dias_purga: 30,
    minimo_contador_landing: 50,
  }
  const estado: RepoMemoria['estado'] = {
    hogares: conDemo
      ? demo.hogares.map((h) => ({
          id: h.id,
          codigo: h.codigo,
          nombre: h.nombre,
          rut: h.rut,
          sectorId: h.sector,
          direccion: h.direccion,
          total: h.total,
          menores: h.menores,
          bebes: h.bebes,
          mayores: h.mayores,
          mascotas: h.mascotas,
          ganado: h.ganado,
          puntoEncuentro: null,
          contactoNombre: null,
          contactoTelefono: null,
          estado: 'activo' as const,
          vigente: h.vigente,
          borrado: false,
        }))
      : [],
    tokens: [],
    auditoria: [],
    consentimientos: [],
    eventos: [],
  }
  const limites = new Map<string, number>()
  let secuencia = 1000
  const sector = (id: string) => demo.sectores.find((s) => s.id === id)

  return {
    estado,

    async territorio(): Promise<Territorio> {
      return { sectores: demo.sectores.map((s) => ({ id: s.id, nombre: s.nombre, puntoEncuentroSugerido: s.punto })) }
    },

    async configuracion() {
      return { ...config }
    },

    async contarHogares() {
      return estado.hogares.filter((h) => !h.borrado).length
    },

    async rutExiste(rut) {
      return estado.hogares.some((h) => !h.borrado && h.rut === rut)
    },

    async crearHogar(n: NuevoHogar) {
      const h = n.hogar
      if (estado.hogares.some((x) => x.codigo === n.codigoFamiliar)) throw new DuplicadoError('codigo')
      if (h.jefeRut && estado.hogares.some((x) => !x.borrado && x.rut === h.jefeRut)) throw new DuplicadoError('rut')
      const id = `00000000-0000-4000-8000-9999${String(secuencia++).padStart(8, '0')}`
      estado.hogares.push({
        id,
        codigo: n.codigoFamiliar,
        nombre: h.jefeNombre,
        rut: h.jefeRut,
        sectorId: h.sectorId,
        direccion: h.direccion,
        total: h.totalPersonas,
        menores: h.menores18,
        bebes: h.bebesMenores2,
        mayores: h.mayores65,
        mascotas: h.mascotas,
        ganado: h.ganadoTexto,
        puntoEncuentro: h.puntoEncuentro,
        contactoNombre: h.contactoEmergenciaNombre,
        contactoTelefono: h.contactoEmergenciaTelefono,
        estado: 'activo',
        vigente: n.vigenteHasta,
        borrado: false,
      })
      estado.consentimientos.push({ ...n.consentimiento, hogarId: id })
      return { id }
    },

    async guardarToken(t) {
      estado.tokens.push({ ...t, usadoAt: null })
    },

    async hogarPorToken(tokenHash, proposito, ahora): Promise<HogarFila | null> {
      const t = estado.tokens.find((x) => x.tokenHash === tokenHash && x.proposito === proposito && x.expiraAt > ahora && !x.usadoAt)
      const h = t && estado.hogares.find((x) => x.id === t.hogarId && !x.borrado)
      if (!h) return null
      const s = sector(h.sectorId)
      return {
        id: h.id,
        codigoFamiliar: h.codigo,
        jefeNombre: h.nombre,
        tarjetaEstado: h.estado,
        vigenteHasta: h.vigente,
        sector: s?.nombre ?? '',
        puntoEncuentroSugerido: s?.punto ?? null,
        direccion: h.direccion,
        totalPersonas: h.total,
        menores18: h.menores,
        bebesMenores2: h.bebes,
        mayores65: h.mayores,
        mascotas: h.mascotas,
        ganadoTexto: h.ganado,
        puntoEncuentro: h.puntoEncuentro,
        contactoEmergenciaNombre: h.contactoNombre,
        contactoEmergenciaTelefono: h.contactoTelefono,
      }
    },

    async auditar(e) {
      estado.auditoria.push(e)
    },

    async registrarEventoCuestionario(_sesion, paso, evento) {
      estado.eventos.push({ paso, evento })
    },

    async contarIntento(clave, ventanaInicio) {
      const k = `${clave}@${ventanaInicio.toISOString()}`
      const n = (limites.get(k) ?? 0) + 1
      limites.set(k, n)
      return n
    },
  }
}
