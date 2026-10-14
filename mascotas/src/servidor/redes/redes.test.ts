// Publicación inmediata en Instagram sobre la demo cargada: el aviso de un
// vecino espera la aceptación del municipio y, al aceptarlo, se ve en el
// portal y sale a Instagram; operativos y adopciones salen al publicarse.
// Sin credenciales solo se publica en la web. La API de Instagram se simula
// solo dentro de esta prueba.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
type Sesion = { id: string; nombre: string; rol: "COORDINADOR" | "COMUNICACIONES" | "DIRECTIVO" | "ADMINISTRADOR"; municipioId: string; loteDemoId: null };
let sesion: Sesion | null = null;
vi.mock("@/servidor/auth", async () => {
  const { puede } = await import("@/dominio/permisos");
  return { autorizar: async (p: Parameters<typeof puede>[1]) => (sesion && puede(sesion.rol, p) ? sesion : null) };
});

// RUT que no está en la demo: la vecina es una persona real, no de demostración.
const VECINA = { nombre: "Vecina que perdió su perro", rut: "15.234.567-4", telefono: "912345678", correo: "" };

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let bandejas: typeof import("@/servidor/panel/acciones-bandejas");
let redes: typeof import("@/servidor/panel/acciones-redes");
let servicio: typeof import("./servicio");
let consultas: typeof import("@/servidor/portal/consultas");
const sesionDe = async (rol: Sesion["rol"]): Promise<Sesion> => {
  const u = await db.usuarioMunicipal.findFirstOrThrow({ where: { rol } });
  return { id: u.id, nombre: u.nombre, rol, municipioId: "hualane", loteDemoId: null };
};

const ENTORNO = ["INSTAGRAM_USER_ID", "INSTAGRAM_ACCESS_TOKEN", "APP_URL"] as const;
const guardado = Object.fromEntries(ENTORNO.map((k) => [k, process.env[k]]));

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.ALMACEN_DIR = mkdtempSync(join(tmpdir(), "tenencia-almacen-"));
  process.env.MUNICIPIO ??= "hualane";
  process.env.SESION_SECRETO ??= "secreto-de-prueba";
  for (const k of ENTORNO) delete process.env[k];
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  bandejas = await import("@/servidor/panel/acciones-bandejas");
  redes = await import("@/servidor/panel/acciones-redes");
  servicio = await import("./servicio");
  consultas = await import("@/servidor/portal/consultas");
}, 120_000);

afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of ENTORNO) delete process.env[k];
});

afterAll(async () => {
  for (const [k, v] of Object.entries(guardado)) if (v !== undefined) process.env[k] = v;
  await db?.$disconnect();
  base?.borrar();
});

const configurarInstagram = () => {
  process.env.INSTAGRAM_USER_ID = "17841400000000000";
  process.env.INSTAGRAM_ACCESS_TOKEN = "token-de-prueba";
  process.env.APP_URL = "https://tenencia.ejemplo.cl";
};

/** API de Instagram simulada: registra cada llamada y responde según el guion. */
function apiSimulada(guion: { publicar?: "ok" | "error" } = {}) {
  const llamadas: { metodo: string; ruta: string; cuerpo: string }[] = [];
  let contenedores = 0;
  let medios = 0;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    const ruta = u.pathname.replace(/^\/v[\d.]+\//, "");
    const metodo = init?.method ?? "GET";
    llamadas.push({ metodo, ruta, cuerpo: String(init?.body ?? u.search) });
    const json = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
    if (metodo === "POST" && ruta.endsWith("/media")) return json({ id: `contenedor-${++contenedores}` });
    if (metodo === "GET" && ruta.startsWith("contenedor-")) return json({ status_code: "FINISHED" });
    if (metodo === "POST" && ruta.endsWith("/media_publish")) {
      if (guion.publicar === "error") return json({ error: { message: "Límite de publicaciones alcanzado", code: 9 } }, 400);
      return json({ id: `media-${++medios}` });
    }
    if (metodo === "GET" && ruta.startsWith("media-")) return json({ permalink: `https://www.instagram.com/p/${ruta}/` });
    return json({ error: { message: "ruta no simulada" } }, 404);
  });
  return llamadas;
}

const foto = () => sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 150, g: 110, b: 70 } } }).png().toBuffer();

/** Un vecino envía un aviso con foto desde el portal (contenido real, no de demostración). */
async function avisoDeVecino(tipo: "PERDIDA" | "ENCONTRADA") {
  const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
  const { publicarMascota } = await import("@/servidor/portal/acciones");
  const datos = new FormData();
  datos.set(
    "datos",
    JSON.stringify({
      tipo, especie: "PERRO", colorPrincipal: "café", tamano: "MEDIANO", sexo: "MACHO", nombreAnimal: tipo === "PERDIDA" ? "Toby" : "", collar: "NO", colorCollar: "",
      microchip: tipo === "PERDIDA" ? "NO" : "", senas: "", fechaEvento: (await import("@/servidor/formato")).hoyISO(), resguardada: tipo === "PERDIDA" ? "" : "no",
      localidadId: huerta.id, vinculo: "", ...VECINA,
    }),
  );
  datos.set("foto", new Blob([new Uint8Array(await foto())], { type: "image/png" }), "foto.png");
  const r = await publicarMascota(datos);
  if (!r.ok) throw new Error(JSON.stringify(r));
  expect(r.conFoto).toBe(true);
  return db.publicacionMascota.findFirstOrThrow({ where: { codigo: r.codigo } });
}

const fotoPublica = async (id: string) => {
  const { GET } = await import("@/app/(portal)/mascotas/[id]/foto/route");
  return (await GET(new Request("http://localhost/"), { params: Promise.resolve({ id }) })).status;
};

describe("aviso de un vecino: aceptar y publicar", () => {
  it("sin credenciales: el aviso espera oculto y, al aceptarlo, se publica solo en la web", async () => {
    sesion = null;
    const aviso = await avisoDeVecino("PERDIDA");
    expect(aviso.moderacion).toBe("PENDIENTE");
    expect(await consultas.publicacion(aviso.id)).toBeNull();
    expect(await fotoPublica(aviso.id)).toBe(404);
    sesion = await sesionDe("COMUNICACIONES");
    const r = await bandejas.aprobarPublicacion(aviso.id);
    expect(r).toEqual({ ok: true, mensaje: "Publicamos el aviso en el portal. Instagram no está configurado: se publicó solo en la web." });
    expect(await consultas.publicacion(aviso.id)).not.toBeNull();
    expect(await fotoPublica(aviso.id)).toBe(200);
    expect(await db.publicacionRed.count({ where: { origenId: aviso.id } })).toBe(0);
    expect(await db.notificacion.count({ where: { asunto: "Publicamos tu aviso" } })).toBeGreaterThan(0);
  });

  it("con credenciales: al aceptar sale a la web y a Instagram de inmediato, perdidas y avistadas", async () => {
    configurarInstagram();
    const llamadas = apiSimulada();
    sesion = await sesionDe("COMUNICACIONES");
    for (const tipo of ["PERDIDA", "ENCONTRADA"] as const) {
      const aviso = await avisoDeVecino(tipo);
      const r = await bandejas.aprobarPublicacion(aviso.id);
      expect(r.mensaje).toBe("Publicamos el aviso en el portal. También se publicó en Instagram.");
      const red = await db.publicacionRed.findFirstOrThrow({ where: { origenId: aviso.id }, include: { eventos: true } });
      expect([red.tipo, red.estado, red.revisadoPorId]).toEqual([tipo === "PERDIDA" ? "PERDIDA" : "AVISTADA", "PUBLICADO", sesion!.id]);
      expect(red.igPermalink).toMatch(/^https:\/\/www\.instagram\.com\/p\//);
      // El nombre sí (ayuda a que lo llamen); el teléfono nunca.
      if (tipo === "PERDIDA") expect(red.texto).toMatch(/^Se busca a Toby\.\s+Perro de color café, tamaño mediano\.\s+No lleva collar\./);
      expect(red.texto).not.toMatch(/912345678/);
      expect(red.eventos.map((e) => e.accion)).toEqual(["Generada al publicar", "Publicación solicitada a Instagram", "Publicada en Instagram"]);
    }
    expect(llamadas.filter((l) => l.metodo === "POST" && l.ruta.endsWith("/media_publish"))).toHaveLength(2);
  });

  it("ocultar y volver a mostrar no publica dos veces en Instagram", async () => {
    configurarInstagram();
    apiSimulada();
    sesion = await sesionDe("COMUNICACIONES");
    const aviso = await avisoDeVecino("PERDIDA");
    await bandejas.aprobarPublicacion(aviso.id);
    const llamadas = apiSimulada();
    expect((await bandejas.ocultarPublicacion(aviso.id)).ok).toBe(true);
    expect((await bandejas.aprobarPublicacion(aviso.id)).mensaje).toMatch(/Ya estaba publicado en Instagram/);
    expect(llamadas).toHaveLength(0);
  });

  it("si Instagram falla, el aviso igual queda en la web y el reintento reutiliza el contenedor", async () => {
    configurarInstagram();
    apiSimulada({ publicar: "error" });
    sesion = await sesionDe("COMUNICACIONES");
    const aviso = await avisoDeVecino("PERDIDA");
    const r = await bandejas.aprobarPublicacion(aviso.id);
    expect(r.ok).toBe(true);
    expect(r.mensaje).toMatch(/No se pudo publicar en Instagram: .*Límite de publicaciones alcanzado/);
    expect(await consultas.publicacion(aviso.id)).not.toBeNull();
    const conError = await db.publicacionRed.findFirstOrThrow({ where: { origenId: aviso.id } });
    expect([conError.estado, conError.contenedorId]).toEqual(["ERROR", "contenedor-1"]);

    vi.unstubAllGlobals();
    const llamadas = apiSimulada();
    expect(await redes.publicarEnInstagram("PERDIDA", aviso.id)).toEqual({ ok: true, mensaje: "Publicado en Instagram." });
    expect(llamadas.filter((l) => l.metodo === "POST" && l.ruta.endsWith("/media"))).toHaveLength(0);
    const final = await db.publicacionRed.findUniqueOrThrow({ where: { id: conError.id } });
    expect([final.estado, final.intentos]).toEqual(["PUBLICADO", 2]);
    // La imagen pública solo responde con su firma.
    const { GET } = await import("@/app/redes/[id]/imagen/route");
    const pedir = (f: string) => GET(new Request(`http://localhost/redes/${final.id}/imagen?f=${f}`), { params: Promise.resolve({ id: final.id }) });
    expect((await pedir(servicio.firmaImagen(final.id, final.imagen))).status).toBe(200);
    expect((await pedir("firma-falsa")).status).toBe(404);
  }, 60_000);
});

describe("operativos, adopciones y demostración", () => {
  it("un operativo real sale a Instagram al publicarlo", async () => {
    configurarInstagram();
    apiSimulada();
    sesion = await sesionDe("COORDINADOR");
    const o = await db.operativo.findFirstOrThrow({ where: { estado: "BORRADOR" } });
    await db.operativo.update({ where: { id: o.id }, data: { loteDemoId: null } });
    const { publicar } = await import("@/servidor/panel/acciones-operativos");
    expect((await publicar(o.id)).mensaje).toMatch(/También se publicó en Instagram\.$/);
    expect(await db.publicacionRed.findFirstOrThrow({ where: { tipo: "OPERATIVO", origenId: o.id } })).toMatchObject({ estado: "PUBLICADO" });
  }, 60_000);

  it("el contenido de demostración no sale a Instagram, salvo que administración lo permita para pruebas", async () => {
    configurarInstagram();
    apiSimulada();
    sesion = await sesionDe("COORDINADOR");
    const { FICHA_PUBLICA } = await import("@/servidor/conFoto");
    const ficha = await db.fichaAdopcion.findFirstOrThrow({ where: { AND: [FICHA_PUBLICA, { OR: [{ proponenteId: null }, { autorizaPublicar: true }] }, { loteDemoId: { not: null } }] } });
    expect(await redes.publicarEnInstagram("ADOPCION", ficha.id)).toEqual({ ok: false, mensaje: "Son datos de demostración: no se publicaron en Instagram." });
    expect((await redes.guardarDemoInstagram(true)).ok).toBe(false); // coordinación no puede
    sesion = await sesionDe("ADMINISTRADOR");
    expect((await redes.guardarDemoInstagram(true)).ok).toBe(true);
    expect(await redes.publicarEnInstagram("ADOPCION", ficha.id)).toEqual({ ok: true, mensaje: "Publicado en Instagram." });
    const red = await db.publicacionRed.findFirstOrThrow({ where: { tipo: "ADOPCION", origenId: ficha.id } });
    expect(red.texto).not.toMatch(/vacun|esteriliz/i);
    expect((await redes.guardarDemoInstagram(false)).ok).toBe(true);
  }, 60_000);

  it("no publica contenido que no es público ni tipos no permitidos, y respeta los permisos", async () => {
    configurarInstagram();
    apiSimulada();
    sesion = await sesionDe("COMUNICACIONES");
    const oculto = await db.publicacionMascota.findFirstOrThrow({ where: { tipo: "PERDIDA", estado: "ABIERTA", loteDemoId: { not: null } } });
    await db.publicacionMascota.update({ where: { id: oculto.id }, data: { moderacion: "OCULTA" } });
    expect((await redes.publicarEnInstagram("PERDIDA", oculto.id)).ok).toBe(false);
    expect(await redes.publicarEnInstagram("SOS", oculto.id)).toEqual({ ok: false, mensaje: "Tipo de contenido no válido." });
    sesion = await sesionDe("DIRECTIVO");
    expect(await redes.publicarEnInstagram("PERDIDA", oculto.id)).toEqual({ ok: false, mensaje: "Tu cuenta no tiene permiso para esta acción." });
  });

  it("borrar la demo borra sus publicaciones para Instagram", async () => {
    const { borrarDatosDemo } = await import("@/servidor/demo/borrar");
    await borrarDatosDemo(db);
    expect(await db.publicacionRed.count({ where: { loteDemoId: { not: null } } })).toBe(0);
  });
});
