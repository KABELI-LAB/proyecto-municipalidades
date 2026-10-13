// Crear un operativo en un solo paso desde el panel: el sector sale del lugar y
// queda publicado, con las inscripciones abiertas en el portal.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
type Sesion = { id: string; nombre: string; rol: "COORDINADOR" | "COMUNICACIONES"; municipioId: string; loteDemoId: null };
let sesion: Sesion | null = null;
vi.mock("@/servidor/auth", async () => {
  const { puede } = await import("@/dominio/permisos");
  return { autorizar: async (p: Parameters<typeof puede>[1]) => (sesion && puede(sesion.rol, p) ? sesion : null) };
});

const ENTORNO = ["INSTAGRAM_USER_ID", "INSTAGRAM_ACCESS_TOKEN", "APP_URL"] as const;
const guardado = Object.fromEntries(ENTORNO.map((k) => [k, process.env[k]]));

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let operativos: typeof import("./acciones-operativos");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  for (const k of ENTORNO) delete process.env[k];
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  operativos = await import("./acciones-operativos");
}, 120_000);

afterAll(async () => {
  for (const [k, v] of Object.entries(guardado)) if (v !== undefined) process.env[k] = v;
  await db?.$disconnect();
  base?.borrar();
});

const enUnMes = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

describe("crear y publicar un operativo en un paso", () => {
  it("con lugar, fecha y cupos queda publicado en el sector del lugar", async () => {
    const u = await db.usuarioMunicipal.findFirstOrThrow({ where: { rol: "COORDINADOR" } });
    sesion = { id: u.id, nombre: u.nombre, rol: "COORDINADOR", municipioId: "hualane", loteDemoId: null };
    const lugar = await db.lugar.findFirstOrThrow();
    const servicio = await db.servicio.findFirstOrThrow({ where: { activo: true } });
    const r = await operativos.crearYPublicarOperativo({ lugarId: lugar.id, fecha: enUnMes(), horaInicio: "09:30", horaFin: "14:00", requisitos: "", capacidades: { [servicio.id]: 20 } });
    expect(r.ok).toBe(true);
    const o = await db.operativo.findUniqueOrThrow({ where: { id: (r as { id?: string }).id! }, include: { capacidades: true } });
    expect([o.estado, o.sectorId, o.lugarId, o.capacidades[0].cupos]).toEqual(["PUBLICADO", lugar.sectorId, lugar.id, 20]);
  });

  it("sin lugar, sin cupos o sin permiso, no crea nada", async () => {
    const antes = await db.operativo.count();
    const lugar = await db.lugar.findFirstOrThrow();
    expect(await operativos.crearYPublicarOperativo({ lugarId: "", fecha: enUnMes(), horaInicio: "09:30", horaFin: "14:00", requisitos: "", capacidades: {} })).toMatchObject({ ok: false, errores: { lugarId: expect.any(String) } });
    expect(await operativos.crearYPublicarOperativo({ lugarId: lugar.id, fecha: enUnMes(), horaInicio: "09:30", horaFin: "14:00", requisitos: "", capacidades: {} })).toMatchObject({ ok: false, errores: { capacidades: expect.any(String) } });
    sesion = sesion && { ...sesion, rol: "COMUNICACIONES" };
    expect((await operativos.crearYPublicarOperativo({ lugarId: lugar.id, fecha: enUnMes(), horaInicio: "09:30", horaFin: "14:00", requisitos: "", capacidades: { x: 5 } })).ok).toBe(false);
    expect(await db.operativo.count()).toBe(antes);
  });
});
