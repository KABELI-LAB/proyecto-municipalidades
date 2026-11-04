// Foto principal de un perro comunitario: de demo/fotos/ (servida en /fotos/) o
// subida por el equipo municipal al registrar la ficha (guardada fuera de
// public/ y entregada por /comunitarios/[id]/foto).
import type { FotoFicha } from "./fotoFicha";

/** En el campo `fotos`, las subidas se guardan con este prefijo. */
export const PREFIJO_SUBIDA = "subida:";

export function fotoDeComunitario(c: { id: string; fotos: string; animal: { foto: string | null } }): FotoFicha | null {
  const f = c.fotos.split(",").filter(Boolean)[0] ?? c.animal.foto;
  if (!f) return null;
  return f.startsWith(PREFIJO_SUBIDA) ? { src: `/comunitarios/${c.id}/foto`, subida: true } : { src: `/fotos/${f}`, subida: false };
}
