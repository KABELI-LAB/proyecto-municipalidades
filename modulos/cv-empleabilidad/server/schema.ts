import { z } from 'zod'

/**
 * Esquema de la respuesta del modelo. Debe calzar con `CvAnalysis` de
 * src/services/types.ts (sin `origen`, que lo agrega el cliente, ni `id` de
 * sugerencias, que lo agrega el servidor).
 *
 * Hay dos versiones: `RESPONSE_JSON_SCHEMA` se envía al modelo (structured
 * outputs en modo estricto: todo requerido, opcionales como `null`) y
 * `modelResponseSchema` (zod) valida lo que vuelve.
 */

const SECCIONES = ['contacto', 'perfil', 'experiencia', 'educacion', 'habilidades', 'idiomas', 'formato'] as const
const PRIORIDADES = ['alta', 'media', 'baja'] as const

const str = { type: 'string' }
const strONull = { type: ['string', 'null'] }
const strArr = { type: 'array', items: str }
const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
})

export const RESPONSE_JSON_SCHEMA = obj({
  puntaje: { type: 'integer', minimum: 0, maximum: 100 },
  resumen: str,
  fortalezas: strArr,
  sugerencias: {
    type: 'array',
    items: obj({
      seccion: { type: 'string', enum: SECCIONES },
      prioridad: { type: 'string', enum: PRIORIDADES },
      titulo: str,
      detalle: str,
      ejemplo: strONull,
    }),
  },
  cvMejorado: obj({
    nombre: str,
    titular: str,
    contacto: obj({ email: strONull, telefono: strONull, ubicacion: strONull, linkedin: strONull }),
    perfil: str,
    experiencia: { type: 'array', items: obj({ cargo: str, organizacion: str, periodo: str, logros: strArr }) },
    educacion: { type: 'array', items: obj({ titulo: str, institucion: str, periodo: str }) },
    habilidades: strArr,
    idiomas: strArr,
  }),
})

// null → undefined, para que el resultado calce con los tipos opcionales del frontend.
const opcional = z
  .string()
  .nullable()
  .transform((v) => (v && v.trim() ? v : undefined))

export const modelResponseSchema = z.object({
  puntaje: z.number().int().min(0).max(100),
  resumen: z.string().min(1),
  fortalezas: z.array(z.string()),
  sugerencias: z.array(
    z.object({
      seccion: z.enum(SECCIONES),
      prioridad: z.enum(PRIORIDADES),
      titulo: z.string().min(1),
      detalle: z.string().min(1),
      ejemplo: opcional,
    }),
  ),
  cvMejorado: z.object({
    nombre: z.string(),
    titular: z.string(),
    contacto: z.object({ email: opcional, telefono: opcional, ubicacion: opcional, linkedin: opcional }),
    perfil: z.string(),
    experiencia: z.array(z.object({ cargo: z.string(), organizacion: z.string(), periodo: z.string(), logros: z.array(z.string()) })),
    educacion: z.array(z.object({ titulo: z.string(), institucion: z.string(), periodo: z.string() })),
    habilidades: z.array(z.string()),
    idiomas: z.array(z.string()),
  }),
})

export const requestSchema = z.object({
  texto: z.string().trim().min(1),
  nombreArchivo: z.string().max(255).optional(),
})
