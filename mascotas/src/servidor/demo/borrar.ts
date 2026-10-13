import type { PrismaClient } from "@/generated/prisma/client";

const esDemo = { loteDemoId: { not: null } };

/** ¿Queda algún registro de demostración? Controla la franja «Datos de demostración». */
export async function hayDatosDemo(db: PrismaClient): Promise<boolean> {
  return (await db.loteDemo.count()) > 0;
}

/**
 * Borra de una vez todos los datos de demostración, en una sola transacción.
 * El orden va de hijos a padres. La configuración del municipio (sectores,
 * servicios, pesos) no se toca.
 */
export async function borrarDatosDemo(db: PrismaClient) {
  const operativosDemo = { operativo: esDemo };
  const publicacionesDemo = { publicacion: esDemo };

  const pasos = [
    // Publicaciones para redes preparadas con contenido de demostración (su bitácora se borra en cascada).
    db.publicacionRed.deleteMany({ where: esDemo }),
    db.notificacion.deleteMany({ where: esDemo }),
    db.decisionPrioridad.deleteMany({ where: esDemo }),
    db.avisoSector.deleteMany({ where: { aviso: esDemo } }),
    db.aviso.deleteMany({ where: esDemo }),
    db.invitacionOperativo.deleteMany({ where: { OR: [esDemo, { operativo: esDemo }, { persona: esDemo }] } }),
    db.atencion.deleteMany({ where: esDemo }),
    db.cupo.deleteMany({ where: esDemo }),
    db.capacidadServicio.deleteMany({ where: operativosDemo }),
    db.resultadoOperativo.deleteMany({ where: operativosDemo }),
    db.asignacionTerreno.deleteMany({ where: operativosDemo }),
    db.operativo.deleteMany({ where: esDemo }),
    db.postulacionAdopcion.deleteMany({ where: esDemo }),
    db.fichaAdopcion.deleteMany({ where: esDemo }),
    db.coincidencia.deleteMany({ where: { OR: [{ perdida: esDemo }, { encontrada: esDemo }] } }),
    db.mensajeProtegido.deleteMany({ where: publicacionesDemo }),
    db.publicacionMascota.deleteMany({ where: esDemo }),
    db.reporteCiudadano.deleteMany({ where: esDemo }),
    // Novedades y cuidadores de perros o personas de demostración.
    db.novedadComunitario.deleteMany({ where: { OR: [{ perro: esDemo }, { persona: esDemo }] } }),
    db.cuidadorAutorizado.deleteMany({ where: { OR: [{ perro: esDemo }, { persona: esDemo }] } }),
    db.perroComunitario.deleteMany({ where: esDemo }),
    db.solicitudServicio.deleteMany({ where: esDemo }),
    db.animal.deleteMany({ where: esDemo }),
    db.persona.deleteMany({ where: esDemo }),
    db.usuarioMunicipal.deleteMany({ where: esDemo }),
    db.loteDemo.deleteMany({}),
  ];

  const resultados = await db.$transaction(pasos);
  return resultados.reduce((total, r) => total + r.count, 0);
}
