/**
 * Contrato HTTP de `/api/emergencia/*` (ver docs/api.md). Lo comparten el
 * cliente (src/servicios) y el servidor (server/). Cambiarlo obliga a
 * actualizar ambos lados y el repositorio en memoria.
 */
import type { PlanFamiliar } from './tarjeta.ts'

export interface Sector {
  id: string
  nombre: string
  puntoEncuentroSugerido: string | null
}

/** GET /territorio: lo que necesita el cuestionario. */
export interface Territorio {
  sectores: Sector[]
}

/** GET /resumen: datos vivos para la landing. Todo agregado, nada personal. */
export interface ResumenPublico {
  /** null cuando hay menos hogares que el mínimo configurado (no se muestra). */
  hogaresPreparados: number | null
}

/** Vista del hogar para su dueño (R3). Sin datos sensibles. */
export interface MiHogar {
  codigoFamiliar: string
  nombreTarjeta: string
  tarjetaEstado: 'activo' | 'pausado'
  vigenteHasta: string
  sector: string
  direccion: string
  totalPersonas: number
  menores18: number
  bebesMenores2: number
  mayores65: number
  mascotas: number
  plan: PlanFamiliar
}

/** POST /inscripcion → 201. */
export interface InscripcionCreada {
  /** Token de acceso personal a la tarjeta (se guarda en el dispositivo, no en la URL del servidor). */
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
