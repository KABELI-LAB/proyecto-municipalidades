// Mascotas perdidas y avistadas sobre la demo cargada: aviso con foto opcional
// (pública solo mientras está vigente), avistamiento vinculado a un aviso de
// pérdida como posible coincidencia (nunca como confirmación) y el próximo
// operativo que destaca la portada.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/servidor/auth", () => ({ autorizar: async () => null }));
const VECINO = { nombre: "Vecino que la vio", rut: "11.111.111-1", telefono: "912345678", correo: "" };

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let acciones: typeof import("./acciones");
let consultas: typeof import("./consultas");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.ALMACEN_DIR = mkdtempSync(join(tmpdir(), "tenencia-almacen-"));
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  acciones = await import("./acciones");
  consultas = await import("./consultas");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

const foto = () => sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 140, g: 100, b: 60 } } }).png().toBuffer();

async function avistamiento(extra: Record<string, string> = {}, conFoto = false) {
  const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
  const datos = new FormData();
  datos.set(
    "datos",
    JSON.stringify({
      tipo: "ENCONTRADA", especie: "PERRO", colorPrincipal: "café", tamano: "MEDIANO", sexo: "DESCONOCIDO", nombreAnimal: "", collar: "NO", colorCollar: "",
      microchip: "", senas: "Iba hacia el puente, sin collar.", fechaEvento: (await import("@/servidor/formato")).hoyISO(), resguardada: "no",
      localidadId: huerta.id, vinculo: "", ...VECINO, ...extra,
    }),
  );
  if (conFoto) datos.set("foto", new Blob([new Uint8Array(await foto())], { type: "image/png" }), "foto.png");
  const r = await acciones.publicarMascota(datos);
  if (!r.ok) throw new Error(JSON.stringify(r));
  return db.publicacionMascota.findFirstOrThrow({ where: { codigo: r.codigo } });
}

/** Lo que hace «Aceptar y publicar» en el panel: desde ahí el aviso es público. */
const aceptar = (id: string) => db.publicacionMascota.update({ where: { id }, data: { moderacion: "APROBADA" } });

const pedirFoto = async (id: string) => {
  const { GET } = await import("@/app/(portal)/mascotas/[id]/foto/route");
  return (await GET(new Request("http://localhost/"), { params: Promise.resolve({ id }) })).status;
};

describe("aviso de mascota avistada", () => {
  it("la foto es opcional; si se adjunta, se ve solo mientras el aviso está vigente y visible", async () => {
    const sinFoto = await avistamiento();
    expect(sinFoto.fotoUrl).toBeNull();
    expect(await pedirFoto(sinFoto.id)).toBe(404);

    const p = await avistamiento({}, true);
    expect(p.fotoUrl).toMatch(/^subida:/);
    // Hasta que el municipio lo acepta, ni el aviso ni su foto son públicos.
    expect(await pedirFoto(p.id)).toBe(404);
    await aceptar(p.id);
    expect(await pedirFoto(p.id)).toBe(200);
    // Aparece en el listado público, que muestra solo avisos con foto.
    const { fotoDeAviso } = await import("@/componentes/portal/fotoAviso");
    expect(fotoDeAviso(p)).toEqual({ src: `/mascotas/${p.id}/foto`, subida: true });

    await db.publicacionMascota.update({ where: { id: p.id }, data: { moderacion: "OCULTA" } });
    expect(await pedirFoto(p.id)).toBe(404);
    await db.publicacionMascota.update({ where: { id: p.id }, data: { moderacion: "APROBADA", estado: "ARCHIVADA" } });
    expect(await pedirFoto(p.id)).toBe(404);
  });

  it("vinculado a un aviso de pérdida queda como posible coincidencia y avisa a quien la busca, sin afirmar que es el mismo animal", async () => {
    const antes = await db.notificacion.count();
    const p = await avistamiento({ vinculo: "pub-047" }, true);
    await aceptar(p.id);
    const c = await db.coincidencia.findUniqueOrThrow({ where: { perdidaId_encontradaId: { perdidaId: "pub-047", encontradaId: p.id } } });
    expect(c.estado).toBe("SUGERIDA");
    expect(c.motivos).toContain("Quien la vio indicó este aviso");
    const nuevas = await db.notificacion.findMany({ orderBy: { creadaEn: "desc" }, take: (await db.notificacion.count()) - antes });
    expect(nuevas.some((n) => n.contenido.includes("no podemos asegurar que sea el mismo animal"))).toBe(true);
    expect((await consultas.avistamientosVinculados("pub-047")).map((x) => x.id)).toContain(p.id);
    // Sin foto también queda vinculado y se avisa, pero no se muestra en el portal.
    const sinFoto = await avistamiento({ vinculo: "pub-047" });
    expect(await db.coincidencia.count({ where: { perdidaId: "pub-047", encontradaId: sinFoto.id } })).toBe(1);
    expect((await consultas.avistamientosVinculados("pub-047")).map((x) => x.id)).not.toContain(sinFoto.id);
  });

  it("rechaza vincular a un aviso que no existe o que no es de pérdida", async () => {
    await expect(avistamiento({ vinculo: "no-existe" })).rejects.toThrow("ya no está vigente");
    await expect(avistamiento({ vinculo: "pub-048" })).rejects.toThrow("ya no está vigente");
  });
});

describe("dónde está el animal avistado", () => {
  const intentar = async (extra: Record<string, string>) => {
    const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
    return acciones.publicarMascota({
      tipo: "ENCONTRADA", especie: "PERRO", colorPrincipal: "café", tamano: "MEDIANO", sexo: "DESCONOCIDO", nombreAnimal: "", collar: "NO", colorCollar: "",
      microchip: "", senas: "", fechaEvento: (await import("@/servidor/formato")).hoyISO(), resguardada: "no", localidadId: huerta.id, vinculo: "", ...VECINO, ...extra,
    });
  };

  it("retenido en otro lugar guarda la localidad, su sector y qué lugar es, y se muestra sin dirección", async () => {
    const quilico = await db.localidad.findUniqueOrThrow({ where: { clave: "quilico" }, include: { sector: true } });
    const p = await avistamiento({ resguardada: "lugar", resguardoLocalidadId: quilico.id, resguardoDetalle: "En una veterinaria del centro" }, true);
    expect([p.resguardada, p.resguardo, p.resguardoLocalidadId, p.resguardoDetalle]).toEqual([true, "OTRO_LUGAR", quilico.id, "En una veterinaria del centro"]);
    const { textoResguardo } = await import("@/dominio/etiquetas");
    await aceptar(p.id);
    const publico = await consultas.publicacion(p.id);
    expect(textoResguardo(publico!)).toBe(`Sí, está retenida en otro lugar, en ${quilico.nombre} (sector ${quilico.sector.nombre}): En una veterinaria del centro`);
  });

  it("con quien informa queda como tal; solo vista no guarda lugar", async () => {
    const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
    const conmigo = await avistamiento({ resguardada: "si", resguardoLocalidadId: huerta.id });
    expect([conmigo.resguardada, conmigo.resguardo, conmigo.resguardoDetalle]).toEqual([true, "CON_QUIEN_INFORMA", null]);
    const vista = await avistamiento({ resguardada: "no", resguardoLocalidadId: huerta.id, resguardoDetalle: "x" });
    expect([vista.resguardada, vista.resguardo, vista.resguardoLocalidadId, vista.resguardoDetalle]).toEqual([false, null, null, null]);
  });

  it("pide la localidad y qué lugar es, y rechaza teléfonos o localidades fuera de la lista", async () => {
    const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
    expect(await intentar({ resguardada: "lugar" })).toMatchObject({ ok: false, errores: { resguardoLocalidadId: expect.any(String), resguardoDetalle: expect.any(String) } });
    expect(await intentar({ resguardada: "lugar", resguardoLocalidadId: huerta.id, resguardoDetalle: "Llamar al 9 1234 5678" })).toMatchObject({ ok: false, errores: { resguardoDetalle: expect.stringContaining("teléfonos") } });
    expect(await intentar({ resguardada: "si", resguardoLocalidadId: "no-existe" })).toMatchObject({ ok: false, errores: { resguardoLocalidadId: expect.any(String) } });
  });
});

describe("próximo operativo de la portada", () => {
  // Los operativos de la demo se fechan desde el corte: «hoy» es el día del corte.
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${CORTE}T12:00:00-03:00`));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it("es el más cercano publicado desde hoy, con sus cupos por servicio", async () => {
    // En la demo el operativo de octubre queda en borrador: lo publicamos.
    expect(await consultas.proximoOperativo()).toBeNull();
    await db.operativo.updateMany({ where: { estado: "BORRADOR", fecha: { gte: new Date(`${CORTE}T00:00:00-03:00`) } }, data: { estado: "PUBLICADO" } });
    const o = await consultas.proximoOperativo();
    expect(o).not.toBeNull();
    if (!o) return;
    expect(["PUBLICADO", "INSCRIPCIONES_CERRADAS"]).toContain(o.estado);
    const posteriores = await db.operativo.findMany({ where: { estado: { in: ["PUBLICADO", "INSCRIPCIONES_CERRADAS"] }, fecha: { gte: new Date(`${CORTE}T00:00:00-03:00`) } }, select: { fecha: true } });
    for (const x of posteriores) expect(x.fecha.getTime()).toBeGreaterThanOrEqual(o.fecha.getTime());
    expect(o.lugar.localidad.nombre).toBeTruthy();
    expect(o.servicios.length).toBeGreaterThan(0);
    for (const s of o.servicios) expect(s.disponibles).toBeLessThanOrEqual(s.capacidad);
  });

  it("sin operativos publicados no inventa uno", async () => {
    await db.operativo.updateMany({ where: { estado: { in: ["PUBLICADO", "INSCRIPCIONES_CERRADAS"] } }, data: { estado: "BORRADOR" } });
    expect(await consultas.proximoOperativo()).toBeNull();
  });
});
