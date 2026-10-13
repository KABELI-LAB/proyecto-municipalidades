// Solo se muestran animales con foto (CLAUDE.md, datos de demostración): las
// pantallas que muestran animales los listan y cuentan con estas condiciones.
// Los registros sin foto siguen en la base; solo no se muestran.
import type { Prisma } from "@/generated/prisma/client";

/** Aviso de mascota: foto subida con el aviso o foto del animal registrado. */
export const PUBLICACION_CON_FOTO = { OR: [{ fotoUrl: { not: null } }, { animal: { foto: { not: null } } }] };

/** Ficha de adopción: foto del animal o fotos subidas por quien la propuso. */
export const FICHA_CON_FOTO = { OR: [{ animal: { foto: { not: null } } }, { fotos: { not: "" } }] };

/**
 * Ficha visible en el catálogo público: aprobada por el municipio, aún sin
 * adoptar y con foto. Las propuestas en revisión, rechazadas, ocultas o
 * retiradas nunca se publican.
 */
export const FICHA_PUBLICA: Prisma.FichaAdopcionWhereInput = { revision: "APROBADA", estado: { in: ["DISPONIBLE", "EN_PROCESO"] }, ...FICHA_CON_FOTO };

/** Perro comunitario: sus fotos propias o la del animal. */
export const COMUNITARIO_CON_FOTO = { OR: [{ fotos: { not: "" } }, { animal: { foto: { not: null } } }] };

/** Perro comunitario visible en el portal: con foto y no oculto. */
export const COMUNITARIO_PUBLICO = { ...COMUNITARIO_CON_FOTO, oculto: false };
