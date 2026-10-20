// Invitaciones prioritarias de punta a punta sobre la demo cargada (ope-05,
// La Huerta, en borrador): publicar invita sin duplicados y solo a servicios
// ofrecidos; la invitación retiene el cupo sin reservarlo; confirmar interés
// asigna el cupo si hay disponibilidad; rechazar o dejar vencer invita a la
// siguiente persona; límite por hogar; cancelar cierra; permisos.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";
import { SESION_VENCIDA } from "@/servidor/portal/sesionVecino";

const CORTE = "2026-10-06";
const OP = "ope-05";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// Estas pruebas cubren el motor de invitaciones: aquí se encienden. En la
// configuración del municipio están apagadas (las solicitudes solo miden la necesidad).
let invitacionesEncendidas = true;
vi.mock("@/lib/municipio", async (original) => {
  const m = await original<typeof import("@/lib/municipio")>();
  return { ...m, municipioActivo: () => ({ ...m.municipioActivo(), parametros: { ...m.municipioActivo().parametros, invitacionesPrioritarias: invitacionesEncendidas } }) };
});
type Sesion = { id: string; nombre: string; rol: "COORDINADOR" | "COMUNICACIONES"; municipioId: string; loteDemoId: null };
let sesion: Sesion | null = null;
// La sesión de Mis solicitudes vive en una cookie; fuera de una petición se simula en memoria.
const vecino = vi.hoisted(() => ({ correo: null as string | null }));
vi.mock("@/servidor/portal/sesionVecino", async (original) => {
  const m = await original<typeof import("@/servidor/portal/sesionVecino")>();
  const { municipioActivo } = await import("@/lib/municipio");
  return {
    ...m,
    abrirSesionVecino: async (c: string) => { vecino.correo = m.normalizarCorreo(c); },
    cerrarSesionVecino: async () => { vecino.correo = null; },
    correoDeSesion: async () => vecino.correo,
    filtroVecino: async () => (vecino.correo ? { municipioId: municipioActivo().id, correo: vecino.correo } : null),
  };
});
vi.mock("@/servidor/auth", async () => {
  const { puede } = await import("@/dominio/permisos");
  return { autorizar: async (p: Parameters<typeof puede>[1]) => (sesion && puede(sesion.rol, p) ? sesion : null) };
});

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let operativos: typeof import("@/servidor/panel/acciones-operativos");
let portal: typeof import("@/servidor/portal/acciones");
let inv: typeof import("./invitaciones");
let coordinacion: Sesion;
let servicio: Record<string, string>;
// Una vecina de La Huerta con tres perros que esperan esterilización (límite por hogar: 2).
const VECINA = { nombre: "Vecina con tres perros", rut: "33.333.333-3", telefono: "955554444", correo: "vecina.tres.perros@correo.cl" };

/** Entra a Mis solicitudes como esa persona (si la demo no le dio correo, se le asigna uno). */
async function entrarComo(persona: { id: string; correo: string | null }) {
  let correo = persona.correo;
  if (!correo) {
    correo = `persona.${persona.id.toLowerCase()}@correo.cl`;
    await db.persona.update({ where: { id: persona.id }, data: { correo } });
  }
  vecino.correo = correo;
}

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  operativos = await import("@/servidor/panel/acciones-operativos");
  portal = await import("@/servidor/portal/acciones");
  inv = await import("./invitaciones");
  const u = await db.usuarioMunicipal.findFirstOrThrow({ where: { rol: "COORDINADOR" } });
  coordinacion = { id: u.id, nombre: u.nombre, rol: "COORDINADOR", municipioId: "hualane", loteDemoId: null };
  servicio = Object.fromEntries((await db.servicio.findMany()).map((s) => [s.clave, s.id]));

  // Escenario: esterilización con solo 2 cupos (para que la demanda supere la oferta) y sin microchip (servicio no ofrecido).
  await db.capacidadServicio.update({ where: { operativoId_servicioId: { operativoId: OP, servicioId: servicio.esterilizacion } }, data: { cupos: 2 } });
  await db.capacidadServicio.delete({ where: { operativoId_servicioId: { operativoId: OP, servicioId: servicio.microchip } } });
  const { nuevoCodigo } = await import("@/servidor/codigos");
  const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
  const persona = await db.persona.create({ data: { municipioId: "hualane", rut: "33333333-3", nombre: VECINA.nombre, telefono: VECINA.telefono, correo: VECINA.correo, sectorId: huerta.sectorId, localidadId: huerta.id } });
  // Las más antiguas de la comuna: quedan primeras en la prioridad de su sector.
  for (let i = 0; i < 3; i++) {
    const animal = await db.animal.create({ data: { especie: "PERRO", nombre: `Perro ${i + 1}`, personaId: persona.id } });
    await db.solicitudServicio.create({
      data: { codigo: await nuevoCodigo(db), personaId: persona.id, animalId: animal.id, servicioId: servicio.esterilizacion, sectorId: huerta.sectorId, localidadId: huerta.id, creadaEn: new Date(2025, 0, i + 1) },
    });
  }
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

const abiertas = (servicioId?: string) => db.invitacionOperativo.findMany({ where: { operativoId: OP, estado: { in: ["ENVIADA", "INTERESADA"] }, ...(servicioId ? { servicioId } : {}) }, orderBy: { orden: "asc" }, include: { persona: true } });

describe("invitaciones prioritarias", () => {
  it("solo quien gestiona operativos puede publicar o actualizar invitaciones", async () => {
    sesion = { ...coordinacion, rol: "COMUNICACIONES" };
    expect((await operativos.publicar(OP)).ok).toBe(false);
    expect((await operativos.invitarNuevamente(OP)).ok).toBe(false);
  });

  it("publicar invita por prioridad hasta los cupos libres, solo a servicios ofrecidos, respetando el límite por hogar, y sin crear cupos", async () => {
    sesion = coordinacion;
    const cuposAntes = await db.cupo.count({ where: { operativoId: OP } });
    expect((await operativos.publicar(OP)).ok).toBe(true);
    expect(await db.cupo.count({ where: { operativoId: OP } })).toBe(cuposAntes); // invitar no es asignar

    const ester = await abiertas(servicio.esterilizacion);
    // 2 cupos: la vecina tiene las 3 solicitudes más antiguas, pero el límite por hogar le deja 2.
    expect(ester.map((i) => i.persona.rut)).toEqual(["33333333-3", "33333333-3"]);
    expect(await db.invitacionOperativo.count({ where: { operativoId: OP, servicioId: servicio.microchip } })).toBe(0);

    const vac = await abiertas(servicio.vacunacion);
    expect(vac.length).toBeGreaterThan(0);
    expect(vac.length).toBeLessThanOrEqual(40);
    const solicitudes = await db.solicitudServicio.findMany({ where: { id: { in: [...ester, ...vac].map((i) => i.solicitudId) } } });
    expect(solicitudes.every((s) => s.estado === "INVITADO")).toBe(true);
  });

  it("los cupos retenidos no se ofrecen al público, y actualizar no duplica invitaciones", async () => {
    sesion = coordinacion;
    const { operativo } = await import("@/servidor/portal/consultas");
    const o = await operativo(OP);
    expect(o?.servicios.find((s) => s.clave === "esterilizacion")?.disponibles).toBe(0);
    const antes = await db.invitacionOperativo.count({ where: { operativoId: OP } });
    expect((await operativos.invitarNuevamente(OP)).ok).toBe(true);
    expect(await db.invitacionOperativo.count({ where: { operativoId: OP } })).toBe(antes);
  });

  it("confirmar interés asigna el cupo efectivo; la invitación y el aviso se ven en Mis solicitudes", async () => {
    const [primera] = await abiertas(servicio.esterilizacion);
    // Sin sesión no se puede responder.
    vecino.correo = null;
    expect(await portal.responderInvitacion({ codigo: primera.codigo, accion: "interes" })).toEqual({ ok: false, mensaje: SESION_VENCIDA });
    // Con la sesión de otra persona, tampoco.
    vecino.correo = "otra.persona@correo.cl";
    expect((await portal.responderInvitacion({ codigo: primera.codigo, accion: "interes" })).ok).toBe(false);
    expect((await db.invitacionOperativo.findUniqueOrThrow({ where: { id: primera.id } })).estado).toBe("ENVIADA");
    vecino.correo = VECINA.correo;
    const r = await portal.responderInvitacion({ codigo: primera.codigo, accion: "interes" });
    expect(r).toMatchObject({ ok: true, mensaje: expect.stringContaining("Te asignamos el cupo") });
    const i = await db.invitacionOperativo.findUniqueOrThrow({ where: { id: primera.id }, include: { cupo: true, solicitud: true } });
    expect([i.estado, i.cupo?.estado, i.solicitud.estado, i.respondidaEn !== null, i.asignadaEn !== null]).toEqual(["ASIGNADA", "CONFIRMADO", "CUPO_CONFIRMADO", true, true]);
    // Ya respondida: no se puede responder de nuevo.
    expect((await portal.responderInvitacion({ codigo: primera.codigo, accion: "rechazo" })).ok).toBe(false);

    const c = await portal.misSolicitudes();
    if (!c.ok) throw new Error("consulta");
    expect(c.tramites.find((t) => t.codigo === primera.codigo)).toMatchObject({ tipo: "Invitación prioritaria a operativo", estado: { texto: "Cupo asignado" } });
    expect(c.avisos.some((a) => a.asunto === "Invitación prioritaria a un operativo")).toBe(true);
    expect(c.avisos.some((a) => a.asunto === "Te asignamos un cupo")).toBe(true);
  });

  it("confirmar interés no reserva: sin cupo disponible queda esperando, y se asigna cuando se libera", async () => {
    const [segunda] = await abiertas(servicio.esterilizacion);
    vecino.correo = VECINA.correo;
    // El municipio redujo la capacidad a 1 (ya ocupada): no hay cupo para asignar.
    await db.capacidadServicio.update({ where: { operativoId_servicioId: { operativoId: OP, servicioId: servicio.esterilizacion } }, data: { cupos: 1 } });
    const r = await portal.responderInvitacion({ codigo: segunda.codigo, accion: "interes" });
    expect(r).toMatchObject({ ok: true, mensaje: expect.stringContaining("Aún no hay un cupo") });
    expect((await db.invitacionOperativo.findUniqueOrThrow({ where: { id: segunda.id } })).estado).toBe("INTERESADA");

    await db.capacidadServicio.update({ where: { operativoId_servicioId: { operativoId: OP, servicioId: servicio.esterilizacion } }, data: { cupos: 2 } });
    sesion = coordinacion;
    expect((await operativos.invitarNuevamente(OP)).mensaje).toContain("asignamos 1 cupo");
    expect((await db.invitacionOperativo.findUniqueOrThrow({ where: { id: segunda.id } })).estado).toBe("ASIGNADA");
  });

  it("rechazar devuelve la solicitud a la demanda e invita a la siguiente persona", async () => {
    await db.capacidadServicio.update({ where: { operativoId_servicioId: { operativoId: OP, servicioId: servicio.esterilizacion } }, data: { cupos: 3 } });
    sesion = coordinacion;
    await operativos.invitarNuevamente(OP);
    const [tercera] = await abiertas(servicio.esterilizacion);
    expect(tercera.persona.rut).not.toBe("33333333-3"); // la vecina ya tiene 2 cupos: límite por hogar
    await entrarComo(tercera.persona);
    const r = await portal.responderInvitacion({ codigo: tercera.codigo, accion: "rechazo" });
    expect(r.ok).toBe(true);
    const cerrada = await db.invitacionOperativo.findUniqueOrThrow({ where: { id: tercera.id }, include: { solicitud: true } });
    expect([cerrada.estado, cerrada.solicitud.estado]).toEqual(["RECHAZADA", "RECIBIDA"]);
    const [siguiente] = await abiertas(servicio.esterilizacion);
    expect(siguiente.id).not.toBe(tercera.id);
    expect(siguiente.orden).toBeGreaterThan(tercera.orden);
  });

  it("una invitación sin respuesta vence en su plazo e invita a la siguiente", async () => {
    const [pendiente] = await abiertas(servicio.esterilizacion);
    await db.invitacionOperativo.update({ where: { id: pendiente.id }, data: { venceEn: new Date(Date.now() - 60_000) } });
    const r = await inv.vencerInvitaciones(db);
    expect(r.vencidas).toBe(1);
    const vencida = await db.invitacionOperativo.findUniqueOrThrow({ where: { id: pendiente.id }, include: { solicitud: true } });
    expect([vencida.estado, vencida.solicitud.estado, vencida.motivoCierre]).toEqual(["VENCIDA", "RECIBIDA", "Venció el plazo sin respuesta"]);
    await entrarComo(pendiente.persona);
    expect((await portal.responderInvitacion({ codigo: pendiente.codigo, accion: "interes" })).ok).toBe(false);
    const [nueva] = await abiertas(servicio.esterilizacion);
    expect(nueva?.orden).toBeGreaterThan(pendiente.orden);
  });

  it("la inscripción pública queda en lista de espera si los cupos están ocupados o retenidos", async () => {
    const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
    const r = await portal.solicitarCupo({ operativoId: OP, servicioId: servicio.esterilizacion, especie: "PERRO", nombreAnimal: "Toby", sexo: "MACHO", tamano: "MEDIANO", edad: "36", nombre: "Persona del público", rut: "44.444.444-4", telefono: "966667777", correo: "persona.publico@correo.cl", localidadId: huerta.id });
    expect(r).toMatchObject({ ok: true, estado: "EN_LISTA_ESPERA" });
  });

  it("cancelar el operativo cierra las invitaciones abiertas y avisa", async () => {
    sesion = coordinacion;
    const abiertasAntes = await abiertas();
    expect(abiertasAntes.length).toBeGreaterThan(0);
    expect((await operativos.cancelar(OP)).ok).toBe(true);
    expect(await db.invitacionOperativo.count({ where: { operativoId: OP, estado: { in: ["ENVIADA", "INTERESADA"] } } })).toBe(0);
    const solicitudes = await db.solicitudServicio.findMany({ where: { id: { in: abiertasAntes.map((i) => i.solicitudId) } } });
    expect(solicitudes.every((s) => s.estado === "RECIBIDA")).toBe(true);
  });
});

describe("invitaciones apagadas (configuración actual del municipio)", () => {
  it("publicar no invita ni retiene cupos: la solicitud solo cuenta como necesidad", async () => {
    invitacionesEncendidas = false;
    try {
      const { invitarSiguientes } = await import("./invitaciones");
      const o = await db.operativo.findFirstOrThrow();
      const antes = await db.invitacionOperativo.count();
      const n = await db.$transaction((tx) => invitarSiguientes(tx, o.id));
      expect(n).toBe(0);
      expect(await db.invitacionOperativo.count()).toBe(antes);
    } finally {
      invitacionesEncendidas = true;
    }
  });
});
