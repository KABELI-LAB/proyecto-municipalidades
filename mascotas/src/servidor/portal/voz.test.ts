// La voz de Pawni con Azure Speech simulado: solo textos firmados, SSML seguro
// y cada audio se genera una sola vez.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/pawni/voz/route";
import { audioDe, firmarVoz, firmasVoz, ssmlDe } from "./voz";

const ENTORNO = ["AZURE_SPEECH_ENDPOINT", "AZURE_SPEECH_KEY", "PAWNI_VOZ", "PAWNI_VOZ_TONO", "PAWNI_VOZ_ESTILO"] as const;
const guardado = Object.fromEntries(ENTORNO.map((k) => [k, process.env[k]]));

beforeEach(() => {
  process.env.AZURE_SPEECH_ENDPOINT = "https://recurso.cognitiveservices.azure.com/";
  process.env.AZURE_SPEECH_KEY = "clave-de-prueba";
  process.env.PAWNI_VOZ = "es-MX-MarinaNeural";
  process.env.PAWNI_VOZ_TONO = "+10%";
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [k, v] of Object.entries(guardado)) if (v === undefined) delete process.env[k];
  else process.env[k] = v;
});

function azure() {
  const pedidos: { url: string; cuerpo: string; clave: string }[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    pedidos.push({ url, cuerpo: String(init?.body), clave: (init?.headers as Record<string, string>)["Ocp-Apim-Subscription-Key"] });
    return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "audio/mpeg" } });
  });
  return pedidos;
}

describe("voz de Pawni", () => {
  it("escapa el texto en el SSML y aplica voz y tono", () => {
    const ssml = ssmlDe('Hola <b> & "tú"', { voz: "es-MX-MarinaNeural", tono: "+10%", estilo: "" });
    expect(ssml).toContain('<voice name="es-MX-MarinaNeural"><prosody pitch="+10%">Hola &lt;b&gt; &amp; &quot;tú&quot;</prosody></voice>');
    expect(ssml).toContain('xml:lang="es-MX"');
  });

  it("solo lee textos firmados por el servidor", async () => {
    const pedidos = azure();
    const pedir = (t: string, f: string) => GET(new Request(`https://x/api/pawni/voz?t=${encodeURIComponent(t)}&f=${f}`));
    expect((await pedir("Cualquier cosa", "firma-falsa")).status).toBe(400);
    expect(pedidos).toHaveLength(0);
    const r = await pedir("Hola, soy Pawni.", firmarVoz("Hola, soy Pawni."));
    expect([r.status, r.headers.get("Content-Type")]).toEqual([200, "audio/mpeg"]);
    expect(pedidos[0].url).toBe("https://recurso.cognitiveservices.azure.com/tts/cognitiveservices/v1");
    expect(pedidos[0].clave).toBe("clave-de-prueba");
  });

  it("genera cada audio una sola vez", async () => {
    const pedidos = azure();
    await audioDe("Te ayudo a buscarla.");
    await audioDe("Te ayudo a buscarla.");
    expect(pedidos).toHaveLength(1);
  });

  it("si cambia la voz, cambia la firma; sin configuración no firma", () => {
    const antes = firmarVoz("Hola.");
    process.env.PAWNI_VOZ = "es-CL-CatalinaNeural";
    expect(firmarVoz("Hola.")).not.toBe(antes);
    delete process.env.AZURE_SPEECH_KEY;
    expect(firmasVoz(["Hola."])).toEqual({});
  });
});
