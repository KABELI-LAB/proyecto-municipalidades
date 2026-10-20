// Bandejas de revisión sobre la demo cargada: cambios de estado, avisos a la
// ciudadanía y compromisos de adopción.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
// Fuera de una petición no hay sesión ni caché de Next: se reemplazan.
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
const usuario = { id: "", nombre: "Coordinación", rol: "COORDINADOR", municipioId: "hualane", loteDemoId: null as string | null };
vi.mock("@/servidor/auth", () => ({ autorizar: async () => usuario }));

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let a: typeof import("./acciones-bandejas");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  // El historial de reportes guarda quién hizo cada cambio: una cuenta real de la demo.
  usuario.id = (await db.usuarioMunicipal.findFirstOrThrow({ where: { rol: "COORDINADOR" } })).id;
  a = await import("./acciones-bandejas");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

describe("reportes", () => {
  it("abierto → en revisión → cerrado; no se cierra dos veces", async () => {
    const r = await db.reporteCiudadano.findFirstOrThrow({ where: { estado: "ABIERTO" } });
    expect((await a.revisarReporte(r.id)).ok).toBe(true);
    expect((await a.revisarReporte(r.id)).ok).toBe(false);
    expect((await a.cerrarReporte(r.id)).ok).toBe(true);
    const cerrado = await db.reporteCiudadano.findUniqueOrThrow({ where: { id: r.id } });
    expect([cerrado.estado, cerrado.cerradoEn !== null]).toEqual(["CERRADO", true]);
    expect((await a.cerrarReporte(r.id)).ok).toBe(false);
    expect((await a.reabrirReporte(r.id)).ok).toBe(true);
    // Cada cambio queda en el historial, con quién lo hizo; los intentos rechazados no dejan rastro.
    const historial = await db.historialReporte.findMany({ where: { reporteId: r.id }, orderBy: { creadoEn: "asc" } });
    expect(historial.map((h) => [h.estado, h.usuarioId])).toEqual([
      ["EN_REVISION", usuario.id],
      ["CERRADO", usuario.id],
      ["EN_REVISION", usuario.id],
    ]);
  });

  it("la bandeja muestra primero lo que lleva más tiempo esperando y no expone el nombre del archivo de la foto", async () => {
    const { reportesBandeja } = await import("./bandejas");
    const r = await db.reporteCiudadano.findFirstOrThrow({ where: { estado: "ABIERTO" }, orderBy: { creadoEn: "asc" } });
    const lista = await reportesBandeja("ABIERTO");
    expect(lista[0].id).toBe(r.id);
    expect(lista[0]).not.toHaveProperty("fotoArchivo");
    expect(lista[0].tieneFoto).toBe(false);
  });
});

describe("publicaciones", () => {
  it("el equipo marca un aviso como reencontrado cuando le avisan por otra vía", async () => {
    const p = await db.publicacionMascota.findFirstOrThrow({ where: { estado: "ABIERTA", tipo: "PERDIDA", id: { notIn: ["pub-047", "pub-048"] } } });
    expect((await a.marcarReencontrada(p.id)).ok).toBe(true);
    const cerrada = await db.publicacionMascota.findUniqueOrThrow({ where: { id: p.id } });
    expect([cerrada.estado, cerrada.reencuentroPorCoincidencia, cerrada.resueltaEn !== null]).toEqual(["REENCONTRADA", null, true]);
    expect((await a.marcarReencontrada(p.id)).ok).toBe(false);
  });
});

describe("coincidencias", () => {
  it("el perro café con collar rojo: validar y registrar el reencuentro", async () => {
    const c = await db.coincidencia.findFirstOrThrow({ where: { perdidaId: "pub-047", encontradaId: "pub-048" } });
    const antes = await db.notificacion.count();
    expect((await a.validarCoincidencia(c.id)).ok).toBe(true);
    expect(await db.notificacion.count()).toBe(antes + 2); // a ambas personas
    expect((await a.registrarReencuentro(c.id)).ok).toBe(true);
    const pubs = await db.publicacionMascota.findMany({ where: { id: { in: ["pub-047", "pub-048"] } } });
    expect(pubs.map((p) => [p.estado, p.reencuentroPorCoincidencia])).toEqual([
      ["REENCONTRADA", true],
      ["REENCONTRADA", true],
    ]);
    // Un reencuentro registrado no se descarta después.
    expect((await a.descartarCoincidencia(c.id)).ok).toBe(false);
    expect((await db.coincidencia.findUniqueOrThrow({ where: { id: c.id } })).estado).toBe("VALIDADA");
  });
});

