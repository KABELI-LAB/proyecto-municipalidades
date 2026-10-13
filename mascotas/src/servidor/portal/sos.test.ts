// SOS Mascotas de punta a punta sobre la demo cargada: categorías vigentes,
// foto privada sin metadatos, historial, seguimiento en Mis
// solicitudes y la ruta del panel que entrega la foto solo con permiso.
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// La ruta de la foto pregunta por la sesión: aquí se simula quién la pide,
// aplicando las reglas reales de permisos.
type Sesion = { id: string; nombre: string; rol: "TERRENO" | "COORDINADOR" | "COMUNICACIONES"; municipioId: string; loteDemoId: null };
let sesion: Sesion | null = null;
vi.mock("@/servidor/auth", async () => {
  const { puede } = await import("@/dominio/permisos");
  return { autorizar: async (p: Parameters<typeof puede>[1]) => (sesion && puede(sesion.rol, p) ? sesion : null) };
});

const PERSONA = { nombre: "Persona SOS", rut: "11.111.111-1", telefono: "912345678", correo: "" };
const ALMACEN = mkdtempSync(join(tmpdir(), "tenencia-almacen-"));

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let acciones: typeof import("./acciones");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.ALMACEN_DIR = ALMACEN;
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  acciones = await import("./acciones");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

async function datos(extra: Record<string, string> = {}) {
  const quilico = await db.localidad.findUniqueOrThrow({ where: { clave: "quilico" } });
  return {
    tipo: "animal herido",
    urgencia: "URGENTE",
    especie: "PERRO",
    cantidad: "UNO",
    sigueEnLugar: "SI",
    descripcion: "Perro cojeando cerca de la cancha, no apoya una pata.",
    localidadId: quilico.id,
    ...PERSONA,
    ...extra,
  };
}

/** Una foto PNG grande con metadatos EXIF, como la que sacaría un celular. */
const fotoConMetadatos = () =>
  sharp({ create: { width: 2400, height: 1800, channels: 3, background: { r: 120, g: 90, b: 60 } } })
    .png()
    .withExif({ IFD0: { Make: "Celular de prueba" } })
    .toBuffer();

function formulario(campos: Record<string, string>, foto?: Buffer | string) {
  const f = new FormData();
  f.set("datos", JSON.stringify(campos));
  if (foto) f.set("foto", new Blob([typeof foto === "string" ? foto : new Uint8Array(foto)]), "foto");
  return f;
}

describe("SOS Mascotas", () => {
  it("ofrece solo las seis categorías vigentes y rechaza las antiguas", async () => {
    const { tiposReporte } = await import("./consultas");
    expect((await tiposReporte()).map((t) => t.nombre)).toEqual([
      "Animal herido o enfermo",
      "Posible maltrato o abandono",
      "Animal agresivo o en peligro",
      "Perro comunitario que necesita atención",
      "Animal atrapado o en una situación de riesgo",
      "Otra situación de bienestar animal",
    ]);
    expect(await acciones.reportarSituacion(await datos({ tipo: "abandono" }))).toMatchObject({ ok: false, errores: { tipo: expect.any(String) } });
  });

  it("guarda la foto reducida, sin metadatos y fuera de la carpeta pública; anota el primer paso del historial", async () => {
    const r = await acciones.reportarSituacion(formulario(await datos(), await fotoConMetadatos()));
    expect(r.ok).toBe(true);
    const rep = await db.reporteCiudadano.findFirstOrThrow({ where: { codigo: r.ok ? r.codigo : "" }, include: { historial: true } });
    expect([rep.urgencia, rep.estado]).toEqual([null, "ABIERTO"]); // ya no se pregunta la urgencia
    expect(rep.historial.map((h) => [h.estado, h.usuarioId])).toEqual([["ABIERTO", null]]);
    expect(rep.fotoArchivo).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    const ruta = join(ALMACEN, "reportes", rep.fotoArchivo!);
    expect(existsSync(ruta)).toBe(true);
    const meta = await sharp(ruta).metadata();
    expect([meta.format, Math.max(meta.width!, meta.height!), meta.exif]).toEqual(["jpeg", 1600, undefined]);
  });

  it("rechaza un archivo que no es una imagen y no registra el reporte", async () => {
    const antes = await db.reporteCiudadano.count();
    const archivos = readdirSync(join(ALMACEN, "reportes")).length;
    expect(await acciones.reportarSituacion(formulario(await datos(), "<script>no soy una foto</script>"))).toMatchObject({ ok: false, errores: { foto: expect.any(String) } });
    expect(await db.reporteCiudadano.count()).toBe(antes);
    expect(readdirSync(join(ALMACEN, "reportes")).length).toBe(archivos);
  });

  it("en Mis solicitudes se ve como SOS Mascotas, recibido y aún sin revisar", async () => {
    const r = await acciones.reportarSituacion(await datos({ urgencia: "PRONTO" }));
    if (!r.ok) throw new Error("reporte");
    const c = await acciones.consultarSolicitudes({ rut: PERSONA.rut, codigo: r.codigo });
    if (!c.ok) throw new Error("consulta");
    expect(c.tramites.find((x) => x.codigo === r.codigo)).toMatchObject({ tipo: "SOS Mascotas", estado: { texto: "Recibido" }, nota: "Lo recibimos; aún no ha sido revisado." });
  });

  it("la foto se entrega solo a quien puede ver reportes, y nunca a una caché compartida", async () => {
    const { GET } = await import("@/app/panel/(protegido)/reportes/[id]/foto/route");
    const rep = await db.reporteCiudadano.findFirstOrThrow({ where: { fotoArchivo: { not: null } } });
    const pedir = (id: string) => GET(new Request("http://localhost/"), { params: Promise.resolve({ id }) });

    sesion = null;
    expect((await pedir(rep.id)).status).toBe(403);
    // Terreno y Comunicaciones no ven reportes (src/dominio/permisos.ts).
    sesion = { id: "x", nombre: "Terreno", rol: "TERRENO", municipioId: "hualane", loteDemoId: null };
    expect((await pedir(rep.id)).status).toBe(403);
    sesion = { id: "x", nombre: "Comunicaciones", rol: "COMUNICACIONES", municipioId: "hualane", loteDemoId: null };
    expect((await pedir(rep.id)).status).toBe(403);

    sesion = { id: "x", nombre: "Coordinación", rol: "COORDINADOR", municipioId: "hualane", loteDemoId: null };
    const ok = await pedir(rep.id);
    expect([ok.status, ok.headers.get("content-type"), ok.headers.get("cache-control")]).toEqual([200, "image/jpeg", "private, no-store"]);
    const sinFoto = await db.reporteCiudadano.findFirstOrThrow({ where: { fotoArchivo: null } });
    expect((await pedir(sinFoto.id)).status).toBe(404);
  });
});
