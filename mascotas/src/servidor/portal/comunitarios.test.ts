// Perros comunitarios a cargo de vecinos, sobre la demo cargada: un vecino
// registra al perro (o se hace cargo de uno sin cuidador) y queda como su
// cuidador; con su sesión (entra con su correo) lo gestiona desde Mis solicitudes; las
// novedades de los vecinos le llegan a él. El municipio no interviene.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";
import { SESION_VENCIDA } from "./sesionVecino";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
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

// Las novedades piden teléfono o correo; registrar o hacerse cargo exige correo.
const VECINA = { nombre: "Vecina que avisa", rut: "", telefono: "912345678", correo: "" };
const CUIDADORA = { nombre: "Cuidadora de la plaza", rut: "22.222.222-2", telefono: "987654321", correo: "cuidadora.plaza@correo.cl" };
const OTRO = { nombre: "Vecino de la sede", rut: "17.654.321-3", telefono: "911112222", correo: "vecino.sede@correo.cl" };

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let portal: typeof import("@/servidor/portal/acciones");
let comunidad: typeof import("@/servidor/portal/acciones-comunitarios");
let consultas: typeof import("@/servidor/portal/consultas");
/** Perro de la demo sin cuidador. */
const SIN_CUIDADOR = "com-01";

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.ALMACEN_DIR = mkdtempSync(join(tmpdir(), "tenencia-almacen-"));
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  portal = await import("@/servidor/portal/acciones");
  comunidad = await import("./acciones-comunitarios");
  consultas = await import("@/servidor/portal/consultas");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

const fotoPng = () => sharp({ create: { width: 900, height: 700, channels: 3, background: { r: 90, g: 70, b: 40 } } }).png().toBuffer();
const formulario = (valores: Record<string, string>, foto?: Buffer, extra: Record<string, string> = {}) => {
  const f = new FormData();
  f.set("datos", JSON.stringify(valores));
  for (const [k, v] of Object.entries(extra)) f.set(k, v);
  if (foto) f.set("foto", new Blob([new Uint8Array(foto)]), "foto.jpg");
  return f;
};
const DATOS = { apodo: "el del puente", lugarId: "", sexo: "MACHO", tamano: "GRANDE", colorPrincipal: "negro", rasgos: "", esterilizado: "NO_SE", vacunas: "NO", microchip: "NO" };

async function novedad(perroId: string, extra: Record<string, string> = {}) {
  const quilico = await db.localidad.findUniqueOrThrow({ where: { clave: "quilico" } });
  return portal.informarNovedad({ perroId, tipo: "SALUD", texto: "Cojea de la pata trasera desde ayer.", localidadId: quilico.id, ...VECINA, ...extra });
}

let perro = "";
let codigo = "";

describe("un vecino registra y cuida a un perro comunitario", () => {
  it("registrar exige foto; se publica de inmediato y quien lo registra queda como cuidador", async () => {
    const lugar = await db.lugar.findFirstOrThrow();
    const datos = { ...DATOS, lugarId: lugar.id, ...CUIDADORA };
    expect(await comunidad.registrarComunitario(formulario(datos))).toMatchObject({ ok: false, errores: { foto: expect.any(String) } });
    const r = await comunidad.registrarComunitario(formulario(datos, await fotoPng()));
    if (!r.ok) throw new Error(JSON.stringify(r));
    perro = r.id!;
    codigo = r.codigo!;
    const publica = await consultas.perroComunitario(perro);
    expect(publica?.apodo).toBe("el del puente");
    // La ficha pública dice que tiene un vecino a cargo, sin sus datos.
    const s = await consultas.seguimientoComunitario(perro);
    expect(s?.conCuidador).toBe(true);
    expect(JSON.stringify([s, publica])).not.toMatch(/Cuidadora de la plaza|987654321|22222222/);
    const { GET } = await import("@/app/(portal)/comunitarios/[id]/foto/route");
    expect((await GET(new Request("http://localhost/"), { params: Promise.resolve({ id: perro }) })).status).toBe(200);
  });

  it("en Mis solicitudes, con su sesión, aparece el perro a su cuidado", async () => {
    vecino.correo = CUIDADORA.correo;
    const c = await portal.misSolicitudes();
    if (!c.ok) throw new Error("consulta");
    expect(c.tramites.find((t) => t.codigo === codigo)).toMatchObject({ tipo: "Perro comunitario a tu cuidado", comunitario: { id: perro, apodo: "el del puente" } });
  });

  it("la novedad de un vecino le llega al cuidador (sin el contacto del vecino) y la marca como vista", async () => {
    const r = await novedad(perro);
    expect(r.ok).toBe(true);
    const aviso = await db.notificacion.findFirstOrThrow({ where: { destinatario: CUIDADORA.correo, asunto: "Novedad sobre el del puente" } });
    expect(aviso.contenido).toContain("Cojea de la pata trasera");
    expect(aviso.contenido).not.toContain(VECINA.telefono);

    vecino.correo = CUIDADORA.correo;
    const c = await portal.misSolicitudes();
    const t = c.ok ? c.tramites.find((x) => x.codigo === codigo) : undefined;
    expect(t?.comunitario?.novedades).toHaveLength(1);
    const n = r.ok ? r.codigo : "";
    vecino.correo = null;
    expect((await comunidad.marcarNovedadVista({ codigo, novedad: n })).ok).toBe(false); // sin sesión
    vecino.correo = OTRO.correo;
    expect((await comunidad.marcarNovedadVista({ codigo, novedad: n })).ok).toBe(false); // otra persona
    vecino.correo = CUIDADORA.correo;
    expect((await comunidad.marcarNovedadVista({ codigo, novedad: n })).ok).toBe(true);
    expect((await db.novedadComunitario.findUniqueOrThrow({ where: { codigo: n } })).estado).toBe("ACEPTADA");
    expect(await db.notificacion.count({ where: { destinatario: VECINA.telefono, asunto: "Tu novedad llegó" } })).toBe(1);
  });

  it("su cuidador anota que lo vio y actualiza la ficha; con otra sesión no puede", async () => {
    vecino.correo = null;
    expect((await comunidad.registrarVistoHoy({ codigo })).ok).toBe(false);
    vecino.correo = OTRO.correo;
    expect((await comunidad.registrarVistoHoy({ codigo })).ok).toBe(false);
    expect((await comunidad.fichaParaEditar({ codigo })).ok).toBe(false);
    vecino.correo = CUIDADORA.correo;
    expect((await comunidad.registrarVistoHoy({ codigo })).ok).toBe(true);
    expect((await consultas.seguimientoComunitario(perro))?.historial[0].texto).toBe("Revisado por su cuidador");

    const ficha = await comunidad.fichaParaEditar({ codigo });
    if (!ficha.ok) throw new Error(JSON.stringify(ficha));
    expect(ficha.valores.apodo).toBe("el del puente");
    const cambios = () => formulario({ ...ficha.valores, apodo: "el negro del puente", vacunas: "SI" }, undefined, { codigo });
    vecino.correo = OTRO.correo;
    expect((await comunidad.actualizarFichaComunitario(cambios())).ok).toBe(false);
    vecino.correo = CUIDADORA.correo;
    const r = await comunidad.actualizarFichaComunitario(cambios());
    expect(r.ok).toBe(true);
    const c = await db.perroComunitario.findUniqueOrThrow({ where: { id: perro }, include: { animal: true } });
    expect([c.apodo, c.animal.vacunasAlDia]).toEqual(["el negro del puente", true]);
  });

  it("desde la ficha, su cuidador entra con su sesión; con otro perro u otra sesión, no", async () => {
    vecino.correo = null;
    expect(await comunidad.entrarComoCuidador({ perroId: perro })).toEqual({ ok: false, mensaje: SESION_VENCIDA, sinSesion: true });
    vecino.correo = CUIDADORA.correo;
    const r = await comunidad.entrarComoCuidador({ perroId: perro });
    expect(r).toMatchObject({ ok: true, perro: { id: perro }, codigo });
    expect((await comunidad.entrarComoCuidador({ perroId: SIN_CUIDADOR })).ok).toBe(false);
    vecino.correo = OTRO.correo;
    expect((await comunidad.entrarComoCuidador({ perroId: perro })).ok).toBe(false);
  });

  it("un vecino no puede informar una atención", async () => {
    expect(await novedad(perro, { tipo: "ATENCION" })).toMatchObject({ ok: false, errores: { tipo: expect.any(String) } });
  });
});

describe("perros sin un vecino a cargo", () => {
  it("no reciben novedades: hay que hacerse cargo primero", async () => {
    expect(await novedad(SIN_CUIDADOR)).toMatchObject({ ok: false });
  });

  it("un vecino se hace cargo y queda como su cuidador; un segundo vecino ya no puede", async () => {
    expect((await consultas.seguimientoComunitario(SIN_CUIDADOR))?.conCuidador).toBe(false);
    const r = await comunidad.hacermeCargo({ perroId: SIN_CUIDADOR, ...OTRO });
    if (!r.ok) throw new Error(JSON.stringify(r));
    expect((await consultas.seguimientoComunitario(SIN_CUIDADOR))?.conCuidador).toBe(true);
    vecino.correo = OTRO.correo;
    expect((await comunidad.registrarVistoHoy({ codigo: r.codigo })).ok).toBe(true);
    expect((await comunidad.hacermeCargo({ perroId: SIN_CUIDADOR, ...CUIDADORA })).ok).toBe(false);
    expect((await novedad(SIN_CUIDADOR)).ok).toBe(true);
  });
});

describe("dar de baja", () => {
  it("su cuidador lo da de baja cuando ya no está: deja de mostrarse", async () => {
    vecino.correo = OTRO.correo;
    expect((await comunidad.darDeBajaComunitario({ codigo })).ok).toBe(false);
    expect(await consultas.perroComunitario(perro)).not.toBeNull();
    vecino.correo = CUIDADORA.correo;
    expect((await comunidad.darDeBajaComunitario({ codigo })).ok).toBe(true);
    expect(await consultas.perroComunitario(perro)).toBeNull();
    expect((await consultas.perrosComunitarios()).some((c) => c.id === perro)).toBe(false);
  });
});
