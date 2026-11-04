// Mapa ciudadano sobre la demo cargada: cada capa usa datos reales del
// sistema, agrupa por sector o lugar (sin marcas repetidas en un mismo punto),
// abre fichas públicas y no expone direcciones, contactos, cuidadores ni reportes.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let mapa: typeof import("./mapaCiudadano");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioPredeterminado } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioPredeterminado(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  mapa = await import("./mapaCiudadano");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

const puntos = (marcas: { centro: { lat: number; lng: number } }[]) => marcas.map((m) => `${m.centro.lat.toFixed(4)},${m.centro.lng.toFixed(4)}`);
const capas = ["mascotas", "adopcion", "operativos"] as const;

describe("mapa ciudadano", () => {
  it("ninguna capa dibuja dos marcas en el mismo punto, ni expone datos privados", async () => {
    const personas = await db.persona.findMany({ select: { telefono: true, correo: true, rut: true } });
    const cuidadores = (await db.perroComunitario.findMany({ select: { cuidadores: true } })).map((c) => c.cuidadores);
    for (const capa of capas) {
      const c = await mapa.mapaCiudadano(capa);
      const p = puntos(c.marcas);
      expect(new Set(p).size, capa).toBe(p.length);
      const texto = JSON.stringify(c);
      expect(texto, capa).not.toMatch(/reporte|cuidador|demo\.invalid/i);
      for (const x of personas) for (const v of [x.telefono, x.correo, x.rut]) if (v) expect(texto.includes(v), `${capa}: ${v}`).toBe(false);
      for (const v of cuidadores) expect(texto.includes(v), capa).toBe(false);
    }
  });

  it("perdidas y encontradas: los mismos avisos públicos, por sector, con fichas y posibles coincidencias como sugerencia", async () => {
    const c = await mapa.mapaCiudadano("mascotas");
    const total = c.marcas.reduce((n, m) => n + (m.cifras?.reduce((t, x) => t + x.valor, 0) ?? 0), 0);
    const { publicaciones } = await import("./consultas");
    expect(total).toBe((await publicaciones({})).length);
    const items = c.marcas.flatMap((m) => m.items);
    expect(items.every((i) => i.href.startsWith("/mascotas/"))).toBe(true);
    // pub-047 y pub-048: coincidencia sugerida de la demo, marcada sin afirmar que es el mismo animal.
    expect(items.find((i) => i.clave === "pub-047")?.etiqueta).toBe("Posible coincidencia: revisa el aviso");
  });

  it("adopción: solo fichas publicadas, en el sector donde está el animal", async () => {
    const c = await mapa.mapaCiudadano("adopcion");
    const enMapa = c.marcas.reduce((n, m) => n + Number(m.detalle.split(" ")[0]), 0);
    const { fichasAdopcion } = await import("./consultas");
    expect(enMapa).toBe((await fichasAdopcion()).length);
    expect(c.marcas.flatMap((m) => m.items).every((i) => i.href.startsWith("/adoptar/"))).toBe(true);
  });

  it("operativos: los publicados, con fecha, lugar y cupos por servicio", async () => {
    const c = await mapa.mapaCiudadano("operativos");
    const { operativosAbiertos } = await import("./consultas");
    const abiertos = await operativosAbiertos();
    expect(c.marcas.flatMap((m) => m.items).map((i) => i.clave).sort()).toEqual(abiertos.map((o) => o.id).sort());
    if (abiertos.length === 0) expect(c.vacio.enlace?.href).toBe("/servicio");
    for (const i of c.marcas.flatMap((m) => m.items)) expect(i.lineas.join(" ")).toMatch(/cupo|lista de espera/);
  });
});
