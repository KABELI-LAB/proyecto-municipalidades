import { describe, expect, it } from "vitest";
import { generarCodigo, FORMATO_CODIGO } from "./codigo";
import { distanciaKm, punto } from "./geo";

describe("distancias", () => {
  it("calcula kilómetros entre localidades de demo/coordenadas.json", () => {
    // La Huerta ↔ Orilla de Valdés: cerca; La Huerta ↔ Patacón: lejos.
    expect(distanciaKm({ lat: -35.0895, lng: -71.6557 }, { lat: -35.067, lng: -71.7 })).toBeCloseTo(4.74, 2);
    expect(distanciaKm({ lat: -35.0895, lng: -71.6557 }, { lat: -34.9, lng: -71.783 })).toBeGreaterThan(20);
  });

  it("solo arma un punto con ambas coordenadas", () => {
    expect(punto(-35, null)).toBeNull();
    expect(punto(-35, -71)).toEqual({ lat: -35, lng: -71 });
  });
});

describe("código de seguimiento", () => {
  it("usa el formato oficial TR-NNNN", () => {
    expect(generarCodigo(() => 0.4043)).toBe("TR-4043");
    expect(generarCodigo(() => 0)).toBe("TR-0000");
    expect(FORMATO_CODIGO.test(generarCodigo())).toBe(true);
  });
});
