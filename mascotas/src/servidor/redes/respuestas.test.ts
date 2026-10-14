// Respuestas automáticas en Instagram sobre la demo cargada: el webhook valida
// la firma de Meta, cada comentario o mensaje se responde una sola vez y, en un
// comentario de una publicación nuestra, el enlace es el de ese contenido.
// La API de Instagram se simula solo dentro de esta prueba.
import { createHmac } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const ENTORNO = ["INSTAGRAM_USER_ID", "INSTAGRAM_ACCESS_TOKEN", "APP_URL", "INSTAGRAM_APP_SECRET", "META_APP_SECRET", "INSTAGRAM_WEBHOOK_TOKEN"] as const;
const guardado = Object.fromEntries(ENTORNO.map((k) => [k, process.env[k]]));
const CUENTA = "17841400000000000";

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let respuestas: typeof import("./respuestas");

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.ALMACEN_DIR = mkdtempSync(join(tmpdir(), "tenencia-almacen-"));
  process.env.MUNICIPIO ??= "hualane";
  process.env.SESION_SECRETO ??= "secreto-de-prueba";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: "2026-10-06", contrasena: "contrasena-de-prueba" });
  respuestas = await import("./respuestas");
}, 120_000);

afterEach(() => vi.unstubAllGlobals());

afterAll(async () => {
  for (const [k, v] of Object.entries(guardado)) if (v === undefined) delete process.env[k];
  else process.env[k] = v;
  await db?.$disconnect();
  base?.borrar();
});

const configurar = () => {
  process.env.INSTAGRAM_USER_ID = CUENTA;
  process.env.INSTAGRAM_ACCESS_TOKEN = "token-de-prueba";
  process.env.APP_URL = "https://tenencia.ejemplo.cl";
  process.env.INSTAGRAM_APP_SECRET = "secreto-de-la-app";
  process.env.INSTAGRAM_WEBHOOK_TOKEN = "token-del-webhook";
};

/** API simulada: registra qué se respondió y dónde. */
function apiSimulada() {
  const llamadas: { ruta: string; datos: URLSearchParams }[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    llamadas.push({ ruta: new URL(url).pathname.replace(/^\/v[\d.]+\//, ""), datos: new URLSearchParams(String(init?.body ?? "")) });
    return new Response(JSON.stringify({ id: "respuesta-1", message_id: "m-1" }), { headers: { "Content-Type": "application/json" } });
  });
  return llamadas;
}

const comentario = (id: string, texto: string, mediaId: string, de = "igsid-vecina") => ({
  object: "instagram",
  entry: [{ changes: [{ field: "comments", value: { id, text: texto, from: { id: de, username: "vecina" }, media: { id: mediaId, media_product_type: "FEED" } } }] }],
});

describe("webhook", () => {
  it("verifica la suscripción solo con el token acordado y rechaza avisos sin firma de Meta", async () => {
    configurar();
    const { GET, POST } = await import("@/app/api/instagram/webhook/route");
    const pedir = (token: string) => GET(new Request(`https://x/api?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=123`));
    expect(await (await pedir("token-del-webhook")).text()).toBe("123");
    expect((await pedir("otro")).status).toBe(403);
    const cuerpo = JSON.stringify(comentario("c-0", "hola", "m-0"));
    expect((await POST(new Request("https://x/api", { method: "POST", body: cuerpo, headers: { "x-hub-signature-256": "sha256=falsa" } }))).status).toBe(401);
    const firma = (s: string) => `sha256=${createHmac("sha256", s).update(cuerpo).digest("hex")}`;
    expect(respuestas.firmaValida(cuerpo, firma("secreto-de-la-app"))).toBe(true);
    // También con la clave de la app de Meta, si está configurada.
    process.env.META_APP_SECRET = "secreto-de-meta";
    expect(respuestas.firmaValida(cuerpo, firma("secreto-de-meta"))).toBe(true);
    expect(respuestas.firmaValida(cuerpo, firma("otra"))).toBe(false);
    delete process.env.META_APP_SECRET;
  });
});

describe("respuestas automáticas", () => {
  it("apagadas: registra el comentario sin responder", async () => {
    configurar();
    const llamadas = apiSimulada();
    await respuestas.procesarAviso(comentario("c-1", "¿Quedan cupos?", "m-x"));
    expect(llamadas).toHaveLength(0);
    expect((await db.interaccionRed.findUniqueOrThrow({ where: { igId: "c-1" } })).estado).toBe("SIN_RESPUESTA");
  });

  it("en el post de un operativo: enlace a ese operativo por privado y respuesta pública breve, una sola vez", async () => {
    configurar();
    await db.municipio.update({ where: { id: "hualane" }, data: { redesResponderAuto: true } });
    const op = await db.operativo.findFirstOrThrow();
    await db.publicacionRed.create({
      data: { municipioId: "hualane", tipo: "OPERATIVO", origenId: op.id, texto: "t", textoGenerado: "t", textoAlternativo: "a", imagen: "x.jpg", estado: "PUBLICADO", igMediaId: "media-op" },
    });
    const llamadas = apiSimulada();
    const aviso = comentario("c-2", "¿A qué hora es? ¿Hay cupos?", "media-op");
    await respuestas.procesarAviso(aviso);
    await respuestas.procesarAviso(aviso); // Instagram puede reenviar el mismo aviso
    expect(llamadas.map((l) => l.ruta)).toEqual([`${CUENTA}/messages`, "c-2/replies"]);
    expect(JSON.parse(llamadas[0].datos.get("recipient")!)).toEqual({ comment_id: "c-2" });
    expect(JSON.parse(llamadas[0].datos.get("message")!).text).toContain(`https://tenencia.ejemplo.cl/operativos/${op.id}`);
    expect(llamadas[1].datos.get("message")).toBe("Gracias por comentar. Te enviamos la información por mensaje privado.");
    const fila = await db.interaccionRed.findUniqueOrThrow({ where: { igId: "c-2" } });
    expect([fila.estado, fila.intencion, fila.origenTipo]).toEqual(["RESPONDIDA", "OPERATIVO", "OPERATIVO"]);
  });

  it("no responde a sus propios comentarios ni a sus mensajes (eco)", async () => {
    configurar();
    const llamadas = apiSimulada();
    await respuestas.procesarAviso(comentario("c-3", "Gracias por comentar.", "media-op", CUENTA));
    await respuestas.procesarAviso({ object: "instagram", entry: [{ messaging: [{ sender: { id: CUENTA }, message: { mid: "e-1", text: "hola", is_echo: true } }] }] });
    expect(llamadas).toHaveLength(0);
  });

  it("mensaje directo: responde con el enlace de la sección", async () => {
    configurar();
    const llamadas = apiSimulada();
    await respuestas.procesarAviso({ object: "instagram", entry: [{ messaging: [{ sender: { id: "igsid-2" }, message: { mid: "mid-1", text: "Se me perdió mi perro" } }] }] });
    expect(llamadas).toHaveLength(1);
    expect(JSON.parse(llamadas[0].datos.get("recipient")!)).toEqual({ id: "igsid-2" });
    expect(JSON.parse(llamadas[0].datos.get("message")!).text).toContain("https://tenencia.ejemplo.cl/mascotas/publicar?tipo=PERDIDA");
  });

  it("si el mensaje privado falla, no promete en público y queda con error", async () => {
    configurar();
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ error: { message: "Fuera de plazo", code: 10 } }), { status: 400 }));
    await respuestas.procesarAviso(comentario("c-4", "Lo vi en la plaza", "media-op"));
    const fila = await db.interaccionRed.findUniqueOrThrow({ where: { igId: "c-4" } });
    expect([fila.estado, fila.respuestaPublica]).toEqual(["ERROR", null]);
    expect(fila.error).toMatch(/Fuera de plazo/);
  });
});
