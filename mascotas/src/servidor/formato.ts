// Formato ligado a la zona horaria del municipio activo.
import * as f from "@/dominio/formato";
import { municipioActivo } from "@/lib/municipio";

const zona = () => municipioActivo().zonaHoraria;

export const fechaLarga = (d: Date) => f.fechaLarga(d, zona());
export const fechaCorta = (d: Date) => f.fechaCorta(d, zona());
export const hora = (d: Date) => f.hora(d, zona());
export const haceDias = (d: Date) => f.haceDias(d, zona());
export const diaISO = (d: Date) => f.diaISO(d, zona());
export const inicioDeHoy = () => f.inicioDeHoy(zona());
export const medianocheEn = (dia: string) => f.medianocheEn(dia, zona());
export const { numero, porcentaje } = f;

/** Hoy en la zona del municipio («2026-10-06»). */
export const hoyISO = () => f.diaISO(new Date(), zona());

/**
 * Ventana de `n` días de calendario que termina hoy, incluido: [hoy − (n − 1), mañana).
 * «Últimos 30 días» = hoy y los 29 anteriores, como en demo/generar.py.
 * `anterior` es la ventana de igual largo justo antes, para comparar.
 */
export function ventana(n: number, hoy = hoyISO()) {
  const z = zona();
  const desde = f.medianocheEn(f.sumarDiasISO(hoy, -(n - 1)), z);
  const hasta = f.medianocheEn(f.sumarDiasISO(hoy, 1), z);
  const desdeAnterior = f.medianocheEn(f.sumarDiasISO(hoy, -(2 * n - 1)), z);
  return { desde, hasta, anterior: { desde: desdeAnterior, hasta: desde } };
}
