// Lecturas del ciclo de operativos en el panel.
import "server-only";
import { SOLICITUD_PENDIENTE } from "@/dominio/solicitudes";
import { municipioActivo } from "@/lib/municipio";
import type { UsuarioSesion } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { conOcupacion } from "@/servidor/panel/indicadores";

const municipioId = () => municipioActivo().id;
const incluir = { sector: true, lugar: true, capacidades: { include: { servicio: true } } } as const;

export async function listaOperativos() {
  const todos = await db.operativo.findMany({
    where: { sector: { municipioId: municipioId() } },
    include: { ...incluir, resultado: true },
    orderBy: { fecha: "desc" },
  });
  const activos = todos.filter((o) => ["BORRADOR", "PUBLICADO", "INSCRIPCIONES_CERRADAS", "EN_CURSO"].includes(o.estado)).reverse();
  return {
    programados: await conOcupacion(activos),
    cerrados: todos.filter((o) => o.estado === "CERRADO"),
    cancelados: todos.filter((o) => o.estado === "CANCELADO"),
  };
}

export async function detalleOperativo(id: string, conInscritos: boolean) {
  const o = await db.operativo.findFirst({
    where: { id, sector: { municipioId: municipioId() } },
    include: {
      ...incluir,
      resultado: true,
      creadoPor: { select: { nombre: true } },
      avisos: { include: { sectores: { include: { sector: true } } }, orderBy: { creadoEn: "desc" } },
      asignaciones: { include: { usuario: { select: { id: true, nombre: true } } } },
    },
  });
  if (!o) return null;
  const [conDatos] = await conOcupacion([o]);
  const cupos = conInscritos
    ? await db.cupo.findMany({
        where: { operativoId: id },
        include: {
          persona: { select: { nombre: true, telefono: true, correo: true } },
          animal: { select: { nombre: true, especie: true, sexo: true } },
          atencion: { select: { resultado: true } },
        },
        orderBy: [{ servicioId: "asc" }, { posicionEspera: "asc" }, { creadoEn: "asc" }],
      })
    : [];
  const espontaneas = await db.atencion.count({ where: { operativoId: id, cupoId: null } });
  // Invitaciones prioritarias con su historia (envío, plazo, respuesta, asignación, cierre).
  const invitaciones = conInscritos
    ? await db.invitacionOperativo.findMany({
        where: { operativoId: id },
        include: { persona: { select: { nombre: true } }, servicio: { select: { nombre: true } }, cupo: { select: { codigo: true } } },
        orderBy: [{ servicioId: "asc" }, { orden: "asc" }],
      })
    : [];
  return { ...conDatos, cupos, espontaneas, invitaciones };
}

/** Demanda pendiente por sector y servicio ({ sectorId: { servicioId: n } }), para sugerir cupos. */
export async function demandaPorSector() {
  const grupos = await db.solicitudServicio.groupBy({
    by: ["sectorId", "servicioId"],
    where: { estado: { in: [...SOLICITUD_PENDIENTE] }, sector: { municipioId: municipioId() } },
    _count: { _all: true },
  });
  const demanda: Record<string, Record<string, number>> = {};
  for (const g of grupos) (demanda[g.sectorId] ??= {})[g.servicioId] = g._count._all;
  return demanda;
}

export function usuariosTerreno() {
  return db.usuarioMunicipal.findMany({ where: { municipioId: municipioId(), rol: "TERRENO", activo: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } });
}

/** Lugares de referencia por sector, para elegir dónde se hace un operativo. */
export function lugares() {
  return db.lugar.findMany({ where: { sector: { municipioId: municipioId() } }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true, sectorId: true } });
}

/** Terreno solo opera su operativo asignado; coordinación y administración, cualquiera. */
export async function puedeOperar(usuario: UsuarioSesion, operativoId: string): Promise<boolean> {
  if (usuario.rol === "COORDINADOR" || usuario.rol === "ADMINISTRADOR") return true;
  if (usuario.rol !== "TERRENO") return false;
  return !!(await db.asignacionTerreno.findUnique({ where: { usuarioId_operativoId: { usuarioId: usuario.id, operativoId } } }));
}

/** Operativos que un usuario puede atender en terreno. */
export function operativosDeTerreno(usuario: UsuarioSesion) {
  return db.operativo.findMany({
    where: {
      sector: { municipioId: municipioId() },
      estado: { in: ["PUBLICADO", "INSCRIPCIONES_CERRADAS", "EN_CURSO"] },
      ...(usuario.rol === "TERRENO" ? { asignaciones: { some: { usuarioId: usuario.id } } } : {}),
    },
    include: { sector: true, lugar: true },
    orderBy: { fecha: "asc" },
  });
}

/** Lista de trabajo de terreno: inscritos presentes o por llegar, por servicio. */
export async function listaTerreno(operativoId: string) {
  const o = await db.operativo.findUnique({ where: { id: operativoId }, include: { sector: true, lugar: true, capacidades: { include: { servicio: true } } } });
  if (!o) return null;
  const cupos = await db.cupo.findMany({
    where: { operativoId, estado: { in: ["INVITADO", "CONFIRMADO", "ASISTIO", "NO_ASISTIO"] } },
    include: {
      persona: { select: { nombre: true } },
      animal: { select: { nombre: true, especie: true, sexo: true } },
      servicio: { select: { nombre: true } },
      atencion: { select: { resultado: true, observaciones: true } },
    },
    orderBy: [{ servicioId: "asc" }, { creadoEn: "asc" }],
  });
  const espontaneas = await db.atencion.findMany({
    where: { operativoId, cupoId: null },
    include: { animal: { select: { nombre: true, especie: true } }, servicio: { select: { nombre: true } } },
    orderBy: { realizadaEn: "desc" },
  });
  return { operativo: o, cupos, espontaneas };
}
