import { describe, expect, it } from "vitest";
import { claveDesdeNombre, motivoCambioNoPermitido } from "./configuracion";

describe("claveDesdeNombre", () => {
  it("quita tildes, espacios y signos", () => {
    expect(claveDesdeNombre("Desparasitación externa")).toBe("desparasitacion-externa");
    expect(claveDesdeNombre("  Vacunación  ")).toBe("vacunacion");
  });
});

describe("motivoCambioNoPermitido", () => {
  const base = { esUnoMismo: false, rolActual: "COORDINADOR" as const, rolNuevo: "COORDINADOR" as const, activoNuevo: true, administradoresActivos: 1 };
  it("permite cambiar el rol de otra persona", () => {
    expect(motivoCambioNoPermitido({ ...base, rolNuevo: "DIRECTIVO" })).toBeNull();
  });
  it("no permite desactivarse ni cambiarse el rol a uno mismo", () => {
    expect(motivoCambioNoPermitido({ ...base, esUnoMismo: true, activoNuevo: false })).toMatch(/propia cuenta/);
    expect(motivoCambioNoPermitido({ ...base, esUnoMismo: true, rolNuevo: "DIRECTIVO" })).toMatch(/propio rol/);
  });
  it("siempre queda un administrador activo", () => {
    const admin = { ...base, rolActual: "ADMINISTRADOR" as const, rolNuevo: "ADMINISTRADOR" as const };
    expect(motivoCambioNoPermitido({ ...admin, activoNuevo: false })).toMatch(/al menos una/);
    expect(motivoCambioNoPermitido({ ...admin, rolNuevo: "COORDINADOR" })).toMatch(/al menos una/);
    expect(motivoCambioNoPermitido({ ...admin, activoNuevo: false, administradoresActivos: 2 })).toBeNull();
  });
});
