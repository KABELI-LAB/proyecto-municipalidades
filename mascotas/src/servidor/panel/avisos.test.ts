// Avisos a vecinos como un CRUD simple y el resumen «Lo que piden los vecinos»,
// sobre la demo cargada.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("server-only", () => ({}));
type Sesion = { id: string; nombre: string; rol: "COORDINADOR" | "DIRECTIVO"; municipioId: string; loteDemoId: null };
let sesion: Sesion | null = null;
vi.mock("@/servidor/auth", async () => {
  const { puede } = await import("@/dominio/permisos");
  return { autorizar: async (p: Parameters<typeof puede>[1]) => (sesion && puede(sesion.rol, p) ? sesion : null) };
});

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let avisos: typeof import("./acciones-avisos");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  avisos = await import("./acciones-avisos");
  const u = await db.usuarioMunicipal.findFirstOrThrow({ where: { rol: "COORDINADOR" } });
  sesion = { id: u.id, nombre: u.nombre, rol: "COORDINADOR", municipioId: "hualane", loteDemoId: null };
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

const enDosSemanas = () => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

describe("avisos a vecinos", () => {
  it("crear lo publica de una vez para toda la comuna; eliminar lo borra", async () => {
    const r = await avisos.crearAviso({ tipo: "CAMPANA", titulo: "Campaña de vacunación", texto: "Vacunaremos en la plaza el [fecha].", hasta: enDosSemanas() });
    expect(r.ok).toBe(true);
    const a = await db.aviso.findUniqueOrThrow({ where: { id: r.id! }, include: { sectores: true } });
    expect([a.estado, a.sectores.length]).toEqual(["PUBLICADO", 0]);
    const { avisosVigentes } = await import("@/servidor/portal/consultas");
    expect((await avisosVigentes()).some((x) => x.id === a.id)).toBe(true);
    expect((await avisos.eliminarAviso(a.id)).ok).toBe(true);
    expect(await db.aviso.findUnique({ where: { id: a.id } })).toBeNull();
  });

  it("pide título, texto y una fecha que no sea pasada", async () => {
    const r = await avisos.crearAviso({ tipo: "CAMPANA", titulo: "", texto: "corto", hasta: "2020-01-01" });
    expect(r).toMatchObject({ ok: false, errores: { titulo: expect.any(String), texto: expect.any(String) } });
    expect(await avisos.crearAviso({ tipo: "CAMPANA", titulo: "Aviso de prueba", texto: "Texto suficiente para el aviso.", hasta: "2020-01-01" })).toMatchObject({ ok: false, errores: { hasta: expect.any(String) } });
  });

  it("sin permiso no crea ni elimina", async () => {
    const antes = sesion;
    sesion = antes && { ...antes, rol: "DIRECTIVO" };
    expect((await avisos.crearAviso({ tipo: "CAMPANA", titulo: "Aviso de prueba", texto: "Texto suficiente para el aviso.", hasta: enDosSemanas() })).ok).toBe(false);
    sesion = antes;
  });
});

describe("lo que piden los vecinos", () => {
  it("las cifras suman lo mismo por servicio y por sector", async () => {
    const { loQuePidenLosVecinos } = await import("./vecinos");
    const d = await loQuePidenLosVecinos();
    expect(d.cifras.solicitudes).toBeGreaterThan(0);
    expect(d.porServicio.reduce((t, s) => t + s.cantidad, 0)).toBe(d.cifras.solicitudes);
    expect(d.porSector.reduce((t, s) => t + s.solicitudes, 0)).toBe(d.cifras.solicitudes);
    expect(d.porTipo.reduce((t, s) => t + s.cantidad, 0)).toBe(d.cifras.reportes);
  });
});
