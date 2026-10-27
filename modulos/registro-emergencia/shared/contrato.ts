/**
 * Contrato HTTP de `/api/emergencia/*` (ver docs/api.md). Lo comparten el
 * cliente (src/servicios) y el servidor (server/). Cambiarlo obliga a
 * actualizar ambos lados y el repositorio en memoria.
 */
import type { Categoria, Nivel, PlanFamiliar } from './incentivos.ts'

export interface Sector {
  id: string
  nombre: string
  puntoEncuentroSugerido: string | null
}

export interface JuntaVecinos {
  id: string
  nombre: string
  sectorId: string
}

/** GET /territorio: lo que necesita el cuestionario. */
export interface Territorio {
  sectores: Sector[]
  juntas: JuntaVecinos[]
}

export interface Beneficio {
  id: string
  titulo: string
  descripcionCorta: string
  condiciones: string | null
  aliado: string | null
  categoria: Categoria
  nivelRequerido: Nivel
  /** null = sin límite. */
  cuposRestantes: number | null
  vigenteHasta: string | null
}

export interface BarrioAvance {
  juntaId: string
  nombre: string
  sector: string
  inscritos: number
  estimados: number
  porcentaje: number
  meta: number
  premio: string | null
  superoMeta: boolean
}

/** GET /resumen: datos vivos para la landing. Todo agregado, nada personal. */
export interface ResumenPublico {
  /** null cuando hay menos hogares que el mínimo configurado (no se muestra). */
  hogaresPreparados: number | null
  campana: { nombre: string; mensaje: string | null } | null
  beneficioDestacado: Beneficio | null
  beneficios: Beneficio[]
  /** Barrios con al menos el mínimo de inscritos, ordenados por avance. */
  barrios: BarrioAvance[]
}

/** Vista del hogar para su dueño (R3, B2). Sin datos sensibles. */
export interface MiHogar {
  codigoFamiliar: string
  nombreTarjeta: string
  nivel: Nivel
  beneficioEstado: 'activo' | 'pausado'
  vigenteHasta: string
  sector: string
  junta: string | null
  direccion: string
  totalPersonas: number
  menores18: number
  bebesMenores2: number
  mayores65: number
  mascotas: number
  plan: PlanFamiliar
  hitos: { tipo: 'inscrito' | 'mochila_lista' | 'plan_practicado'; completadoAt: string }[]
}

/** POST /inscripcion → 201. */
export interface InscripcionCreada {
  /** Token de acceso personal a Mi hogar (se guarda en el dispositivo, no en la URL del servidor). */
  token: string
  hogar: MiHogar
}

/** Errores: `{ error: string, codigo?: CodigoError }`. */
export type CodigoError = 'rut_existente' | 'validacion' | 'no_disponible' | 'token_invalido' | 'limite'

export interface ErrorApi {
  error: string
  codigo?: CodigoError
  campos?: Record<string, string>
}
