import { describe, expect, it } from "vitest";
import { compromisosDeAdopcion, permite, TRANSICION_COINCIDENCIA, TRANSICION_REPORTE } from "./bandejas";

describe("transiciones de las bandejas", () => {
  it("un reporte se revisa desde abierto y se cierra desde abierto o en revisión", () => {
    expect(permite(TRANSICION_REPORTE, "revisar", "ABIERTO")).toBe(true);
    expect(permite(TRANSICION_REPORTE, "revisar", "EN_REVISION")).toBe(false);
    expect(permite(TRANSICION_REPORTE, "cerrar", "EN_REVISION")).toBe(true);
    expect(permite(TRANSICION_REPORTE, "cerrar", "CERRADO")).toBe(false);
  });
  it("una coincidencia descartada no registra reencuentro", () => {
    expect(permite(TRANSICION_COINCIDENCIA, "registrarReencuentro", "DESCARTADA")).toBe(false);
    expect(permite(TRANSICION_COINCIDENCIA, "registrarReencuentro", "VALIDADA")).toBe(true);
  });
});

describe("compromisosDeAdopcion", () => {
  it("pide esterilización y microchip solo si faltan; sin dato se considera que falta", () => {
    expect(compromisosDeAdopcion({ esterilizado: true, microchip: true })).toEqual([]);
    expect(compromisosDeAdopcion({ esterilizado: false, microchip: true })).toEqual(["esterilizacion"]);
    expect(compromisosDeAdopcion({ esterilizado: null, microchip: false })).toEqual(["esterilizacion", "microchip"]);
  });
});
