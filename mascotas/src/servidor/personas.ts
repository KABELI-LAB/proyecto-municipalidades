import type { Prisma } from "@/generated/prisma/client";
import { normalizarRut } from "@/dominio/rut";

type DatosPersona = { nombre: string; rut?: string; telefono: string; correo: string };
type Ubicacion = { sectorId: string; localidadId: string };

/**
 * Busca a la persona por RUT o la crea. El ciudadano no tiene cuenta: si ya
 * existe, no sobrescribimos su nombre ni su contacto con datos sin verificar;
 * solo completamos el contacto que faltaba.
 *
 * Sin RUT (trámites que no lo piden: SOS, avistamiento, novedad y, si la
 * persona prefiere, solicitar un servicio) se crea una persona solo con su
 * contacto; ese trámite no aparece en Mis solicitudes.
 */
export async function obtenerPersona(tx: Prisma.TransactionClient, municipioId: string, d: DatosPersona, u: Ubicacion) {
  const telefono = d.telefono || null;
  // El correo se guarda en minúsculas: así se compara al entrar a Mis solicitudes.
  const correo = d.correo ? d.correo.trim().toLowerCase() : null;
  if (!d.rut?.trim()) {
    return tx.persona.create({ data: { municipioId, rut: null, nombre: d.nombre, telefono, correo, sectorId: u.sectorId, localidadId: u.localidadId } });
  }
  const rut = normalizarRut(d.rut);
  if (!rut) throw new Error("RUT no válido");

  const existente = await tx.persona.findUnique({ where: { municipioId_rut: { municipioId, rut } } });
  if (!existente) {
    return tx.persona.create({ data: { municipioId, rut, nombre: d.nombre, telefono, correo, sectorId: u.sectorId, localidadId: u.localidadId } });
  }
  if ((!existente.telefono && telefono) || (!existente.correo && correo)) {
    return tx.persona.update({
      where: { id: existente.id },
      data: { telefono: existente.telefono ?? telefono, correo: existente.correo ?? correo },
    });
  }
  return existente;
}
