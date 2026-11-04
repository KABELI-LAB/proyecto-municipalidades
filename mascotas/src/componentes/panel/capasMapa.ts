// Capas del mapa del panel (docs/concepto.md, sección 11). Módulo común al
// servidor y al cliente.
import { MINIMO_CALOR } from "@/dominio/mapa";

export const CAPAS = {
  prioridad: { nombre: "Prioridad", explica: "Índice de prioridad de hoy en cada sector: alta, media o baja.", temporal: false },
  solicitudes: { nombre: "Solicitudes pendientes", explica: "Solicitudes de servicio que hoy esperan atención, por sector.", temporal: false },
  dias: { nombre: "Días sin intervención", explica: "Días desde el último operativo cerrado en cada sector.", temporal: false },
  reportes: { nombre: "Reportes", explica: "Reportes ciudadanos recibidos en cada sector durante el período.", temporal: true },
  calor: { nombre: "Calor de reportes", explica: `Zonas de cerca de 1 km con ${MINIMO_CALOR} o más reportes en el período.`, temporal: true },
  perdidas: { nombre: "Perdidas y avistadas", explica: "Publicaciones de mascotas por sector en el período y cuántas se resolvieron.", temporal: true },
  atenciones: { nombre: "Atenciones", explica: "Atenciones realizadas (esterilización, vacuna, microchip) por sector en el período.", temporal: true },
  adopciones: { nombre: "Adopciones", explica: "Adopciones concretadas en el período, según el sector de quien adopta.", temporal: true },
  operativos: { nombre: "Operativos", explica: "Operativos cerrados por sector en el período.", temporal: true },
} as const;
export type Capa = keyof typeof CAPAS;
export const CLAVES_CAPA = Object.keys(CAPAS) as Capa[];
