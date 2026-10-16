// Inteligencia artificial con la API de OpenAI simulada: solo se envían las
// cifras agrupadas, la respuesta se valida y, sin clave o con error, no hay IA.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/servidor/db", () => ({ db: {} }));

let ia: typeof import("./funciones");
const clave = process.env.OPENAI_API_KEY;

beforeAll(async () => {
  process.env.MUNICIPIO ??= "hualane";
  ia = await import("./funciones");
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (clave === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = clave;
});

const DATOS = {
  cifras: { solicitudes: 12, perdidas: 3 },
  porServicio: [{ nombre: "Esterilización", cantidad: 9 }],
  porSector: [{ nombre: "Centro", solicitudes: 7, avisos: 2, reportes: 1 }],
  porTipo: [],
};

/** OpenAI simulada: guarda lo enviado y contesta el contenido indicado. */
function openai(contenido: unknown, estado = 200) {
  const enviados: { model: string; messages: { content: string }[] }[] = [];
  vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
    enviados.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify(estado === 200 ? { choices: [{ message: { content: JSON.stringify(contenido) } }] } : { error: { message: "x" } }), { status: estado });
  });
  return enviados;
}

describe("resumen para el equipo", () => {
  it("envía solo las cifras agrupadas y suaviza un «debe»", async () => {
    process.env.OPENAI_API_KEY = "clave-de-prueba";
    const enviados = openai({ resumen: "Esterilización concentra 9 de 12 solicitudes. Se debe revisar el Centro." });
    expect(await ia.resumenConIA(DATOS)).toBe("Esterilización concentra 9 de 12 solicitudes. Se recomienda revisar el Centro.");
    expect(JSON.parse(enviados[0].messages[1].content)).toEqual(DATOS);
  });

  it("sin clave no consulta; con error o respuesta inválida devuelve null", async () => {
    delete process.env.OPENAI_API_KEY;
    const enviados = openai({ resumen: "Texto suficiente para el resumen del equipo." });
    expect(await ia.resumenConIA(DATOS)).toBeNull();
    expect(enviados).toHaveLength(0);
    process.env.OPENAI_API_KEY = "clave-de-prueba";
    openai(null, 429);
    expect(await ia.resumenConIA(DATOS)).toBeNull();
    openai({ otro: 1 });
    expect(await ia.resumenConIA(DATOS)).toBeNull();
  });

  it("una intención fuera de la lista no se acepta", async () => {
    process.env.OPENAI_API_KEY = "clave-de-prueba";
    openai({ intencion: "COMPRAR" });
    expect(await ia.intencionConIA("hola")).toBeNull();
    openai({ intencion: "SOS" });
    expect(await ia.intencionConIA("hay un perrito atropellado")).toBe("SOS");
  });
});

describe("servicio compatible (Azure AI Foundry)", () => {
  it("usa OPENAI_BASE_URL, el despliegue como modelo y la clave en «api-key»", async () => {
    process.env.OPENAI_API_KEY = "clave-de-prueba";
    process.env.OPENAI_BASE_URL = "https://recurso.services.ai.azure.com/openai/v1/";
    process.env.OPENAI_MODEL = "mi-despliegue";
    const pedidos: { url: string; headers: Record<string, string>; model: string }[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      pedidos.push({ url, headers: init?.headers as Record<string, string>, model: JSON.parse(String(init?.body)).model });
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ intencion: "ADOPTAR" }) } }] }));
    });
    try {
      expect(await ia.intencionConIA("busco un regalón")).toBe("ADOPTAR");
      expect(pedidos[0].url).toBe("https://recurso.services.ai.azure.com/openai/v1/chat/completions");
      expect(pedidos[0].model).toBe("mi-despliegue");
      expect(pedidos[0].headers["api-key"]).toBe("clave-de-prueba");
      expect(pedidos[0].headers.Authorization).toBeUndefined();
    } finally {
      delete process.env.OPENAI_BASE_URL;
      delete process.env.OPENAI_MODEL;
    }
  });
});

describe("modelos que razonan", () => {
  it("gpt-5: sin «temperature», con esfuerzo de razonamiento y max_completion_tokens", async () => {
    process.env.OPENAI_API_KEY = "clave-de-prueba";
    process.env.OPENAI_MODEL = "gpt-5.5";
    const enviados = openai({ intencion: "SOS" });
    try {
      await ia.intencionConIA("perrito atropellado");
      const cuerpo = enviados[0] as unknown as Record<string, unknown>;
      expect([cuerpo.temperature, cuerpo.reasoning_effort, cuerpo.max_tokens]).toEqual([undefined, "none", undefined]);
      expect(cuerpo.max_completion_tokens).toBe(300);
    } finally {
      delete process.env.OPENAI_MODEL;
    }
  });
});
