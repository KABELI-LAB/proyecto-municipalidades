import { describe, expect, it } from "vitest";
import { calcularResultado, capacidadSugerida } from "./operativos";
import { puede } from "./permisos";

describe("ciclo de operativos", () => {

  it("sugiere capacidad según la demanda pendiente", () => {
    expect(capacidadSugerida(0)).toBe(10);
    expect(capacidadSugerida(9)).toBe(15);
    expect(capacidadSugerida(14)).toBe(25);
  });

  it("calcula el resultado del cierre", () => {
    const r = calcularResultado(
      [
        { servicio: "esterilizacion", estado: "ASISTIO" },
        { servicio: "esterilizacion", estado: "NO_ASISTIO" },
        { servicio: "microchip", estado: "ASISTIO" },
        { servicio: "microchip", estado: "EN_LISTA_ESPERA" },
        { servicio: "microchip", estado: "CANCELADO_PERSONA" },
      ],
      [
        { servicio: "esterilizacion", resultado: "REALIZADA" },
        { servicio: "microchip", resultado: "REALIZADA" },
        { servicio: "microchip", resultado: "REALIZADA" }, // espontánea
        { servicio: "esterilizacion", resultado: "NO_REALIZADA" },
      ],
    );
    expect(r).toEqual({ inscritos: 3, asistentes: 2, atenciones: 3, porServicio: { esterilizacion: 1, microchip: 2 }, demandaNoCubierta: 1 });
  });
});

describe("permisos", () => {
  it("el directivo ve indicadores pero no datos personales ni gestiona", () => {
    expect(puede("DIRECTIVO", "verIndicadores")).toBe(true);
    expect(puede("DIRECTIVO", "verInscritos")).toBe(false);
    expect(puede("DIRECTIVO", "gestionarOperativos")).toBe(false);
  });

  it("terreno registra atenciones pero no ve inteligencia ni crea operativos", () => {
    expect(puede("TERRENO", "registrarAtenciones")).toBe(true);
    expect(puede("TERRENO", "verSectores")).toBe(false);
    expect(puede("TERRENO", "gestionarOperativos")).toBe(false);
  });

  it("comunicaciones no ve sectores ni indicadores sanitarios", () => {
    expect(puede("COMUNICACIONES", "verBandeja")).toBe(true);
    expect(puede("COMUNICACIONES", "verSectores")).toBe(false);
    expect(puede("COMUNICACIONES", "verIndicadores")).toBe(false);
  });
});
