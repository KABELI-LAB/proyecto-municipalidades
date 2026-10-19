// «Dar en adopción» de punta a punta sobre la demo cargada: propuesta con
// fotos, revisión municipal (correcciones, aprobación, rechazo, ocultar),
// catálogo público, fotos privadas hasta publicarse, duplicados, postulaciones
// que decide quien propuso (sin el municipio), cierre por el vecino y permisos.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";
import { SESION_VENCIDA } from "./sesionVecino";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
type Sesion = { id: string; nombre: string; rol: "COORDINADOR" | "COMUNICACIONES" | "DIRECTIVO"; municipioId: string; loteDemoId: null };
let sesion: Sesion | null = null;
vi.mock("@/servidor/auth", async () => {
  const { puede } = await import("@/dominio/permisos");
  return { autorizar: async (p: Parameters<typeof puede>[1]) => (sesion && puede(sesion.rol, p) ? sesion : null) };
});

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

const VECINA = { nombre: "Vecina que da en adopción", rut: "17.654.321-3", telefono: "912345678", correo: "vecina.adopcion@correo.cl" };
const OTRA = { nombre: "Otra vecina", rut: "22.222.222-2", telefono: "987654321", correo: "otra.vecina@correo.cl" };
const RUT_VECINA = "17654321-3";

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let portal: typeof import("./acciones");
let panel: typeof import("@/servidor/panel/acciones-bandejas");
let consultas: typeof import("./consultas");
let coordinacion: Sesion;

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.ALMACEN_DIR = mkdtempSync(join(tmpdir(), "tenencia-almacen-"));
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  portal = await import("./acciones");
  panel = await import("@/servidor/panel/acciones-bandejas");
  consultas = await import("./consultas");
  const u = await db.usuarioMunicipal.findFirstOrThrow({ where: { rol: "COORDINADOR" } });
  coordinacion = { id: u.id, nombre: u.nombre, rol: "COORDINADOR", municipioId: "hualane", loteDemoId: null };
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

/** Una foto distinta por color: la huella permite detectar la misma foto dos veces. */
const foto = (r: number, g: number, b: number) => sharp({ create: { width: 1200, height: 900, channels: 3, background: { r, g, b } } }).png().toBuffer();

async function campos(extra: Record<string, string> = {}) {
  const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
  return {
    corregir: "",
    nombreAnimal: "Canela",
    especie: "PERRO",
    sexo: "HEMBRA",
    edad: "24",
    tamano: "MEDIANO",
    esterilizado: "SI",
    vacunas: "NO_SE",
    microchip: "NO",
    caracter: "Tranquila y cariñosa, le gusta pasear. Convive bien con niños. Le vendría bien un hogar con patio.",
    relacion: "RESCATADO",
    autoriza: "SI",
    localidadId: huerta.id,
    ...VECINA,
    ...extra,
  };
}

function formulario(datos: Record<string, string>, fotos: Buffer[] = []) {
  const f = new FormData();
  f.set("datos", JSON.stringify(datos));
  fotos.forEach((b, i) => f.set(`foto${i}`, new Blob([new Uint8Array(b)]), `foto${i}.jpg`));
  return f;
}

async function proponer(datos: Record<string, string>, fotos: Buffer[]) {
  const r = await portal.proponerAdopcion(formulario(datos, fotos));
  if (!r.ok) throw new Error(JSON.stringify(r));
  return db.fichaAdopcion.findFirstOrThrow({ where: { codigo: r.codigo }, include: { animal: true } });
}

const enCatalogo = async (id: string) => (await consultas.fichasAdopcion()).some((f) => f.id === id);
async function pedirFoto(id: string) {
  const { GET } = await import("@/app/(portal)/adoptar/[id]/foto/[n]/route");
  return (await GET(new Request("http://localhost/"), { params: Promise.resolve({ id, n: "0" }) })).status;
}

describe("Dar en adopción", () => {
  it("pide al menos una foto y la declaración de autorización", async () => {
    expect(await portal.proponerAdopcion(formulario(await campos(), []))).toMatchObject({ ok: false, errores: { fotos: expect.any(String) } });
    expect(await portal.proponerAdopcion(formulario(await campos({ autoriza: "" }), [await foto(1, 2, 3)]))).toMatchObject({ ok: false, errores: { autoriza: expect.any(String) } });
  });

  it("queda en revisión, fuera del catálogo y con sus fotos privadas; «No sé» se guarda como dato desconocido", async () => {
    sesion = null;
    const f = await proponer(await campos(), [await foto(200, 120, 60), await foto(90, 60, 30)]);
    expect([f.revision, f.estado, f.autorizaPublicar, f.relacion]).toEqual(["PENDIENTE", "DISPONIBLE", true, "RESCATADO"]);
    expect(f.fotos.split(",")).toHaveLength(2);
    expect([f.animal.vacunasAlDia, f.conviveConAnimales, f.animal.esterilizado, f.animal.edadAproxMeses]).toEqual([null, null, true, 24]);
    // El animal no queda a nombre de quien lo rescató: solo si declara que es suyo.
    expect(f.animal.personaId).toBeNull();
    expect(await enCatalogo(f.id)).toBe(false);
    expect(await pedirFoto(f.id)).toBe(404);
    sesion = coordinacion;
    expect(await pedirFoto(f.id)).toBe(200);
    sesion = null;
  });

  it("evita duplicados: la misma foto en otra propuesta, o el mismo nombre dos veces por la misma persona", async () => {
    const repetidaFoto = await portal.proponerAdopcion(formulario(await campos({ nombreAnimal: "Otra", ...OTRA }), [await foto(200, 120, 60)]));
    expect(repetidaFoto).toMatchObject({ ok: false, errores: { fotos: expect.stringContaining("ya está en otra propuesta") } });
    const repetidoNombre = await portal.proponerAdopcion(formulario(await campos({ nombreAnimal: " canela " }), [await foto(5, 5, 5)]));
    expect(repetidoNombre).toMatchObject({ ok: false, mensaje: expect.stringContaining("Ya propusiste a") });
  });

  it("solo quien gestiona adopciones puede revisar propuestas", async () => {
    const f = await db.fichaAdopcion.findFirstOrThrow({ where: { revision: "PENDIENTE" } });
    sesion = { ...coordinacion, rol: "COMUNICACIONES" };
    expect((await panel.aprobarPropuesta(f.id)).ok).toBe(false);
    sesion = { ...coordinacion, rol: "DIRECTIVO" };
    expect((await panel.rechazarPropuesta(f.id, "Motivo suficientemente largo.")).ok).toBe(false);
    expect((await db.fichaAdopcion.findUniqueOrThrow({ where: { id: f.id } })).revision).toBe("PENDIENTE");
  });

  it("correcciones: el municipio las pide con motivo y la vecina corrige con su sesión; las fotos nuevas reemplazan a las anteriores", async () => {
    sesion = coordinacion;
    const f = await db.fichaAdopcion.findFirstOrThrow({ where: { revision: "PENDIENTE", animal: { nombre: "Canela" }, proponente: { rut: RUT_VECINA } } });
    expect((await panel.pedirCorrecciones(f.id, "corto")).ok).toBe(false);
    expect((await panel.pedirCorrecciones(f.id, "Agregue una foto donde se vea su cara.")).ok).toBe(true);

    vecino.correo = VECINA.correo;
    const c = await portal.misSolicitudes();
    if (!c.ok) throw new Error("consulta");
    expect(c.tramites.find((t) => t.codigo === f.codigo)).toMatchObject({
      tipo: "Dar en adopción",
      estado: { texto: "Requiere correcciones" },
      nota: expect.stringContaining("Agregue una foto donde se vea su cara."),
      propuesta: { corregir: true },
    });

    vecino.correo = null;
    expect(await portal.propuestaParaCorregir({ codigo: f.codigo })).toEqual({ ok: false, mensaje: SESION_VENCIDA });
    vecino.correo = OTRA.correo;
    expect(await portal.propuestaParaCorregir({ codigo: f.codigo })).toMatchObject({ ok: false });
    vecino.correo = VECINA.correo;
    const cargada = await portal.propuestaParaCorregir({ codigo: f.codigo });
    if (!cargada.ok) throw new Error("cargar");
    expect([cargada.fotos, cargada.valores.vacunas, cargada.valores.nombreAnimal]).toEqual([2, "NO_SE", "Canela"]);

    const corregir = async () => portal.proponerAdopcion(formulario({ ...cargada.valores, autoriza: "SI", vacunas: "SI" }, [await foto(10, 200, 10)]));
    // Corregir también exige la sesión de quien la propuso.
    vecino.correo = null;
    expect(await corregir()).toMatchObject({ ok: false, mensaje: SESION_VENCIDA });
    vecino.correo = OTRA.correo;
    expect((await corregir()).ok).toBe(false);
    vecino.correo = VECINA.correo;
    const r = await corregir();
    expect(r).toMatchObject({ ok: true, codigo: f.codigo, corregida: true });
    const corregida = await db.fichaAdopcion.findUniqueOrThrow({ where: { id: f.id }, include: { animal: true } });
    expect([corregida.revision, corregida.animal.vacunasAlDia, corregida.fotos.split(",").length, corregida.motivoRevision]).toEqual(["PENDIENTE", true, 1, null]);
  });

  it("aprobada: entra al catálogo con su foto pública; la postulación avisa a quien la propuso", async () => {
    sesion = coordinacion;
    const f = await db.fichaAdopcion.findFirstOrThrow({ where: { revision: "PENDIENTE", animal: { nombre: "Canela" }, proponente: { rut: RUT_VECINA } } });
    expect((await panel.aprobarPropuesta(f.id)).ok).toBe(true);
    expect((await panel.aprobarPropuesta(f.id)).ok).toBe(false);
    const aprobada = await db.fichaAdopcion.findUniqueOrThrow({ where: { id: f.id } });
    expect([aprobada.revision, aprobada.revisadoPorId]).toEqual(["APROBADA", coordinacion.id]);
    expect(await enCatalogo(f.id)).toBe(true);
    sesion = null;
    expect(await pedirFoto(f.id)).toBe(200);

    const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
    const antes = await db.notificacion.count();
    const postulacion = { fichaId: f.id, ...OTRA, localidadId: huerta.id, tipoVivienda: "casa con patio", experiencia: "SI", tieneOtros: "NO", otrosAnimales: "" };
    // Animal de un vecino: hay que aceptar que se compartan los contactos si le eligen.
    expect(await portal.postularAdopcion(postulacion)).toMatchObject({ ok: false, errores: { compartir: expect.any(String) } });
    const p = await portal.postularAdopcion({ ...postulacion, compartir: "SI" });
    expect(p.ok).toBe(true);
    // Una a quien postula y otra a quien propuso.
    expect(await db.notificacion.count()).toBe(antes + 2);
  });

  it("ocultar exige motivo, saca la ficha del catálogo y deja su foto privada; se puede volver a publicar", async () => {
    sesion = coordinacion;
    const f = await db.fichaAdopcion.findFirstOrThrow({ where: { revision: "APROBADA", animal: { nombre: "Canela" }, proponente: { rut: RUT_VECINA } } });
    expect((await panel.ocultarFichaAdopcion(f.id, "")).ok).toBe(false);
    expect((await panel.ocultarFichaAdopcion(f.id, "Recibimos un reclamo sobre la ficha.")).ok).toBe(true);
    expect(await enCatalogo(f.id)).toBe(false);
    sesion = null;
    expect(await pedirFoto(f.id)).toBe(404);
    sesion = coordinacion;
    expect((await panel.volverAPublicarFicha(f.id)).ok).toBe(true);
    expect(await enCatalogo(f.id)).toBe(true);
  });

  it("la vecina avisa que encontró hogar: sale del catálogo sin contar como adopción de la plataforma", async () => {
    const f = await db.fichaAdopcion.findFirstOrThrow({ where: { revision: "APROBADA", animal: { nombre: "Canela" }, proponente: { rut: RUT_VECINA } } });
    vecino.correo = null;
    expect(await portal.gestionarPropuesta({ codigo: f.codigo, accion: "encontro_hogar" })).toEqual({ ok: false, mensaje: SESION_VENCIDA });
    vecino.correo = OTRA.correo;
    expect((await portal.gestionarPropuesta({ codigo: f.codigo, accion: "encontro_hogar" })).ok).toBe(false);
    vecino.correo = VECINA.correo;
    expect(await portal.gestionarPropuesta({ codigo: f.codigo, accion: "encontro_hogar" })).toMatchObject({ ok: true });
    const cerrada = await db.fichaAdopcion.findUniqueOrThrow({ where: { id: f.id } });
    expect([cerrada.revision, cerrada.cierre, cerrada.estado]).toEqual(["RETIRADA", "ENCONTRO_HOGAR", "DISPONIBLE"]);
    expect(await enCatalogo(f.id)).toBe(false);
  });

  it("rechazada con motivo: no se publica y la vecina ve el motivo", async () => {
    sesion = coordinacion;
    const f = await proponer(await campos({ nombreAnimal: "Pelusa", especie: "GATO", tamano: "NO_SE" }), [await foto(30, 30, 200)]);
    expect((await panel.rechazarPropuesta(f.id, "La foto no corresponde a un animal.")).ok).toBe(true);
    expect(await enCatalogo(f.id)).toBe(false);
    vecino.correo = VECINA.correo;
    const c = await portal.misSolicitudes();
    if (!c.ok) throw new Error("consulta");
    expect(c.tramites.find((t) => t.codigo === f.codigo)).toMatchObject({ estado: { texto: "No publicada" }, nota: "No la publicamos. La foto no corresponde a un animal." });
  });
});

describe("las postulaciones a un animal de un vecino las decide esa persona, no el municipio", () => {
  const TERCERA = { nombre: "Tercera persona", rut: "33.333.333-3", telefono: "955554444", correo: "tercera.persona@correo.cl" };

  async function publicada() {
    sesion = null;
    const f = await proponer(await campos({ nombreAnimal: "Rocky", sexo: "MACHO" }), [await foto(120, 10, 200)]);
    sesion = coordinacion;
    expect((await panel.aprobarPropuesta(f.id)).ok).toBe(true);
    sesion = null;
    const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
    for (const quien of [OTRA, TERCERA]) {
      const r = await portal.postularAdopcion({ fichaId: f.id, ...quien, localidadId: huerta.id, tipoVivienda: "casa con patio", experiencia: "SI", tieneOtros: "NO", otrosAnimales: "", compartir: "SI" });
      expect(r.ok).toBe(true);
    }
    return f;
  }

  it("elige a una persona: se comparten los contactos de ambos; el municipio no puede intervenir", async () => {
    const f = await publicada();
    const yo = { codigo: f.codigo };

    // Sin contactos mientras no elige; nadie más ve las postulaciones.
    vecino.correo = null;
    expect(await portal.postulacionesDePropuesta({ codigo: f.codigo })).toMatchObject({ ok: false });
    vecino.correo = OTRA.correo;
    expect(await portal.postulacionesDePropuesta({ codigo: f.codigo })).toMatchObject({ ok: false });
    vecino.correo = VECINA.correo;
    const lista = await portal.postulacionesDePropuesta(yo);
    if (!lista.ok) throw new Error("lista");
    expect(lista.postulaciones.map((p) => [p.nombre, p.contacto, p.pendiente])).toEqual([
      ["Otra vecina", null, true],
      ["Tercera persona", null, true],
    ]);

    const [otra, tercera] = lista.postulaciones;
    // Sin sesión, o con otra, no se decide.
    vecino.correo = OTRA.correo;
    expect((await portal.decidirPostulacion({ ...yo, postulacionId: otra.id, accion: "elegir" })).ok).toBe(false);
    vecino.correo = null;
    expect((await portal.decidirPostulacion({ ...yo, postulacionId: otra.id, accion: "elegir" })).ok).toBe(false);
    vecino.correo = VECINA.correo;
    expect((await portal.decidirPostulacion({ ...yo, postulacionId: otra.id, accion: "elegir" })).ok).toBe(true);
    expect((await db.fichaAdopcion.findUniqueOrThrow({ where: { id: f.id } })).estado).toBe("EN_PROCESO");
    // Solo una persona elegida a la vez.
    expect((await portal.decidirPostulacion({ ...yo, postulacionId: tercera.id, accion: "elegir" })).ok).toBe(false);

    const despues = await portal.postulacionesDePropuesta(yo);
    if (!despues.ok) throw new Error("lista");
    expect(despues.postulaciones.find((p) => p.id === otra.id)?.contacto).toContain("987654321");
    expect(despues.postulaciones.find((p) => p.id === tercera.id)?.contacto).toBeNull();

    // Quien fue elegida ve el contacto de quien da en adopción en Mis solicitudes.
    const suya = await db.postulacionAdopcion.findUniqueOrThrow({ where: { id: otra.id } });
    vecino.correo = OTRA.correo;
    const c = await portal.misSolicitudes();
    if (!c.ok) throw new Error("consulta");
    const persona = await db.persona.findFirstOrThrow({ where: { id: f.proponenteId! } });
    expect(c.tramites.find((t) => t.codigo === suya.codigo)?.nota).toContain(persona.telefono!);
  });

  it("si no se concreta, la ficha vuelve a estar disponible; si se concreta, queda adoptada con sus compromisos", async () => {
    const f = await db.fichaAdopcion.findFirstOrThrow({ where: { animal: { nombre: "Rocky" }, proponente: { rut: RUT_VECINA } } });
    const yo = { codigo: f.codigo };
    vecino.correo = VECINA.correo;
    const lista = await portal.postulacionesDePropuesta(yo);
    if (!lista.ok) throw new Error("lista");
    const [otra, tercera] = lista.postulaciones;

    expect((await portal.decidirPostulacion({ ...yo, postulacionId: otra.id, accion: "no_concreto" })).ok).toBe(true);
    expect((await db.fichaAdopcion.findUniqueOrThrow({ where: { id: f.id } })).estado).toBe("DISPONIBLE");
    expect((await db.postulacionAdopcion.findUniqueOrThrow({ where: { id: otra.id } })).estado).toBe("NO_SELECCIONADA");

    expect((await portal.decidirPostulacion({ ...yo, postulacionId: tercera.id, accion: "elegir" })).ok).toBe(true);
    expect((await portal.decidirPostulacion({ ...yo, postulacionId: tercera.id, accion: "adoptado" })).ok).toBe(true);
    const adoptada = await db.fichaAdopcion.findUniqueOrThrow({ where: { id: f.id }, include: { adoptante: true } });
    expect([adoptada.estado, adoptada.adoptante?.nombre]).toEqual(["ADOPTADO", "Tercera persona"]);
    // Rocky no tenía microchip: queda ese compromiso a nombre de quien adopta.
    expect(await db.solicitudServicio.count({ where: { personaId: adoptada.adoptanteId!, origen: "COMPROMISO_ADOPCION" } })).toBe(1);
    expect(await enCatalogo(f.id)).toBe(false);
  });
});
