import { describe, expect, it } from "vitest";
import { nombreMes, ultimos12Meses } from "./inteligencia";

describe("meses", () => {
  it("nombra los meses en español", () => {
    expect(nombreMes("2027-01")).toBe("enero de 2027");
  });

  it("los últimos 12 meses terminan en el mes actual", () => {
    const meses = ultimos12Meses("2026-10-06");
    expect([meses.length, meses[0], meses[11]]).toEqual([12, "2025-11", "2026-10"]);
  });
});
