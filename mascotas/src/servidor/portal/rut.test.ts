// Trámites sin RUT: se guardan con el contacto de la persona y no chocan entre sí.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let acciones: typeof import("@/servidor/portal/acciones");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  process.env.SESION_SECRETO ??= "secreto-de-prueba";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  acciones = await import("@/servidor/portal/acciones");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

describe("RUT opcional al solicitar un servicio", () => {
  it("dos solicitudes sin RUT quedan con su contacto y sin RUT", async () => {
    const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
    const servicio = await db.servicio.findFirstOrThrow();
    const datos = { servicioId: servicio.id, especie: "GATO", nombreAnimal: "", sexo: "HEMBRA", tamano: "", edad: "36", localidadId: huerta.id, rut: "", telefono: "" };
    const a = await acciones.solicitarServicio({ ...datos, nombre: "Vecina sin RUT", correo: "a@ejemplo.cl" });
    const b = await acciones.solicitarServicio({ ...datos, nombre: "Vecino sin RUT", correo: "b@ejemplo.cl" });
    expect(a.ok && b.ok).toBe(true);
    const personas = await db.persona.findMany({ where: { correo: { in: ["a@ejemplo.cl", "b@ejemplo.cl"] } } });
    expect(personas).toHaveLength(2);
    expect(personas.every((p) => p.rut === null)).toBe(true);
  });

  it("un RUT mal escrito se rechaza aunque sea opcional", async () => {
    const r = await acciones.solicitarServicio({ servicioId: "x", especie: "GATO", nombreAnimal: "", sexo: "HEMBRA", tamano: "", edad: "36", localidadId: "x", nombre: "Vecina", rut: "12.345.678-9", telefono: "", correo: "c@ejemplo.cl" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errores?.rut).toBeTruthy();
  });
});
