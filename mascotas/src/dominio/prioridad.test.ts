import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calcularPrioridad, confianzaDe, nivelDe, recomendacionDe, type FactoresSector } from "./prioridad";

const pesos = { demanda: 0.4, reportes: 0.25, tiempo: 0.2, noCubierta: 0.15 };
const leer = <T,>(f: string) => (JSON.parse(readFileSync(join(process.cwd(), "demo", "datos", f), "utf8")) as { datos: T }).datos;

// Referencia: demo/datos/prioridad.json (índice y factores) y solicitudes.json (demanda por servicio).
type Ref = { sector_id: string; indice: number; nivel: string; factores: { demanda_pendiente: number; reportes_90_dias: number; dias_sin_intervencion: number; demanda_no_cubierta: number }; recomendacion: string };
const referencia = leer<Ref[]>("prioridad.json");
const solicitudes = leer<{ sector_id: string; servicio: string; estado: string }[]>("solicitudes.json");
const NOMBRES: Record<string, string> = { esterilizacion: "Esterilización", vacunacion: "Vacunación", microchip: "Microchip" };

const factores: FactoresSector[] = referencia.map((r) => ({
  sectorId: r.sector_id,
  nombre: r.sector_id,
  demandaPorServicio: Object.keys(NOMBRES).map((s) => ({
    nombre: NOMBRES[s],
    cantidad: solicitudes.filter((x) => x.sector_id === r.sector_id && x.servicio === s && x.estado === "recibida").length,
  })),
  reportes90: r.factores.reportes_90_dias,
  diasSinIntervencion: r.factores.dias_sin_intervencion,
  noCubierta: r.factores.demanda_no_cubierta,
}));

describe("prioridad", () => {
  const resultado = calcularPrioridad(factores, pesos);

  it("reproduce prioridad.json: índice, nivel y orden", () => {
    expect(resultado.map((p) => [p.sectorId, p.puntaje, p.nivel.toLowerCase()])).toEqual(
      referencia.map((r) => [r.sector_id, r.indice, r.nivel]),
    );
  });

  it("la demanda pendiente coincide con la de prioridad.json", () => {
    for (const r of referencia) expect(resultado.find((p) => p.sectorId === r.sector_id)!.demanda).toBe(r.factores.demanda_pendiente);
  });

  it("recomienda según el nivel, con las mismas palabras de prioridad.json", () => {
    for (const r of referencia) expect(resultado.find((p) => p.sectorId === r.sector_id)!.recomendacion).toBe(r.recomendacion);
  });

  it("explica con cifras y nunca usa «debe»", () => {
    const huerta = resultado.find((p) => p.sectorId === "la-huerta")!;
    expect(huerta.motivos).toEqual([
      "22 solicitudes pendientes (18 de esterilización)",
      "23 reportes en los últimos 90 días",
      "214 días desde el último operativo",
      "9 personas quedaron sin cupo en el último operativo",
    ]);
    for (const p of resultado) expect(p.recomendacion).not.toMatch(/debe/);
  });

  it("normaliza con mínimo y máximo: el menor de cada factor aporta 0", () => {
    const huerta = resultado.find((p) => p.sectorId === "la-huerta")!;
    expect(huerta.factores).toEqual({ D: 1, R: 1, T: 1, E: 1 });
    expect(resultado.find((p) => p.sectorId === "hualane")!.factores.T).toBe(0); // 21 días: el mínimo
  });

  it("trata un sector sin operativos como el que más tiempo lleva sin intervención", () => {
    const base = (nombre: string, dias: number | null): FactoresSector => ({ sectorId: nombre, nombre, demandaPorServicio: [], reportes90: 0, diasSinIntervencion: dias, noCubierta: 0 });
    const r = calcularPrioridad([base("A", 100), base("B", null), base("C", 10)], pesos);
    expect(r.find((p) => p.sectorId === "B")!.factores.T).toBe(1);
    expect(r.find((p) => p.sectorId === "B")!.motivos).toContain("Sin operativos registrados");
  });

  it("no divide por cero cuando todos los sectores son iguales", () => {
    const igual = (n: string): FactoresSector => ({ sectorId: n, nombre: n, demandaPorServicio: [], reportes90: 3, diasSinIntervencion: 5, noCubierta: 0 });
    for (const p of calcularPrioridad([igual("A"), igual("B")], pesos)) expect(p.puntaje).toBe(0);
  });

  it("niveles, recomendación y confianza según umbrales", () => {
    expect([nivelDe(0.66), nivelDe(0.65), nivelDe(0.33), nivelDe(0.32)]).toEqual(["ALTA", "MEDIA", "MEDIA", "BAJA"]);
    expect(recomendacionDe("BAJA", "Microchip")).toBe("Sin acción recomendada por ahora.");
    expect([confianzaDe(6), confianzaDe(12), confianzaDe(40)]).toEqual(["baja", "media", "alta"]);
  });
});
