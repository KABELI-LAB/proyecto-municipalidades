import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { generarCodigo } from "@/dominio/codigo";

type Cliente = PrismaClient | Prisma.TransactionClient;

/** ¿Algún trámite (de cualquier tipo) ya usa este código? */
async function enUso(db: Cliente, codigo: string): Promise<boolean> {
  const donde = { where: { codigo } };
  const usos = await Promise.all([
    db.solicitudServicio.count(donde),
    db.cupo.count(donde),
    db.reporteCiudadano.count(donde),
    db.publicacionMascota.count(donde),
    db.postulacionAdopcion.count(donde),
    db.fichaAdopcion.count(donde),
    db.cuidadorAutorizado.count(donde),
    db.novedadComunitario.count(donde),
    db.invitacionOperativo.count(donde),
  ]);
  return usos.some((n) => n > 0);
}

/** Código TR-NNNN libre entre todos los trámites. */
export async function nuevoCodigo(db: Cliente): Promise<string> {
  for (let intento = 0; intento < 200; intento++) {
    const c = generarCodigo();
    if (!(await enUso(db, c))) return c;
  }
  throw new Error("No quedan códigos de seguimiento libres en el formato TR-NNNN.");
}
