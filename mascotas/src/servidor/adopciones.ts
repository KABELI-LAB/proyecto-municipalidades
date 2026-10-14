// Concretar una adopción (docs/concepto.md, sección 7, pasos 4 y 5). Lo usan
// el panel (fichas del municipio) y quien dio en adopción (fichas de vecinos):
// la ficha pasa a Adoptado con el sector de quien adopta; las demás
// postulaciones se cierran; si al animal le falta esterilización o microchip,
// se crean solicitudes de servicio a nombre de quien adopta.
import "server-only";
import { compromisosDeAdopcion } from "@/dominio/bandejas";
import { nuevoCodigo } from "@/servidor/codigos";
import { db } from "@/servidor/db";
import { notificar } from "@/servidor/notificaciones";

const nombreDe = (a: { nombre: string | null }) => a.nombre ?? "el animal";

type Postulacion = {
  id: string;
  personaId: string;
  loteDemoId: string | null;
  persona: { sectorId: string; localidadId: string | null; telefono: string | null; correo: string | null };
  ficha: {
    id: string;
    animalId: string;
    loteDemoId: string | null;
    codigo: string | null;
    proponenteId: string | null;
    animal: { nombre: string | null; esterilizado: boolean | null; microchip: boolean | null };
  };
};

/** Devuelve los compromisos creados, como «esterilización (TR-1234)». */
export async function concretarAdopcion(p: Postulacion, municipioId: string): Promise<string[]> {
  const servicios = await db.servicio.findMany({ where: { municipioId, clave: { in: compromisosDeAdopcion(p.ficha.animal) } } });
  const nombre = nombreDe(p.ficha.animal);
  return db.$transaction(async (tx) => {
    await tx.fichaAdopcion.update({
      where: { id: p.ficha.id },
      data: { estado: "ADOPTADO", adoptadaEn: new Date(), adoptanteId: p.personaId, sectorAdoptanteId: p.persona.sectorId },
    });
    await tx.animal.update({ where: { id: p.ficha.animalId }, data: { personaId: p.personaId } });

    const otras = await tx.postulacionAdopcion.findMany({ where: { fichaId: p.ficha.id, id: { not: p.id }, estado: { in: ["RECIBIDA", "EN_EVALUACION", "APROBADA"] } }, include: { persona: true } });
    for (const o of otras) {
      await tx.postulacionAdopcion.update({ where: { id: o.id }, data: { estado: "NO_SELECCIONADA" } });
      await notificar(tx, o.persona, "Sobre tu postulación", `Gracias por postular para adoptar a ${nombre}. Ya encontró hogar. Te invitamos a conocer a otros animales que buscan uno.`, o.loteDemoId);
    }

    const creados: string[] = [];
    for (const s of servicios) {
      const codigo = await nuevoCodigo(tx);
      await tx.solicitudServicio.create({
        data: { codigo, personaId: p.personaId, animalId: p.ficha.animalId, servicioId: s.id, sectorId: p.persona.sectorId, localidadId: p.persona.localidadId, origen: "COMPROMISO_ADOPCION", loteDemoId: p.ficha.loteDemoId },
      });
      creados.push(`${s.nombre.toLowerCase()} (${codigo})`);
    }
    const compromiso = creados.length ? ` Registramos tu compromiso de ${creados.join(" y ")}; te avisaremos cuando haya un operativo.` : "";
    await notificar(tx, p.persona, "Adopción registrada", `Registramos la adopción de ${nombre}. Gracias por darle un hogar.${compromiso}`, p.loteDemoId);
    // Quien propuso la adopción sabe que el animal encontró hogar.
    const proponente = p.ficha.proponenteId ? await tx.persona.findUnique({ where: { id: p.ficha.proponenteId } }) : null;
    if (proponente) await notificar(tx, proponente, "Encontró hogar", `${nombre} (${p.ficha.codigo}) fue adoptado a través de la plataforma. Gracias por darle una oportunidad.`, p.ficha.loteDemoId);
    return creados;
  });
}
