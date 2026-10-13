import { describe, expect, it } from "vitest";
import { digitoVerificador, formatearRut, normalizarRut } from "./rut";

describe("rut", () => {
  it("calcula el dígito verificador", () => {
    expect(digitoVerificador(12345678)).toBe("5");
    expect(digitoVerificador(11111111)).toBe("1");
  });

  it("normaliza con o sin puntos y guion, y rechaza dígitos erróneos", () => {
    expect(normalizarRut("12.345.678-5")).toBe("12345678-5");
    expect(normalizarRut("123456785")).toBe("12345678-5");
    expect(normalizarRut("12.345.678-4")).toBeNull();
    expect(normalizarRut("abc")).toBeNull();
  });

  it("formatea con puntos", () => {
    expect(formatearRut("12345678-5")).toBe("12.345.678-5");
  });
});
