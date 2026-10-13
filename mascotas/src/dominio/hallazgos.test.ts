import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { brechaIntervencion, concentracionDemanda, mesPico } from "./hallazgos";

const leer = <T,>(f: string) => (JSON.parse(readFileSync(join(process.cwd(), "demo", "datos", f), "utf8")) as { datos: T }).datos;

describe("hallazgos con los datos de la demo", () => {
  it("La Huerta concentra 18 de las 31 esterilizaciones pendientes", () => {
    const pendientes = leer<{ sector_id: string; servicio: string; estado: string }[]>("solicitudes.json").filter((s) => s.estado === "recibida");
    const agrupada = new Map<string, number>();
    for (const s of pendientes) agrupada.set(`${s.sector_id}|${s.servicio}`, (agrupada.get(`${s.sector_id}|${s.servicio}`) ?? 0) + 1);
    const c = concentracionDemanda([...agrupada.entries()].map(([k, cantidad]) => ({ sector: k.split("|")[0], servicio: k.split("|")[1], cantidad })));
    expect(c).toMatchObject({ servicio: "esterilizacion", sector: "la-huerta", cantidad: 18, total: 31 });
    expect(Math.round(c!.fraccion * 100)).toBe(58);
  });

  it("214 días sin operativo en La Huerta frente a 21 en Hualañé", () => {
    const p = leer<{ sector_id: string; factores: { dias_sin_intervencion: number } }[]>("prioridad.json");
    const b = brechaIntervencion(p.map((x) => ({ sector: x.sector_id, dias: x.factores.dias_sin_intervencion })));
    expect([b!.mayor, b!.menor]).toEqual([
      { sector: "la-huerta", dias: 214 },
      { sector: "hualane", dias: 21 },
    ]);
  });
});

describe("mesPico", () => {
  it("compara el mes con más pérdidas con el promedio de los demás", () => {
    const meses = [{ mes: "2026-09", cantidad: 12 }, ...Array.from({ length: 11 }, (_, i) => ({ mes: `m${i}`, cantidad: i < 6 ? 2 : 1 }))];
    const r = mesPico(meses)!;
    expect(r.mes).toBe("2026-09");
    expect(r.promedioResto).toBeCloseTo(17 / 11);
    expect(r.veces).toBeCloseTo(12 / (17 / 11));
  });
  it("sin pérdidas no hay hallazgo", () => {
    expect(mesPico([{ mes: "a", cantidad: 0 }, { mes: "b", cantidad: 0 }])).toBeNull();
  });
});
