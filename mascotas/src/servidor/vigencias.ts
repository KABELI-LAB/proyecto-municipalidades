// Revisión diaria de vigencias de las publicaciones de mascotas. Sin
// "server-only": también la usa scripts/publicaciones-vigencia.ts, pensado
// para correr una vez al día (en producción, con una tarea programada).
import type { PrismaClient } from "@/generated/prisma/client";
import { accionVigencia, limiteParaResponder } from "@/dominio/vigencia";
import { fechaCorta } from "@/dominio/formato";
import { notificar } from "@/servidor/notificaciones";

export async function revisarVigencias(db: PrismaClient, zona: string, ahora = new Date()) {
  const abiertas = await db.publicacionMascota.findMany({
    where: { estado: "ABIERTA" },
    include: { persona: { select: { telefono: true, correo: true } } },
  });
  let pedidas = 0;
  let archivadas = 0;
  for (const p of abiertas) {
    const accion = accionVigencia(p, ahora);
    if (accion === "pedir") {
      await db.$transaction(async (tx) => {
        await tx.publicacionMascota.update({ where: { id: p.id }, data: { vigenciaPedidaEn: ahora } });
        const limite = fechaCorta(limiteParaResponder(ahora), zona);
        await notificar(
          tx,
          p.persona,
          "¿Su aviso sigue vigente?",
          `Su aviso${p.codigo ? ` ${p.codigo}` : ""} cumplió 30 días. Si sigue buscando, confírmelo en Mis solicitudes antes del ${limite}; si no, lo archivaremos.`,
          p.loteDemoId,
        );
      });
      pedidas++;
    } else if (accion === "archivar") {
      await db.publicacionMascota.update({ where: { id: p.id }, data: { estado: "ARCHIVADA", resueltaEn: ahora } });
      archivadas++;
    }
  }
  return { pedidas, archivadas };
}
