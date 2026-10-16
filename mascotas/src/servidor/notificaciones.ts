import type { Prisma } from "@/generated/prisma/client";

/**
 * Registra una notificación para la persona. Si el envío de correos está
 * configurado, la persona dejó un correo y no son datos de demostración, queda
 * en cola (PENDIENTE) y sale por correo apenas termina la acción que la creó
 * (así nunca se envía algo que finalmente no se guardó). Si no, queda como
 * simulada, igual que siempre: la persona la ve en Mis solicitudes.
 */
export async function notificar(
  tx: Prisma.TransactionClient,
  persona: { telefono: string | null; correo: string | null },
  asunto: string,
  contenido: string,
  loteDemoId: string | null = null,
) {
  const destinatario = persona.correo ?? persona.telefono;
  if (!destinatario) return;
  const { estadoCorreo } = await import("@/servidor/correo");
  const porCorreo = Boolean(persona.correo) && !loteDemoId && estadoCorreo().configurado;
  await tx.notificacion.create({
    data: { destinatario, canal: persona.correo ? "CORREO" : "SMS", asunto, contenido, loteDemoId, estado: porCorreo ? "PENDIENTE" : "SIMULADA" },
  });
  if (porCorreo) programarEnvio();
}

/** Después de responder: envía la cola. Fuera de una petición (pruebas, scripts) no hace nada. */
function programarEnvio() {
  void (async () => {
    try {
      const { after } = await import("next/server");
      after(async () => {
        const [{ db }, { enviarPendientes }, { municipioActivo }] = await Promise.all([import("@/servidor/db"), import("@/servidor/correo"), import("@/lib/municipio")]);
        await enviarPendientes(db, municipioActivo().nombreOficial);
      });
    } catch {
      // Sin contexto de petición: quedan PENDIENTE y salen con la próxima acción que envíe.
    }
  })();
}
