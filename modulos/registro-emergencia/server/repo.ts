/**
 * Acceso a datos. Dos implementaciones con el mismo contrato:
 * - repoPostgres.ts: Supabase (esquema privado `registro`), con DATABASE_URL.
 * - repoMemoria.ts: en memoria, para tests y para desarrollar sin base.
 */
import type { Territorio } from '../shared/contrato.ts'
import type { Hogar } from '../shared/esquemas.ts'

/** Fila de hogar con los nombres de su territorio (sin datos sensibles). */
export interface HogarFila {
  id: string
  codigoFamiliar: string
  jefeNombre: string
  tarjetaEstado: 'activo' | 'pausado'
  vigenteHasta: string
  sector: string
  puntoEncuentroSugerido: string | null
  direccion: string
  totalPersonas: number
  menores18: number
  bebesMenores2: number
  mayores65: number
  mascotas: number
  ganadoTexto: string | null
  puntoEncuentro: string | null
  contactoEmergenciaNombre: string | null
  contactoEmergenciaTelefono: string | null
}

export interface NuevoHogar {
  codigoFamiliar: string
  hogar: Hogar
  idProvisorio: string | null
  origen: 'autorregistro' | 'asistido'
  aceptaRecordatorios: boolean
  vigenteHasta: string
  consentimiento: { version: string; hash: string; ip: string | null; userAgent: string | null }
}

export interface NuevoToken {
  hogarId: string
  tokenHash: string
  proposito: 'editar' | 'mi_hogar'
  expiraAt: Date
}

export interface EntradaAuditoria {
  actorTipo: 'ciudadano' | 'funcionario' | 'admin' | 'aliado' | 'sistema'
  actorId: string | null
  accion: string
  entidad: string
  entidadId: string | null
  detalle?: Record<string, unknown>
}

/** El RUT o el código ya existen (índice único). */
export class DuplicadoError extends Error {
  readonly campo: 'rut' | 'codigo'
  constructor(campo: 'rut' | 'codigo') {
    super(`duplicado: ${campo}`)
    this.campo = campo
  }
}

export interface Repositorio {
  territorio(): Promise<Territorio>
  /** Valores numéricos de registro.configuracion. */
  configuracion(): Promise<Record<string, number>>
  contarHogares(): Promise<number>
  rutExiste(rut: string): Promise<boolean>
  /** Crea hogar + consentimiento en una transacción. */
  crearHogar(nuevo: NuevoHogar): Promise<{ id: string }>
  guardarToken(token: NuevoToken): Promise<void>
  /** Hogar dueño de un token vigente (no expirado, no usado). */
  hogarPorToken(tokenHash: string, proposito: NuevoToken['proposito'], ahora: Date): Promise<HogarFila | null>
  auditar(entrada: EntradaAuditoria): Promise<void>
  registrarEventoCuestionario(sesionHash: string, paso: string, evento: 'vista' | 'completado' | 'abandono' | 'enviado'): Promise<void>
  /** Suma un intento a la ventana y devuelve el total de la ventana. */
  contarIntento(clave: string, ventanaInicio: Date): Promise<number>
}
