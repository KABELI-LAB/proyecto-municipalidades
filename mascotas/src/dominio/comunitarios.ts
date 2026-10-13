// Perros comunitarios: reglas que no dependen de la base de datos.
import type { Estado } from "@/dominio/etiquetas";

/** Sin una revisión en terreno en este plazo, la ficha se considera desactualizada. */
export const DIAS_PARA_DESACTUALIZAR = 180;

const DIA = 86_400_000;

/**
 * Estado de actualización de la ficha según la última revisión registrada.
 * Nunca afirma cómo está el perro hoy: solo cuándo se revisó por última vez.
 */
export function estadoActualizacion(ultimoControl: Date | null, hoy = new Date()): Estado & { desactualizada: boolean } {
  if (!ultimoControl) return { texto: "Sin revisión registrada", tono: "espera", desactualizada: true };
  const dias = Math.floor((hoy.getTime() - ultimoControl.getTime()) / DIA);
  return dias > DIAS_PARA_DESACTUALIZAR
    ? { texto: "Desactualizada: más de 6 meses sin revisión", tono: "espera", desactualizada: true }
    : { texto: "Revisada en los últimos 6 meses", tono: "confirmado", desactualizada: false };
}

/** Fecha límite: revisadas antes de esta fecha (o nunca) están desactualizadas. */
export const limiteDesactualizada = (hoy = new Date()) => new Date(hoy.getTime() - DIAS_PARA_DESACTUALIZAR * DIA);

/** Tipos de novedad. `ATENCION` queda solo para novedades antiguas de cuidadores. */
export const TIPO_NOVEDAD: Record<string, string> = {
  SALUD: "Está herido o enfermo",
  NO_ESTA: "No está en su lugar o no lo he visto",
  ALIMENTACION: "Le falta agua, alimento o refugio",
  CORRECCION: "Hay un dato de la ficha que corregir",
  ATENCION: "Recibió una atención o un control",
  OTRA: "Otra novedad",
};
export const TIPOS_VECINO = ["SALUD", "NO_ESTA", "ALIMENTACION", "CORRECCION", "OTRA"] as const;

/** Estado de una novedad, como lo ve quien la envió: vista no significa que el perro fue atendido. */
export const ESTADO_NOVEDAD: Record<string, Estado> = {
  PENDIENTE: { texto: "Enviada", tono: "recibido" },
  ACEPTADA: { texto: "Vista", tono: "confirmado" },
  DESCARTADA: { texto: "No aplicada", tono: "cerrado" },
};

/** Servicios que se registran como atención de un perro comunitario, y el dato del animal que confirman. */
export const DATO_POR_SERVICIO: Record<string, "esterilizado" | "vacunasAlDia" | "microchip"> = {
  esterilizacion: "esterilizado",
  vacunacion: "vacunasAlDia",
  microchip: "microchip",
};
