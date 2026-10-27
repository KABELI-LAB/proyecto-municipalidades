/**
 * Repositorio en memoria con los datos de demostración. Se usa en tests y en
 * desarrollo cuando no hay DATABASE_URL. Reproduce las restricciones que
 * importan de la base real (RUT y código únicos, tokens vigentes).
 */
import type { Beneficio, BarrioAvance, Territorio } from '../shared/contrato.ts'
import type { Categoria, Nivel } from '../shared/incentivos.ts'
import { datosDemo } from './datosDemo.ts'
import { DuplicadoError, type EntradaAuditoria, type HogarFila, type NuevoHogar, type NuevoToken, type Repositorio } from './repo.ts'

interface HogarMem {
  id: string
  codigo: string
  nombre: string
  rut: string | null
  sectorId: string
  juntaId: string | null
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
  nivel: Nivel
  estado: 'activo' | 'pausado'
  vigente: string
  hitos: HogarFila['hitos']
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
    horas_alerta_entrega: 24,
    dias_purga: 30,
    minimo_contador_landing: 50,
    minimo_barrio_publico: 10,
  }
  const estado: RepoMemoria['estado'] = {
    hogares: conDemo
      ? demo.hogares.map((h) => ({
          id: h.id,
          codigo: h.codigo,
          nombre: h.nombre,
          rut: h.rut,
          sectorId: h.sector,
          juntaId: h.junta,
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
          nivel: h.nivel as Nivel,
          estado: 'activo' as const,
          vigente: h.vigente,
          hitos: [{ tipo: 'inscrito' as const, completadoAt: h.confirmado }],
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

  const beneficios: Beneficio[] = demo.beneficios.map((b) => ({
    id: b.id,
    titulo: b.titulo,
    descripcionCorta: b.desc,
    condiciones: 'Muestra tu Tarjeta Hogar Preparado vigente. Beneficio de demostración.',
    aliado: b.aliado === null ? null : (demo.aliados[b.aliado]?.nombre ?? null),
    categoria: b.cat as Categoria,
    nivelRequerido: b.nivel as Nivel,
    cuposRestantes: b.cupos,
    vigenteHasta: null,
  }))

  const sector = (id: string) => demo.sectores.find((s) => s.id === id)

  return {
    estado,

    async territorio(): Promise<Territorio> {
      return {
        sectores: demo.sectores.map((s) => ({ id: s.id, nombre: s.nombre, puntoEncuentroSugerido: s.punto })),
        juntas: demo.juntas
          .map((j) => ({ id: j.id, nombre: j.nombre, sectorId: demo.sectores[j.sector]!.id }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }
    },

    async configuracion() {
      return { ...config }
    },

    async contarHogares() {
      return estado.hogares.filter((h) => !h.borrado).length
    },

    async campanaVigente() {
      return { nombre: 'Temporada de incendios 2026', mensaje: 'Prepárate antes del verano.', beneficioDestacadoId: beneficios[0]?.id ?? null }
    },

    async beneficiosActivos() {
      return beneficios.map((b) => ({ ...b }))
    },

    async avanceBarrios(): Promise<BarrioAvance[]> {
      return demo.juntas.map((j) => {
        const inscritos = estado.hogares.filter((h) => !h.borrado && h.juntaId === j.id).length
        const exacto = (100 * inscritos) / j.estimados
        return {
          juntaId: j.id,
          nombre: j.nombre,
          sector: demo.sectores[j.sector]!.nombre,
          inscritos,
          estimados: j.estimados,
          porcentaje: Math.min(100, Math.round(exacto)),
          meta: 60,
          premio: j.premio,
          superoMeta: exacto >= 60,
        }
      })
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
        juntaId: h.juntaVecinosId,
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
        nivel: 1,
        estado: 'activo',
        vigente: n.vigenteHasta,
        hitos: [{ tipo: 'inscrito', completadoAt: new Date().toISOString() }],
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
        nivel: h.nivel,
        beneficioEstado: h.estado,
        vigenteHasta: h.vigente,
        sector: s?.nombre ?? '',
        puntoEncuentroSugerido: s?.punto ?? null,
        junta: demo.juntas.find((j) => j.id === h.juntaId)?.nombre ?? null,
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
        hitos: [...h.hitos],
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
