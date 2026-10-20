// Correo y acceso a Mis solicitudes con un código enviado al correo, sobre la
// demo cargada. Brevo se simula solo dentro de esta prueba (sin red).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// La sesión vive en una cookie; fuera de una petición se simula en memoria.
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

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let acciones: typeof import("@/servidor/portal/acciones");
let correo: typeof import("./correo");

const ENTORNO = ["BREVO_API_KEY", "CORREO_REMITENTE", "SMTP_HOST", "SMTP_USUARIO", "SMTP_CLAVE"] as const;
const guardado = Object.fromEntries(ENTORNO.map((k) => [k, process.env[k]]));
const VECINA = { nombre: "Vecina con correo", rut: "15.234.567-4", telefono: "", correo: "vecina@ejemplo.cl" };

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  process.env.SESION_SECRETO ??= "secreto-de-prueba";
  for (const k of ENTORNO) delete process.env[k];
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  acciones = await import("@/servidor/portal/acciones");
  correo = await import("./correo");
  // Una vecina real (no de demostración) con un trámite y su correo.
  const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
  const servicio = await db.servicio.findFirstOrThrow();
  const r = await acciones.solicitarServicio({ servicioId: servicio.id, especie: "GATO", nombreAnimal: "", sexo: "HEMBRA", tamano: "", edad: "36", localidadId: huerta.id, ...VECINA });
  if (!r.ok) throw new Error(JSON.stringify(r));
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

describe("envío de correos", () => {
  it("sin credenciales no hay envío: las notificaciones quedan simuladas", async () => {
    expect(correo.estadoCorreo()).toMatchObject({ configurado: false, proveedor: null });
    const n = await db.notificacion.findFirstOrThrow({ where: { destinatario: VECINA.correo } });
    expect(n.estado).toBe("SIMULADA");
  });

  it("con Brevo configurado, la notificación queda en cola y sale por correo (sin datos de demostración)", async () => {
    process.env.BREVO_API_KEY = "clave-de-prueba";
    process.env.CORREO_REMITENTE = "Municipalidad <tenencia@ejemplo.cl>";
    const enviados: { url: string; cuerpo: Record<string, unknown> }[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      enviados.push({ url, cuerpo: JSON.parse(String(init?.body)) });
      return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
    });
    const { notificar } = await import("./notificaciones");
    await notificar(db, { telefono: null, correo: VECINA.correo }, "Prueba de envío", "Hola.\n\nEste es un aviso.");
    await notificar(db, { telefono: null, correo: "demo@demo.invalid" }, "Aviso de demostración", "No debe salir.", (await db.loteDemo.findFirstOrThrow()).id);
    expect(await db.notificacion.findFirstOrThrow({ where: { asunto: "Prueba de envío" } })).toMatchObject({ estado: "PENDIENTE" });
    expect(await db.notificacion.findFirstOrThrow({ where: { asunto: "Aviso de demostración" } })).toMatchObject({ estado: "SIMULADA" });
    await correo.enviarPendientes(db, "Ilustre Municipalidad de Prueba");
    expect(await db.notificacion.findFirstOrThrow({ where: { asunto: "Prueba de envío" } })).toMatchObject({ estado: "ENVIADA", error: null });
    expect(enviados).toHaveLength(1);
    expect(enviados[0].url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(enviados[0].cuerpo).toMatchObject({ sender: { email: "tenencia@ejemplo.cl", name: "Municipalidad" }, to: [{ email: VECINA.correo }], subject: "Prueba de envío" });
  });

  it("si el proveedor rechaza, queda FALLIDA con el motivo", async () => {
    process.env.BREVO_API_KEY = "clave-de-prueba";
    process.env.CORREO_REMITENTE = "tenencia@ejemplo.cl";
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ message: "Remitente no verificado" }), { status: 400 }));
    const { notificar } = await import("./notificaciones");
    await notificar(db, { telefono: null, correo: VECINA.correo }, "Falla", "Texto.");
    await correo.enviarPendientes(db, "Municipalidad");
    expect(await db.notificacion.findFirstOrThrow({ where: { asunto: "Falla" } })).toMatchObject({ estado: "FALLIDA", error: "Brevo respondió 400: Remitente no verificado" });
  });
});

describe("entrar a Mis solicitudes con un código al correo", () => {
  it("modo de prueba (sin envío, fuera de producción): muestra el código; entra una sola vez y abre la sesión", async () => {
    const r = await acciones.pedirCodigoAcceso({ correo: "  Vecina@Ejemplo.CL " });
    expect(r).toMatchObject({ ok: true });
    const codigo = r.ok ? r.codigoPrueba! : "";
    expect(codigo).toMatch(/^\d{6}$/);
    // En la base solo queda la huella, nunca el código.
    expect((await db.codigoAcceso.findFirstOrThrow()).huella).not.toContain(codigo);
    expect(await acciones.misSolicitudes()).toMatchObject({ ok: false, sinSesion: true });
    const dentro = await acciones.entrarConCodigoAcceso({ correo: VECINA.correo, codigo });
    expect(dentro.ok && dentro.tramites.map((t) => t.tipo)).toContain("Solicitud de servicio");
    expect(vecino.correo).toBe(VECINA.correo);
    const conSesion = await acciones.misSolicitudes();
    expect(conSesion.ok && conSesion.tramites.map((t) => t.tipo)).toContain("Solicitud de servicio");
    expect((await acciones.entrarConCodigoAcceso({ correo: VECINA.correo, codigo })).ok).toBe(false); // un solo uso
    await acciones.salirDeMisSolicitudes();
    expect(await acciones.misSolicitudes()).toMatchObject({ ok: false, sinSesion: true });
  });

  it("un correo sin trámites recibe la misma respuesta (no revela si existe); con envío configurado el código sale por correo", async () => {
    const sinTramites = await acciones.pedirCodigoAcceso({ correo: "nadie@ejemplo.cl" });
    expect(sinTramites).toMatchObject({ ok: true });
    expect(sinTramites.ok && sinTramites.codigoPrueba).toBeFalsy();
    expect((await acciones.pedirCodigoAcceso({ correo: "no es un correo" })).ok).toBe(false);
    process.env.BREVO_API_KEY = "clave-de-prueba";
    process.env.CORREO_REMITENTE = "tenencia@ejemplo.cl";
    let asunto = "";
    let para = "";
    vi.stubGlobal("fetch", async (_: string, init?: RequestInit) => {
      const cuerpo = JSON.parse(String(init?.body));
      asunto = cuerpo.subject;
      para = cuerpo.to?.[0]?.email;
      return new Response("{}", { status: 201 });
    });
    await db.codigoAcceso.deleteMany();
    const r = await acciones.pedirCodigoAcceso({ correo: VECINA.correo });
    expect(r).toMatchObject({ ok: true, mensaje: sinTramites.mensaje });
    expect(r.ok && r.codigoPrueba).toBeFalsy(); // con envío real, nunca en pantalla
    expect(para).toBe(VECINA.correo);
    const codigo = asunto.match(/\d{6}/)![0];
    expect((await acciones.entrarConCodigoAcceso({ correo: VECINA.correo, codigo })).ok).toBe(true);
  });

  it("a los 5 intentos fallidos el código deja de servir, y no se pueden pedir códigos sin límite", async () => {
    await db.codigoAcceso.deleteMany();
    vecino.correo = null;
    const r = await acciones.pedirCodigoAcceso({ correo: VECINA.correo });
    const codigo = r.ok ? r.codigoPrueba! : "";
    const otro = codigo === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) expect((await acciones.entrarConCodigoAcceso({ correo: VECINA.correo, codigo: otro })).ok).toBe(false);
    expect((await acciones.entrarConCodigoAcceso({ correo: VECINA.correo, codigo })).ok).toBe(false);
    expect(vecino.correo).toBeNull();
    await acciones.pedirCodigoAcceso({ correo: VECINA.correo });
    await acciones.pedirCodigoAcceso({ correo: VECINA.correo });
    const cuarto = await acciones.pedirCodigoAcceso({ correo: VECINA.correo });
    expect(cuarto.ok && cuarto.codigoPrueba).toBeFalsy();
    expect(await db.codigoAcceso.count()).toBe(3);
  });
});
