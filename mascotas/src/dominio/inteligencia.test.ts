import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { alertaPreventiva, avisoPreventivo, finDeMes, nombreMes, porMes, ultimos12Meses, type PerdidaSector } from "./inteligencia";

const leer = <T,>(f: string) => (JSON.parse(readFileSync(join(process.cwd(), "demo", "datos", f), "utf8")) as { datos: T }).datos;
const publicaciones = leer<{ tipo: string; fecha: string; sector_id: string }[]>("publicaciones.json");
const resumen = leer<{ perdidas_por_mes: Record<string, number> }>("resumen.json");
const perdidas: PerdidaSector[] = publicaciones.filter((p) => p.tipo === "perdida").map((p) => ({ mes: p.fecha.slice(0, 7), sectorId: p.sector_id, sector: p.sector_id }));

describe("pérdidas por mes", () => {
  it("reproduce resumen.json en los últimos 12 meses, con ceros donde no hubo", () => {
    const serie = porMes("2026-10-06", perdidas.map((p) => p.mes));
    expect(serie.map((s) => s.mes)).toEqual(ultimos12Meses("2026-10-06"));
    expect(serie[0].mes).toBe("2025-11");
    for (const s of serie) expect(s.cantidad).toBe(resumen.perdidas_por_mes[s.mes] ?? 0);
  });

  it("nombra los meses en español", () => {
    expect(nombreMes("2027-01")).toBe("enero de 2027");
  });
});

describe("alerta preventiva", () => {
  it("el 6 de octubre de 2026 la próxima es enero de 2027, con referencia en enero de 2026", () => {
    const a = alertaPreventiva("2026-10-06", perdidas);
    expect([a.mesObjetivo, a.mesReferencia, a.activaDesde, a.activa]).toEqual(["2027-01", "2026-01", "2026-12-02", false]);
    expect(a.diasParaActivar).toBe(57);
    // Enero de 2026: Hualañé 2, Los Coipos 1, La Huerta 1. Hualañé ya suma la mitad.
    expect(a.totalReferencia).toBe(4);
    expect(a.detalle.map((s) => [s.sectorId, s.perdidas])).toEqual([["hualane", 2], ["la-huerta", 1], ["los-coipos", 1]]);
    expect(a.sectores.map((s) => s.sectorId)).toEqual(["hualane"]);
  });

  it("se activa 30 días antes del mes de riesgo", () => {
    expect(alertaPreventiva("2026-12-01", perdidas).activa).toBe(false);
    expect(alertaPreventiva("2026-12-02", perdidas).activa).toBe(true);
  });

  it("antes de septiembre usa septiembre del año anterior", () => {
    const a = alertaPreventiva("2027-08-10", perdidas);
    expect([a.mesObjetivo, a.mesReferencia, a.activa]).toEqual(["2027-09", "2026-09", true]);
    // Septiembre de 2026: Hualañé 7 de 12.
    expect(a.sectores.map((s) => [s.sectorId, s.perdidas])).toEqual([["hualane", 7]]);
  });

  it("sin pérdidas de referencia no propone sectores", () => {
    const a = alertaPreventiva("2025-08-10", perdidas); // septiembre de 2024: sin datos
    expect(a.sectores).toEqual([]);
    expect(a.totalReferencia).toBe(0);
  });
});

describe("avisoPreventivo", () => {
  it("propone un borrador vigente desde la activación hasta el fin del mes de riesgo", () => {
    const a = avisoPreventivo({ mesObjetivo: "2027-01", activaDesde: "2026-12-02" }, "2026-10-06");
    expect(a).toMatchObject({ titulo: "Antes de enero, identifique a su mascota", desde: "2026-12-02", hasta: "2027-01-31" });
  });
  it("si la alerta ya está activa, parte hoy", () => {
    expect(avisoPreventivo({ mesObjetivo: "2026-09", activaDesde: "2026-08-02" }, "2026-08-20").desde).toBe("2026-08-20");
    expect(finDeMes("2028-02")).toBe("2028-02-29");
  });
});
