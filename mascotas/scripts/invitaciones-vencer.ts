// Revisión de invitaciones prioritarias: vence las que no tuvieron respuesta
// en su plazo, devuelve esas solicitudes a la demanda pendiente e invita a la
// siguiente persona (docs/concepto.md, secciones 5 y 9).
// Uso: npm run invitaciones:vencer   (en producción, cada hora)
import { db } from "@/servidor/db";
import { vencerInvitaciones } from "@/servidor/invitaciones";

vencerInvitaciones(db)
  .then((r) => console.log(`Invitaciones revisadas: ${r.vencidas} vencidas, ${r.invitadas} invitaciones nuevas.`))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
