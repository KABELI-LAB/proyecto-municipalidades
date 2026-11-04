import { describe, expect, it } from "vitest";
import { alcanzaLimiteHogar, cuposDisponibles, decidirCupo } from "./cupos";

describe("cupos", () => {
  it("confirma mientras quede capacidad", () => {
    expect(decidirCupo(20, 19, 0)).toEqual({ estado: "CONFIRMADO" });
  });

  it("pasa a lista de espera por orden de llegada al agotarse", () => {
    expect(decidirCupo(20, 20, 0)).toEqual({ estado: "EN_LISTA_ESPERA", posicion: 1 });
    expect(decidirCupo(20, 20, 3)).toEqual({ estado: "EN_LISTA_ESPERA", posicion: 4 });
  });

  it("nunca informa cupos negativos", () => {
    expect(cuposDisponibles(10, 12)).toBe(0);
    expect(cuposDisponibles(10, 4)).toBe(6);
  });

  it("aplica el límite por hogar", () => {
    expect(alcanzaLimiteHogar(1, 2)).toBe(false);
    expect(alcanzaLimiteHogar(2, 2)).toBe(true);
  });
});
