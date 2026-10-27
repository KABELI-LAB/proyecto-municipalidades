import { z } from 'zod'
import { normalizarRut } from './rut.ts'
import { normalizarCelular } from './telefono.ts'
import { dentroDeHualane, MENSAJE_FUERA } from './ubicacion.ts'

/**
 * Validación compartida entre el cuestionario (navegador) y el servidor.
 * Los mensajes van en tú, dicen qué pasó y cómo arreglarlo.
 */

export const TENENCIAS = ['propia', 'arrendada', 'cedida', 'allegados'] as const
export type Tenencia = (typeof TENENCIAS)[number]

const entero = (max: number) => z.number().int().min(0).max(max)

const rut = z
  .string()
  .transform((v, ctx) => {
    const n = normalizarRut(v)
    if (!n) ctx.addIssue({ code: 'custom', message: 'Revisa tu RUT: el dígito verificador no coincide.' })
    return n ?? ''
  })

const celular = z.string().transform((v, ctx) => {
  const n = normalizarCelular(v)
  if (!n) ctx.addIssue({ code: 'custom', message: 'Escribe un celular chileno de 9 dígitos, ej. 9 1234 5678.' })
  return n ?? ''
})

/** Datos del hogar que se piden en el cuestionario (R2). */
export const hogarSchema = z
  .object({
    jefeNombre: z.string().trim().min(2, 'Escribe el nombre del jefe o jefa de hogar.').max(120),
    /** null = "No tengo RUT" (se crea un id provisorio). */
    jefeRut: rut.nullable(),
    whatsapp: celular,
    sectorId: z.uuid(),
    direccion: z.string().trim().min(3, 'Escribe tu dirección o una referencia para llegar.').max(200),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
    tenencia: z.enum(TENENCIAS),
    totalPersonas: z.number().int().min(1, 'En tu casa vive al menos una persona.').max(30),
    menores18: entero(30),
    bebesMenores2: entero(30),
    mayores65: entero(30),
    // Sensibles: opcionales, null = prefiere no responder.
    discapacidadOPostrados: entero(30).nullable(),
    embarazada: z.boolean().nullable(),
    electrodependiente: z.boolean().nullable(),
    mascotas: entero(50),
    ganadoTexto: z.string().trim().max(200).nullable(),
    contactoEmergenciaNombre: z.string().trim().max(120).nullable(),
    contactoEmergenciaTelefono: celular.nullable(),
    puntoEncuentro: z.string().trim().max(200).nullable(),
  })
  .superRefine((h, ctx) => {
    if (h.menores18 > h.totalPersonas)
      ctx.addIssue({ code: 'custom', path: ['menores18'], message: 'Hay más menores que personas en la casa.' })
    if (h.mayores65 > h.totalPersonas)
      ctx.addIssue({ code: 'custom', path: ['mayores65'], message: 'Hay más personas mayores que personas en la casa.' })
    if (h.menores18 + h.mayores65 > h.totalPersonas)
      ctx.addIssue({ code: 'custom', path: ['mayores65'], message: 'Menores y mayores suman más que el total de personas.' })
    if ((h.lat === null) !== (h.lng === null))
      ctx.addIssue({ code: 'custom', path: ['lat'], message: 'La ubicación está incompleta. Márcala de nuevo en el mapa.' })
    if (h.lat !== null && h.lng !== null && !dentroDeHualane(h.lat, h.lng))
      ctx.addIssue({ code: 'custom', path: ['lat'], message: MENSAJE_FUERA })
    if (h.bebesMenores2 > h.menores18)
      ctx.addIssue({ code: 'custom', path: ['bebesMenores2'], message: 'Hay más bebés que menores de 18.' })
  })

export type HogarEntrada = z.input<typeof hogarSchema>
export type Hogar = z.output<typeof hogarSchema>

export const ORIGENES = ['autorregistro', 'asistido'] as const

/** Cuerpo de `POST /api/emergencia/inscripcion`. */
export const inscripcionSchema = z.object({
  hogar: hogarSchema,
  consentimiento: z.object({
    acepta: z.literal(true, { error: 'Necesitamos tu autorización para guardar los datos.' }),
    version: z.string().min(1),
  }),
  aceptaRecordatorios: z.boolean(),
  origen: z.enum(ORIGENES),
})

export type InscripcionEntrada = z.input<typeof inscripcionSchema>
export type Inscripcion = z.output<typeof inscripcionSchema>
