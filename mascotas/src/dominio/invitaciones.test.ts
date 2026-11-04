import { describe, expect, it } from "vitest";
import { ordenarElegibles, PLAZO_HORAS, vencimiento } from "./invitaciones";

const H = 3_600_000;

describe("plazo de una invitación", () => {
  it("48 horas cuando el operativo está lejos", () => {
    const ahora = new Date("2026-10-01T12:00:00Z");
    expect(vencimiento(ahora, new Date("2026-10-20T03:00:00Z")).getTime()).toBe(ahora.getTime() + PLAZO_HORAS * H);
  });
  it("nunca después del día anterior al operativo", () => {
    const ahora = new Date("2026-10-01T12:00:00Z");
    const dia = new Date("2026-10-03T03:00:00Z");
    expect(vencimiento(ahora, dia).getTime()).toBe(dia.getTime() - 24 * H);
  });
  it("si el operativo es mañana, vence al empezar su día", () => {
    const ahora = new Date("2026-10-02T20:00:00Z");
    const dia = new Date("2026-10-03T03:00:00Z");
    expect(vencimiento(ahora, dia).getTime()).toBe(dia.getTime());
  });
});

describe("prioridad de las solicitudes", () => {
  const lugar = { lat: -35.0895, lng: -71.6557 };
  const s = (id: string, sectorId: string, dia: number, localidad: { lat: number; lng: number } | null) => ({ id, sectorId, localidad, creadaEn: new Date(2026, 8, dia) });
  it("primero el mismo sector, luego las cercanas; dentro de cada grupo, la más antigua; las lejanas no se invitan", () => {
    const orden = ordenarElegibles(
      [
        s("lejana", "otro", 1, { lat: -34.9, lng: -71.783 }), // a más de 20 km
        s("cercana", "otro", 2, { lat: -35.067, lng: -71.7 }), // a menos de 5 km
        s("sector-nueva", "huerta", 9, null),
        s("sector-antigua", "huerta", 3, null),
        s("sin-ubicacion", "otro", 1, null),
      ],
      "huerta",
      lugar,
    );
    expect(orden.map((x) => x.id)).toEqual(["sector-antigua", "sector-nueva", "cercana"]);
  });
});
