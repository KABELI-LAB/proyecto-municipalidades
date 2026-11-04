// Dos municipios en la misma base: cada uno ve solo lo suyo en el portal y en
// las cifras públicas, y una cuenta del panel no sirve en otro municipio.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
const OTRO = "otra-comuna";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

// El municipio de la «solicitud» se cambia en cada prueba.
let actual = "";
vi.mock("@/lib/municipio", async (original) => {
  const m = await original<typeof import("@/lib/municipio")>();
  return { ...m, municipioActivo: async () => ({ ...m.municipioPredeterminado(), id: actual || m.municipioPredeterminado().id }) };
});

let sesion: string | null = null;
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => (sesion ? { value: sesion } : undefined) }) }));

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let consultas: typeof import("./consultas");
let predeterminado = "";

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  process.env.SESION_SECRETO ??= "secreto-de-prueba-con-mas-de-32-caracteres";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioPredeterminado } = await import("@/lib/municipio");
  predeterminado = municipioPredeterminado().id;
  await cargarDemo(db, { municipio: municipioPredeterminado(), hoy: CORTE, contrasena: "contrasena-de-prueba" });

  // Un segundo municipio con un aviso, una ficha de adopción y un aviso municipal propios.
  await db.municipio.create({ data: { id: OTRO, nombre: "Otra", nombreOficial: "Ilustre Municipalidad de Otra" } });
  const sector = await db.sector.create({ data: { municipioId: OTRO, clave: "centro", nombre: "Centro", tipo: "URBANO" } });
  const localidad = await db.localidad.create({ data: { municipioId: OTRO, sectorId: sector.id, clave: "centro", nombre: "Centro" } });
  const persona = await db.persona.create({ data: { municipioId: OTRO, rut: "22222222-2", nombre: "Vecina de otra comuna", correo: "vecina@otra.invalid", sectorId: sector.id, localidadId: localidad.id } });
  const animal = await db.animal.create({ data: { municipioId: OTRO, especie: "PERRO", nombre: "Forastero", foto: "perros/imagen_08.webp", personaId: persona.id } });
  await db.publicacionMascota.create({
    data: { id: "pub-otra", tipo: "PERDIDA", especie: "PERRO", colorPrincipal: "negro", animalId: animal.id, sectorId: sector.id, localidadId: localidad.id, fechaEvento: new Date(), personaId: persona.id, vigenteHasta: new Date(Date.now() + 30 * 86_400_000), moderacion: "APROBADA" },
  });
  const animalFicha = await db.animal.create({ data: { municipioId: OTRO, especie: "GATO", nombre: "Gato forastero", foto: "gatos/07_gato_blanco_ventana.webp" } });
  await db.fichaAdopcion.create({ data: { id: "adp-otra", municipioId: OTRO, animalId: animalFicha.id, sectorId: sector.id } });
  await db.aviso.create({ data: { municipioId: OTRO, tipo: "INFORMACION", titulo: "Aviso de otra comuna", texto: "Solo para otra comuna.", vigenteDesde: new Date(Date.now() - 86_400_000), vigenteHasta: new Date(Date.now() + 86_400_000), estado: "PUBLICADO" } });
  consultas = await import("./consultas");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

describe("varios municipios en la misma base", () => {
  it("el portal de cada municipio muestra solo sus avisos, adopciones y avisos municipales", async () => {
    actual = predeterminado;
    const [publicas, fichas, avisos] = await Promise.all([consultas.publicaciones({}), consultas.fichasAdopcion(), consultas.avisosVigentes()]);
    expect(publicas.length).toBeGreaterThan(0);
    expect(publicas.some((p) => p.id === "pub-otra")).toBe(false);
    expect(fichas.some((f) => f.id === "adp-otra")).toBe(false);
    expect(avisos.some((a) => a.titulo === "Aviso de otra comuna")).toBe(false);
    expect(await consultas.publicacion("pub-otra")).toBeNull();

    actual = OTRO;
    expect((await consultas.publicaciones({})).map((p) => p.id)).toEqual(["pub-otra"]);
    expect((await consultas.fichasAdopcion()).map((f) => f.id)).toEqual(["adp-otra"]);
    expect((await consultas.avisosVigentes()).map((a) => a.titulo)).toEqual(["Aviso de otra comuna"]);
  });

  it("las cifras públicas cuentan solo lo del municipio", async () => {
    const { impactoDelPrograma } = await import("@/servidor/inteligencia");
    actual = OTRO;
    expect(await impactoDelPrograma(CORTE)).toMatchObject({ operativos: 0, atenciones: 0, adopciones: 0, reencuentros: 0 });
    actual = predeterminado;
    expect((await impactoDelPrograma(CORTE)).operativos).toBeGreaterThan(0);
  });

  it("una cuenta del panel sirve solo en su municipio", async () => {
    const { usuarioActual } = await import("@/servidor/auth");
    const u = await db.usuarioMunicipal.findFirstOrThrow({ where: { municipioId: predeterminado } });
    const { createHmac } = await import("node:crypto");
    const datos = Buffer.from(JSON.stringify({ u: u.id, exp: Date.now() + 3600e3 })).toString("base64url");
    sesion = `${datos}.${createHmac("sha256", process.env.SESION_SECRETO!).update(datos).digest("base64url")}`;
    actual = predeterminado;
    expect((await usuarioActual())?.id).toBe(u.id);
    actual = OTRO;
    expect(await usuarioActual()).toBeNull();
    sesion = null;
  });

  // Va al final: borra la demo del municipio predeterminado.
  it("borrar la demostración de un municipio no toca la de otro", async () => {
    const { borrarDatosDemo } = await import("@/servidor/demo/borrar");
    const lote = await db.loteDemo.create({ data: { municipioId: OTRO, descripcion: "Demo de otra comuna" } });
    const sector = await db.sector.findFirstOrThrow({ where: { municipioId: OTRO } });
    await db.persona.create({ data: { municipioId: OTRO, rut: "33333333-3", nombre: "Persona demo de otra comuna", sectorId: sector.id, loteDemoId: lote.id } });

    expect(await borrarDatosDemo(db, predeterminado)).toBeGreaterThan(0);
    expect(await db.loteDemo.count({ where: { municipioId: predeterminado } })).toBe(0);
    expect(await db.persona.count({ where: { loteDemoId: lote.id } })).toBe(1);

    await borrarDatosDemo(db, OTRO);
    expect(await db.loteDemo.count()).toBe(0);
    expect(await db.persona.count({ where: { loteDemoId: { not: null } } })).toBe(0);
  });
});
