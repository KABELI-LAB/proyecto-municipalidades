/**
 * Tarjeta Hogar Preparado y plan familiar (R3). Funciones puras: las usan el
 * servidor, la tarjeta y los PDF. Los datos sensibles nunca entran aquí.
 */
import { sumarMeses, diaSantiago } from './fechas.ts'

/** Fecha de vencimiento de la tarjeta a partir de la última confirmación. */
export function vigenteHasta(confirmadoEl: Date, meses = 6): string {
  return sumarMeses(diaSantiago(confirmadoEl), meses)
}

/** Nombre que aparece en la tarjeta: nunca el nombre completo. */
export function nombreTarjeta(jefeNombre: string): string {
  const partes = jefeNombre.trim().split(/\s+/)
  if (partes.length >= 3) return `Familia ${partes[partes.length - 2]}`
  if (partes.length === 2) return `Familia ${partes[1]}`
  return `Familia de ${partes[0] ?? ''}`.trim()
}

// ── Plan familiar ────────────────────────────────────────────────────────────

/** Lo mínimo del hogar que necesita el plan (sin datos sensibles). */
export interface DatosPlan {
  totalPersonas: number
  menores18: number
  bebesMenores2: number
  mayores65: number
  mascotas: number
  ganadoTexto: string | null
  puntoEncuentro: string | null
  puntoEncuentroSugerido: string | null
  contactoEmergenciaNombre: string | null
  contactoEmergenciaTelefono: string | null
}

export interface GrupoMochila {
  titulo: string
  items: string[]
}

export interface PlanFamiliar {
  puntoEncuentro: string
  puntoEncuentroEsSugerido: boolean
  mochila: GrupoMochila[]
  telefonos: { nombre: string; numero: string }[]
}

/** Números de emergencia de Chile. */
export const TELEFONOS_EMERGENCIA = [
  { nombre: 'Ambulancia (SAMU)', numero: '131' },
  { nombre: 'Bomberos', numero: '132' },
  { nombre: 'Carabineros', numero: '133' },
  { nombre: 'Conaf (incendios forestales)', numero: '130' },
]

export function generarPlanFamiliar(h: DatosPlan): PlanFamiliar {
  const litros = Math.max(1, h.totalPersonas) * 3 * 4
  const mochila: GrupoMochila[] = [
    {
      titulo: 'Para todos',
      items: [
        `Agua: ${litros} litros (4 litros por persona al día, para 3 días)`,
        'Comida que no necesite cocinarse, para 3 días',
        'Linterna y radio a pilas, con pilas de repuesto',
        'Botiquín básico',
        'Copia de carnets y de tu Tarjeta Hogar Preparado',
        'Abrigo, mascarillas y una muda de ropa por persona',
        'Cargador de celular y batería externa',
      ],
    },
  ]
  if (h.bebesMenores2 > 0)
    mochila.push({ titulo: 'Para la guagua', items: ['Pañales para 3 días', 'Leche y mamadera', 'Toallitas húmedas', 'Una manta'] })
  else if (h.menores18 > 0)
    mochila.push({ titulo: 'Para niñas y niños', items: ['Un juguete o libro pequeño', 'Snacks que les gusten', 'Ropa de cambio'] })
  if (h.mayores65 > 0)
    mochila.push({
      titulo: 'Para las personas mayores',
      items: ['Medicamentos para 7 días', 'Copia de recetas médicas', 'Lentes y audífonos de repuesto'],
    })
  if (h.mascotas > 0)
    mochila.push({ titulo: 'Para tus mascotas', items: ['Correa o transportador', 'Agua y alimento para 3 días', 'Un plato'] })
  if (h.ganadoTexto)
    mochila.push({ titulo: 'Para tus animales', items: ['Define antes dónde llevarlos', 'Ten a mano un número para pedir ayuda con el traslado'] })

  const telefonos = [...TELEFONOS_EMERGENCIA]
  if (h.contactoEmergenciaNombre && h.contactoEmergenciaTelefono)
    telefonos.unshift({ nombre: h.contactoEmergenciaNombre, numero: h.contactoEmergenciaTelefono })

  const propio = h.puntoEncuentro?.trim()
  return {
    puntoEncuentro: propio || h.puntoEncuentroSugerido || 'Plaza de Armas de Hualañé',
    puntoEncuentroEsSugerido: !propio,
    mochila,
    telefonos,
  }
}
