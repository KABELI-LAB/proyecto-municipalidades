import { describe, expect, it } from "vitest";
import { clasificar, enlacesDe, mensajePrivado, normalizar, respuestaPublica } from "./respuestas";

const e = enlacesDe("https://portal.ejemplo.cl");

describe("clasificar comentarios y mensajes", () => {
  it.each([
    ["¿Cuándo es el operativo? ¿Quedan cupos?", "OPERATIVO"],
    ["Lo vi ayer cerca de la plaza!!", "VISTO"],
    ["Creo que es mío, es mi perrita", "ES_MIO"],
    ["Se me perdió mi gato anoche", "PERDI"],
    ["Quiero adoptarlo ❤️", "ADOPTAR"],
    ["¿Vacunan gatos?", "SERVICIO"],
    ["Hay un perro atropellado en la ruta", "SOS"],
    ["Gracias por la info", "GRACIAS"],
    ["❤️❤️🙌", "GRACIAS"],
    ["¿Atienden los sábados?", "OTRO"],
  ])("«%s» → %s", (texto, intencion) => {
    expect(clasificar(texto)).toBe(intencion);
  });

  it("un animal en peligro va primero, aunque diga otra cosa", () => {
    expect(clasificar("Lo vi herido en el puente")).toBe("SOS");
  });

  it("normaliza tildes y signos", () => {
    expect(normalizar("¿LO VÍ? ¡Sí!")).toBe("lo vi si");
  });
});

describe("qué responder", () => {
  const aviso = { tipo: "PERDIDA" as const, url: "https://portal.ejemplo.cl/mascotas/abc" };
  const operativo = { tipo: "OPERATIVO" as const, url: "https://portal.ejemplo.cl/operativos/xyz" };

  it("en el post de un perdido, «lo vi» lleva al aviso para informar sin datos personales", () => {
    const m = mensajePrivado("VISTO", aviso, e)!;
    expect(m).toContain("https://portal.ejemplo.cl/mascotas/abc");
    expect(m).toContain("Informar que la vi");
  });

  it("en el post de un operativo, cualquier pregunta lleva a ese operativo", () => {
    expect(mensajePrivado("OTRO", operativo, e)).toContain("https://portal.ejemplo.cl/operativos/xyz");
    expect(mensajePrivado("SERVICIO", operativo, e)).toContain("https://portal.ejemplo.cl/operativos/xyz");
  });

  it("un animal en peligro siempre lleva a SOS Mascotas", () => {
    expect(mensajePrivado("SOS", operativo, e)).toContain("https://portal.ejemplo.cl/reportar");
  });

  it("por mensaje directo, sin contexto, lleva a la sección", () => {
    expect(mensajePrivado("OPERATIVO", null, e)).toContain("/operativos");
    expect(mensajePrivado("PERDI", null, e)).toContain("/mascotas/publicar?tipo=PERDIDA");
    expect(mensajePrivado("ADOPTAR", null, e)).toContain("/adoptar");
  });

  it("un saludo no genera mensaje privado y la respuesta pública no lleva enlaces", () => {
    expect(mensajePrivado("GRACIAS", aviso, e)).toBeNull();
    expect(respuestaPublica("GRACIAS", false)).toBe("Gracias por tu apoyo.");
    expect(respuestaPublica("VISTO", true)).not.toMatch(/https?:/);
  });

  it("los mensajes caben en el límite de Instagram (1000 bytes) y no usan «usted»", () => {
    for (const i of ["SOS", "VISTO", "ES_MIO", "PERDI", "OPERATIVO", "SERVICIO", "ADOPTAR", "OTRO"] as const) {
      for (const c of [null, aviso, operativo]) {
        const m = mensajePrivado(i, c, e);
        if (!m) continue;
        expect(Buffer.byteLength(m, "utf8")).toBeLessThan(1000);
        expect(m).not.toMatch(/\busted\b/i);
      }
    }
  });
});
