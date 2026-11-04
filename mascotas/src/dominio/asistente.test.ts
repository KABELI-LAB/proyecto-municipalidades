import { describe, expect, it } from "vitest";
import { RECORRIDO, SUGERENCIAS, responderPawni, temaDe } from "./asistente";

describe("Pawni entiende", () => {
  it("las preguntas sugeridas", () => {
    expect(SUGERENCIAS.map(temaDe)).toEqual(["QUE_ES", "OPERATIVO", "PERDI", "SOS", "ADOPTAR", "COSTO"]);
  });

  it("un animal en peligro va primero, aunque hable de otra cosa", () => {
    expect(temaDe("¿cuánto cuesta atender a un perro atropellado?")).toBe("SOS");
  });

  it("temas propios del portal", () => {
    expect(temaDe("como veo mis solicitudes")).toBe("SEGUIMIENTO");
    expect(temaDe("donde están los perros comunitarios")).toBe("COMUNITARIOS");
    expect(temaDe("¿es gratis?")).toBe("COSTO");
    expect(temaDe("asdf qwerty")).toBe("OTRO");
  });
});

describe("Pawni responde", () => {
  const op = { id: "op-1", cuando: "sábado 18 de octubre, de 09:00 a 13:00", donde: "Sede vecinal, Centro", abierto: true, conCupos: ["Vacuna antirrábica", "Microchip"] };

  it("el próximo operativo con sus datos reales y su enlace", () => {
    const r = responderPawni("OPERATIVO", op, "Pawni");
    expect(r.texto).toBe("El próximo operativo es el sábado 18 de octubre, de 09:00 a 13:00, en Sede vecinal, Centro. Quedan cupos para vacuna antirrábica y microchip.");
    expect(r.acciones[0]).toEqual({ texto: "Ver el operativo", href: "/operativos/op-1" });
  });

  it("sin operativo publicado, no inventa fechas", () => {
    expect(responderPawni("OPERATIVO", null, "Pawni").texto).toMatch(/no hay operativos publicados/);
    expect(responderPawni("OPERATIVO", { ...op, abierto: false }, "Pawni").texto).toMatch(/inscripciones ya cerraron/);
  });

  it("si no entiende, ofrece el recorrido", () => {
    expect(responderPawni("OTRO", null, "Pawni").acciones).toEqual([{ texto: "Recorrer el portal", href: RECORRIDO }]);
  });

  it("frases cortas, sin «debe» y sin pedir datos personales", () => {
    const temas = ["QUE_ES", "SALUDO", "SERVICIO", "COSTO", "PERDI", "VISTO", "ES_MIO", "SOS", "ADOPTAR", "SEGUIMIENTO", "COMUNITARIOS", "MAPA", "AVISOS", "SALUD", "GRACIAS", "OTRO"] as const;
    for (const t of temas) {
      const { texto } = responderPawni(t, null, "Pawni");
      expect(texto).not.toMatch(/\bdebe/i);
      for (const frase of texto.split(/(?<=[.?!])\s+/)) expect(frase.split(" ").length).toBeLessThanOrEqual(22);
    }
  });
});

describe("Pawni entiende modismos", () => {
  it("«se me arrancó» es perdí", () => {
    expect(temaDe("se me arrancó la perrita")).toBe("PERDI");
  });
});

describe("Pawni entiende una conversación real (reglas, sin IA)", () => {
  const casos: [string, string][] = [
    ["Hola pauli.", "SALUDO"],
    ["¿Qué puedo hacer en este portal?", "QUE_ES"],
    ["Quiero adoptar una mascota.", "ADOPTAR"],
    ["¿Qué puedo hacer si hay una jauría de perros cerca?", "SOS"],
    ["Hay un perro en peligro.", "SOS"],
    ["¿Qué puedo hacer si perdí a mi mascota?", "PERDI"],
    ["¿Sabes si hay algún operativo activo?", "OPERATIVO"],
    ["¿Dónde puedo solicitar un servicio?", "SERVICIO"],
    ["¿Cómo puedo revisar el estado de mis solicitudes?", "SEGUIMIENTO"],
    ["¿Cuántas mascotas hay perdidas en el sector?", "AVISOS"],
    ["¿Cuesta algo?", "COSTO"],
    ["¿Cuál es tu nombre?", "QUE_ES"],
    ["Gracias, muy amable", "GRACIAS"],
    ["oye mi perrito no come hace dos dias", "SALUD"],
  ];
  it.each(casos)("«%s» → %s", (texto, tema) => {
    expect(temaDe(texto)).toBe(tema);
  });
});
