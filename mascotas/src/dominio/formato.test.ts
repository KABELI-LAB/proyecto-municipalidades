import { describe, expect, it } from "vitest";
import { diaISO, fechaCorta, hora, medianocheEn, numero, porcentaje } from "./formato";

const zona = "America/Santiago";

describe("formato chileno", () => {
  it("coma decimal y espacio antes de %", () => {
    expect(numero(1234.5, 1)).toBe("1.234,5");
    expect(porcentaje(0.45)).toBe("45 %");
  });

  it("la medianoche de un día cae en ese mismo día, con y sin horario de verano", () => {
    for (const dia of ["2026-10-06", "2026-06-15", "2026-01-20"]) {
      const m = medianocheEn(dia, zona);
      expect(diaISO(m, zona)).toBe(dia);
      expect(hora(m, zona)).toBe("00:00");
    }
  });

  it("formatea fechas y horas", () => {
    const d = new Date(medianocheEn("2026-10-06", zona).getTime() + 9.5 * 3_600_000);
    expect(hora(d, zona)).toBe("09:30");
    expect(fechaCorta(d, zona)).toBe("6 de octubre de 2026");
  });
});
