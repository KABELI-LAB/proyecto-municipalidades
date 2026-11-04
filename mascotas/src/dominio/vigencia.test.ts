import { describe, expect, it } from "vitest";
import { accionVigencia, limiteParaResponder, nuevaVigencia } from "./vigencia";

const d = (dia: string) => new Date(`${dia}T12:00:00Z`);

describe("accionVigencia", () => {
  const abierta = { estado: "ABIERTA", vigenteHasta: d("2026-10-10"), vigenciaPedidaEn: null };

  it("no hace nada antes de cumplir los 30 días", () => {
    expect(accionVigencia(abierta, d("2026-10-09"))).toBe("ninguna");
  });
  it("pide confirmar al cumplir los 30 días", () => {
    expect(accionVigencia(abierta, d("2026-10-10"))).toBe("pedir");
  });
  it("espera 7 días la respuesta y luego archiva", () => {
    const pedida = { ...abierta, vigenciaPedidaEn: d("2026-10-10") };
    expect(accionVigencia(pedida, d("2026-10-16"))).toBe("ninguna");
    expect(accionVigencia(pedida, d("2026-10-17"))).toBe("archivar");
  });
  it("no toca publicaciones ya resueltas", () => {
    expect(accionVigencia({ ...abierta, estado: "REENCONTRADA" }, d("2027-01-01"))).toBe("ninguna");
  });
  it("calcula el plazo para responder y la nueva vigencia", () => {
    expect(limiteParaResponder(d("2026-10-10")).toISOString().slice(0, 10)).toBe("2026-10-17");
    expect(nuevaVigencia(d("2026-10-10")).toISOString().slice(0, 10)).toBe("2026-11-09");
  });
});
