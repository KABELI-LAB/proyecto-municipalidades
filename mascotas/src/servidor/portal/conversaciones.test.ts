// Conversaciones protegidas sobre la demo cargada: quien escribe recibe un
// enlace privado; quien publicó responde con su sesión de Mis solicitudes;
// ninguno ve el contacto del otro hasta que este decide compartirlo.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// La sesión de Mis solicitudes vive en una cookie; fuera de una petición se simula en memoria.
const vecino = vi.hoisted(() => ({ correo: null as string | null }));
vi.mock("@/servidor/portal/sesionVecino", async (original) => {
  const m = await original<typeof import("@/servidor/portal/sesionVecino")>();
  const { municipioActivo } = await import("@/lib/municipio");
  return {
    ...m,
    abrirSesionVecino: async (c: string) => {
      vecino.correo = m.normalizarCorreo(c);
    },
    cerrarSesionVecino: async () => {
      vecino.correo = null;
    },
    correoDeSesion: async () => vecino.correo,
    filtroVecino: async () => (vecino.correo ? { municipioId: municipioActivo().id, correo: vecino.correo } : null),
  };
});

const DUENA = { nombre: "Ana Dueña", rut: "17.654.321-3", telefono: "912345678", correo: "ana.duena@correo.cl" };

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let acciones: typeof import("./acciones");
let conv: typeof import("./conversaciones");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  process.env.SESION_SECRETO ??= "secreto-de-prueba-de-al-menos-32-caracteres";
  process.env.APP_URL = "https://pawni.ejemplo.cl";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: "2026-10-06", contrasena: "contrasena-de-prueba" });
  acciones = await import("./acciones");
  conv = await import("./conversaciones");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

async function avisoAprobado(tipo: "PERDIDA" | "ENCONTRADA") {
  const huerta = await db.localidad.findUniqueOrThrow({ where: { clave: "la-huerta" } });
  const { hoyISO } = await import("@/servidor/formato");
  const r = await acciones.publicarMascota({
    tipo,
    especie: "PERRO",
    tamano: "MEDIANO",
    sexo: "MACHO",
    nombreAnimal: tipo === "PERDIDA" ? "Toby" : "",
    collar: "NO",
    colorCollar: "",
    microchip: "NO",
    senas: "",
    fechaEvento: hoyISO(),
    resguardada: tipo === "ENCONTRADA" ? "no" : "",
    colorPrincipal: "café",
    localidadId: huerta.id,
    ...DUENA,
    rut: tipo === "PERDIDA" ? DUENA.rut : "",
  });
  if (!r.ok) throw new Error(JSON.stringify(r));
  await db.publicacionMascota.update({ where: { id: r.id }, data: { moderacion: "APROBADA" } });
  return r.id;
}

/** El enlace privado que le llegó por correo a la persona interesada. */
async function enlaceDe(correo: string) {
  const n = await db.notificacion.findFirstOrThrow({ where: { destinatario: correo, contenido: { contains: "/conversacion/" } }, orderBy: { creadaEn: "desc" } });
  const [, id, t] = n.contenido.match(/\/conversacion\/([^?\s]+)\?t=([\w-]+)/)!;
  return { id, t };
}

describe("conversación sobre un aviso de mascota perdida", () => {
  it("de ida y vuelta, sin mostrar contactos hasta que cada uno decide compartirlo", async () => {
    const aviso = await avisoAprobado("PERDIDA");

    // Para escribir hace falta un correo: ahí llega el enlace y las respuestas.
    expect((await conv.escribirAQuienPublico({ publicacionId: aviso, nombre: "Pedro", telefono: "987654321", correo: "", texto: "Lo vi ayer cerca de la plaza." })).ok).toBe(false);
    expect((await conv.escribirAQuienPublico({ publicacionId: aviso, nombre: "Pedro", telefono: "987654321", correo: "Pedro@Correo.cl", texto: "Lo vi ayer cerca de la plaza." })).ok).toBe(true);

    // A la dueña le llega el mensaje completo, sin el contacto de Pedro.
    const aDuena = await db.notificacion.findFirstOrThrow({ where: { destinatario: DUENA.correo, asunto: "Pedro te escribió" } });
    expect(aDuena.contenido).toContain("«Lo vi ayer cerca de la plaza.»");
    expect(aDuena.contenido).not.toMatch(/pedro@correo\.cl|987654321/);

    // Pedro recibe su enlace privado; con otra firma no se abre.
    const { id, t } = await enlaceDe("pedro@correo.cl");
    expect(await conv.conversacionDeInteresado(id, "firma-falsa")).toBeNull();
    expect((await conv.conversacionDeInteresado(id, t))?.mensajes).toEqual([expect.objectContaining({ mio: true, texto: "Lo vi ayer cerca de la plaza." })]);

    // La dueña la ve en Mis solicitudes y responde; otra persona no puede.
    vecino.correo = "otra.persona@correo.cl";
    expect((await conv.escribirComoDueno({ id, texto: "¿A qué hora?" })).ok).toBe(false);
    expect(await conv.conversacionesComoDueno()).toEqual([]);
    vecino.correo = DUENA.correo;
    const [vista] = await conv.conversacionesComoDueno();
    expect(vista).toMatchObject({ id, con: "Pedro", contactoDelOtro: null });
    expect((await conv.escribirComoDueno({ id, texto: "¿A qué hora?" })).ok).toBe(true);
    const aPedro = await db.notificacion.findFirstOrThrow({ where: { destinatario: "pedro@correo.cl", asunto: "Te respondieron sobre la mascota" } });
    expect(aPedro.contenido).toContain("«¿A qué hora?»");
    expect(aPedro.contenido).toContain(`/conversacion/${id}?t=${t}`);
    expect(aPedro.contenido).not.toContain(DUENA.correo);

    // Pedro responde desde su enlace.
    expect((await conv.escribirComoInteresado({ id, t, texto: "Como a las 18:00." })).ok).toBe(true);
    expect((await conv.escribirComoInteresado({ id, t: "otra", texto: "Hola" })).ok).toBe(false);
    expect((await conv.conversacionDeInteresado(id, t))?.mensajes.map((m) => [m.mio, m.texto])).toEqual([
      [true, "Lo vi ayer cerca de la plaza."],
      [false, "¿A qué hora?"],
      [true, "Como a las 18:00."],
    ]);

    // Compartir el contacto: cada uno decide por sí mismo.
    expect((await conv.compartirContactoInteresado({ id, t })).ok).toBe(true);
    expect((await conv.conversacionesComoDueno())[0].contactoDelOtro).toBe("987654321 · pedro@correo.cl");
    expect((await conv.conversacionDeInteresado(id, t))?.contactoDelOtro).toBeNull();
    expect((await conv.compartirContactoDueno({ id })).ok).toBe(true);
    expect((await conv.conversacionDeInteresado(id, t))?.contactoDelOtro).toBe(`${DUENA.telefono} · ${DUENA.correo}`);

    // Si Pedro vuelve a escribir desde el aviso, sigue la misma conversación.
    expect((await conv.escribirAQuienPublico({ publicacionId: aviso, nombre: "Pedro", telefono: "", correo: "pedro@correo.cl", texto: "¿Lo encontraste?" })).ok).toBe(true);
    expect(await db.conversacion.count({ where: { publicacionId: aviso } })).toBe(1);
  });
});

describe("conversación sobre una mascota avistada y una adopción", () => {
  it("una mascota avistada recibe «¿es tu mascota?»", async () => {
    const aviso = await avisoAprobado("ENCONTRADA");
    expect((await conv.escribirAQuienPublico({ publicacionId: aviso, nombre: "Dueño", telefono: "", correo: "dueno@correo.cl", texto: "Creo que es mi perro, tiene una mancha blanca." })).ok).toBe(true);
    vecino.correo = DUENA.correo;
    expect((await conv.conversacionesComoDueno()).some((c) => c.con === "Dueño" && /avistad[oa]/.test(c.sobre))).toBe(true);
  });

  it("adopción: a quien la da en adopción le llega y responde", async () => {
    const f = await db.fichaAdopcion.findFirstOrThrow({ where: { revision: "APROBADA", estado: "DISPONIBLE", proponenteId: { not: null } } });
    await db.persona.update({ where: { id: f.proponenteId! }, data: { correo: "da.adopcion@correo.cl" } });
    expect((await conv.escribirAQuienPublico({ fichaId: f.id, nombre: "Interesada", telefono: "", correo: "interesada@correo.cl", texto: "¿Convive bien con gatos?" })).ok).toBe(true);
    vecino.correo = "da.adopcion@correo.cl";
    const [c] = await conv.conversacionesComoDueno();
    expect(c).toMatchObject({ con: "Interesada", sobre: expect.stringContaining("en adopción") });
    expect((await conv.escribirComoDueno({ id: c.id, texto: "Sí, vive con dos gatos." })).ok).toBe(true);
    const n = await db.notificacion.findFirstOrThrow({ where: { destinatario: "interesada@correo.cl", asunto: "Te respondieron sobre la mascota" } });
    expect(n.contenido).toContain("«Sí, vive con dos gatos.»");
  });
});
