import type { PrismaClient } from "@/generated/prisma/client";

/** ¿Le quedan datos de demostración al municipio en curso? Controla la franja «Datos de demostración». */
export async function hayDatosDemo(db: PrismaClient): Promise<boolean> {
  const { municipioActivo } = await import("@/lib/municipio");
  return (await db.loteDemo.count({ where: { municipioId: (await municipioActivo()).id } })) > 0;
}

/**
 * Borra de una vez los datos de demostración de un municipio, en una sola
 * transacción. Los de otros municipios no se tocan. El orden va de hijos a
 * padres. La configuración del municipio (sectores, servicios, pesos) no se toca.
 */
export async function borrarDatosDemo(db: PrismaClient, municipioId: string) {
  const lotes = (await db.loteDemo.findMany({ where: { municipioId }, select: { id: true } })).map((l) => l.id);
  if (!lotes.length) return 0;
  const esDemo = { loteDemoId: { in: lotes } };
  const operativosDemo = { operativo: esDemo };
  const publicacionesDemo = { publicacion: esDemo };

  // Transacción interactiva con plazo amplio: con la base remota (Turso), 26
  // borrados seguidos superan los 5 s del plazo por omisión.
  return db.$transaction(
    async (tx) => {
      const pasos = [
        // Publicaciones para redes preparadas con contenido de demostración (su bitácora se borra en cascada).
        () => tx.publicacionRed.deleteMany({ where: esDemo }),
        () => tx.notificacion.deleteMany({ where: esDemo }),
        () => tx.decisionPrioridad.deleteMany({ where: esDemo }),
        () => tx.avisoSector.deleteMany({ where: { aviso: esDemo } }),
        () => tx.aviso.deleteMany({ where: esDemo }),
        () => tx.invitacionOperativo.deleteMany({ where: { OR: [esDemo, { operativo: esDemo }, { persona: esDemo }] } }),
        () => tx.atencion.deleteMany({ where: esDemo }),
        () => tx.cupo.deleteMany({ where: esDemo }),
        () => tx.capacidadServicio.deleteMany({ where: operativosDemo }),
        () => tx.resultadoOperativo.deleteMany({ where: operativosDemo }),
        () => tx.asignacionTerreno.deleteMany({ where: operativosDemo }),
        () => tx.operativo.deleteMany({ where: esDemo }),
        () => tx.postulacionAdopcion.deleteMany({ where: esDemo }),
        () => tx.fichaAdopcion.deleteMany({ where: esDemo }),
        () => tx.coincidencia.deleteMany({ where: { OR: [{ perdida: esDemo }, { encontrada: esDemo }] } }),
        () => tx.conversacion.deleteMany({ where: { OR: [publicacionesDemo, { ficha: esDemo }] } }),
        () => tx.publicacionMascota.deleteMany({ where: esDemo }),
        () => tx.reporteCiudadano.deleteMany({ where: esDemo }),
        // Novedades y cuidadores de perros o personas de demostración.
        () => tx.novedadComunitario.deleteMany({ where: { OR: [{ perro: esDemo }, { persona: esDemo }] } }),
        () => tx.cuidadorAutorizado.deleteMany({ where: { OR: [{ perro: esDemo }, { persona: esDemo }] } }),
        () => tx.perroComunitario.deleteMany({ where: esDemo }),
        () => tx.solicitudServicio.deleteMany({ where: esDemo }),
        () => tx.animal.deleteMany({ where: esDemo }),
        () => tx.persona.deleteMany({ where: esDemo }),
        () => tx.usuarioMunicipal.deleteMany({ where: esDemo }),
        () => tx.loteDemo.deleteMany({ where: { id: { in: lotes } } }),
      ];
      let total = 0;
      for (const paso of pasos) total += (await paso()).count;
      return total;
    },
    { timeout: 120_000, maxWait: 20_000 },
  );
}
