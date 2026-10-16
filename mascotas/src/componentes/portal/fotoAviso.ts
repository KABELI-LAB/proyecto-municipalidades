// Foto de un aviso de mascota perdida o avistada: la que subió quien publicó
// (guardada fuera de public/ y entregada por /mascotas/[id]/foto) o, en los
// datos de demostración, la del animal registrado (demo/fotos/).
import type { FotoFicha } from "./fotoFicha";

/** En el campo `fotoUrl`, las fotos subidas se guardan con este prefijo. */
export const PREFIJO_FOTO_AVISO = "subida:";

export function fotoDeAviso(p: { id: string; fotoUrl?: string | null; animal?: { foto: string | null } | null }): FotoFicha | null {
  if (p.fotoUrl?.startsWith(PREFIJO_FOTO_AVISO)) return { src: `/mascotas/${p.id}/foto`, subida: true };
  if (p.animal?.foto) return { src: `/fotos/${p.animal.foto}`, subida: false };
  return null;
}
