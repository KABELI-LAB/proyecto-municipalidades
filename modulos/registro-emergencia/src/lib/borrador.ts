/**
 * Estado del cuestionario (R2) y su conversión al cuerpo de la inscripción.
 * Funciones puras: se prueban sin renderizar.
 */
import type { InscripcionEntrada, Tenencia } from '../../shared/esquemas.ts'
import { normalizarRut } from '../../shared/rut.ts'
import { normalizarCelular } from '../../shared/telefono.ts'

export interface Borrador {
  jefeNombre: string
  rut: string
  sinRut: boolean
  whatsapp: string
  sectorId: string | null
  juntaVecinosId: string | null
  /** Eligió "No sé / no hay junta". */
  sinJunta: boolean
  direccion: string
  lat: number | null
  lng: number | null
  tenencia: Tenencia | null
  totalPersonas: number
  menores18: number
  bebesMenores2: number
  mayores65: number
  especiales: {
    /** "Prefiero no responder": se guarda null en todo. */
    noResponde: boolean
    ninguna: boolean
    discapacidad: number
    embarazada: boolean
    electrodependiente: boolean
  }
  mascotas: number
  tieneAnimales: boolean | null
  ganadoTexto: string
  contactoNombre: string
  contactoTelefono: string
  puntoEncuentro: string
  consentimiento: boolean
  recordatorios: boolean
}

export const BORRADOR_VACIO: Borrador = {
  jefeNombre: '',
  rut: '',
  sinRut: false,
  whatsapp: '',
  sectorId: null,
  juntaVecinosId: null,
  sinJunta: false,
  direccion: '',
  lat: null,
  lng: null,
  tenencia: null,
  totalPersonas: 1,
  menores18: 0,
  bebesMenores2: 0,
  mayores65: 0,
  especiales: { noResponde: false, ninguna: false, discapacidad: 0, embarazada: false, electrodependiente: false },
  mascotas: 0,
  tieneAnimales: null,
  ganadoTexto: '',
  contactoNombre: '',
  contactoTelefono: '',
  puntoEncuentro: '',
  consentimiento: false,
  recordatorios: true,
}

/** Mantiene los conteos coherentes cuando cambia otro (ej. baja el total). */
export function ajustarConteos(b: Borrador): Borrador {
  const total = Math.max(1, b.totalPersonas)
  const menores = Math.min(b.menores18, total)
  const mayores = Math.min(b.mayores65, total - menores)
  const bebes = Math.min(b.bebesMenores2, menores)
  const discapacidad = Math.min(b.especiales.discapacidad, total)
  return {
    ...b,
    totalPersonas: total,
    menores18: menores,
    mayores65: mayores,
    bebesMenores2: bebes,
    especiales: { ...b.especiales, discapacidad },
  }
}

const textoONull = (v: string) => (v.trim() ? v.trim() : null)

export function aInscripcion(b: Borrador, origen: 'autorregistro' | 'asistido'): InscripcionEntrada {
  const e = b.especiales
  const sinDatos = e.noResponde
  return {
    hogar: {
      jefeNombre: b.jefeNombre.trim(),
      jefeRut: b.sinRut ? null : b.rut,
      whatsapp: b.whatsapp,
      sectorId: b.sectorId ?? '',
      juntaVecinosId: b.sinJunta ? null : b.juntaVecinosId,
      direccion: b.direccion.trim(),
      lat: b.lat,
      lng: b.lng,
      tenencia: b.tenencia ?? 'propia',
      totalPersonas: b.totalPersonas,
      menores18: b.menores18,
      bebesMenores2: b.menores18 > 0 ? b.bebesMenores2 : 0,
      mayores65: b.mayores65,
      discapacidadOPostrados: sinDatos ? null : e.discapacidad,
      embarazada: sinDatos ? null : e.embarazada,
      electrodependiente: sinDatos ? null : e.electrodependiente,
      mascotas: b.mascotas,
      ganadoTexto: b.tieneAnimales ? textoONull(b.ganadoTexto) : null,
      contactoEmergenciaNombre: textoONull(b.contactoNombre),
      contactoEmergenciaTelefono: b.contactoTelefono.trim() ? b.contactoTelefono : null,
      puntoEncuentro: textoONull(b.puntoEncuentro),
    },
    consentimiento: { acepta: b.consentimiento as true, version: 'cliente' },
    aceptaRecordatorios: b.recordatorios,
    origen,
  }
}

// Validaciones por campo, con los mismos mensajes que el servidor.
export const validar = {
  nombre: (b: Borrador) => (b.jefeNombre.trim().length >= 2 ? null : 'Escribe el nombre del jefe o jefa de hogar.'),
  rut: (b: Borrador) => (b.sinRut || normalizarRut(b.rut) ? null : 'Revisa tu RUT: el dígito verificador no coincide.'),
  whatsapp: (b: Borrador) => (normalizarCelular(b.whatsapp) ? null : 'Escribe un celular chileno de 9 dígitos, ej. 9 1234 5678.'),
  direccion: (b: Borrador) => (b.direccion.trim().length >= 3 ? null : 'Escribe tu dirección o una referencia para llegar.'),
  contacto: (b: Borrador) =>
    !b.contactoTelefono.trim() || normalizarCelular(b.contactoTelefono) ? null : 'Escribe un celular chileno de 9 dígitos, ej. 9 1234 5678.',
}
