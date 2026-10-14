// Las funciones que usa el panel y el portal, sobre la demo cargada con la
// fecha de corte fija, reproducen demo/datos/resumen.json y prioridad.json.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
const leer = <T,>(f: string) => (JSON.parse(readFileSync(join(process.cwd(), "demo", "datos", f), "utf8")) as { datos: T }).datos;
const resumen = leer<{
  situacion_actual: { solicitudes_pendientes: number; reportes_recientes_30_dias: number; atenciones_realizadas_12_meses: number; adopciones_12_meses: number };
  retrato_comuna: { animales_en_plataforma: number; perros: number; gatos: number; esterilizados: number; con_microchip: number; reencuentros_12_meses: number; perros_comunitarios: number; comunitarios_que_necesitan_atencion: number };
  perdidas_por_mes: Record<string, number>;
  sector_prioritario: string;
}>("resumen.json");
const referencia = leer<{ sector_id: string; indice: number; nivel: string; recomendacion: string }[]>("prioridad.json");

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let ind: typeof import("./indicadores");
let intel: typeof import("@/servidor/inteligencia");

beforeAll(async () => {
  base = await crearBaseTemporal();
  // La conexión global (src/servidor/db.ts) se crea al importarla: se apunta antes a la base temporal.
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  const { db } = await import("@/servidor/db");
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  ind = await import("./indicadores");
  intel = await import("@/servidor/inteligencia");
}, 120_000);

afterAll(async () => {
  const { db } = await import("@/servidor/db");
  await db.$disconnect();
  base?.borrar();
});

describe("resumen del panel con la fecha de corte", () => {

  it("prioridad: índices, niveles, recomendación y sector prioritario de prioridad.json", async () => {
    const p = await ind.prioridades(CORTE);
    expect(p.map((x) => [x.clave, x.puntaje, x.nivel.toLowerCase(), x.recomendacion])).toEqual(
      referencia.map((r) => [r.sector_id, r.indice, r.nivel, r.recomendacion]),
    );
    expect(p[0].clave).toBe(resumen.sector_prioritario);
  });

  it("bandeja: postulaciones recibidas y en evaluación (los perros comunitarios los gestionan sus cuidadores)", async () => {
    const b = await ind.pendientesDeRevision();
    // Todas las fichas de la demo las propusieron vecinos: sus postulaciones no
    // llegan al municipio. De los perros por atender, solo com-04 tiene foto.
    expect(b.postulaciones).toBe(0);
    expect(b.propuestas).toBe(0);
    expect(b).not.toHaveProperty("comunitarios");
    expect(b.coincidencias).toBe(1); // pub-047 / pub-048
  });
});

describe("inteligencia con la fecha de corte", () => {
  it("retrato de la comuna", async () => {
    const r = await intel.retratoComuna(CORTE);
    const e = resumen.retrato_comuna;
    expect(r).toEqual({
      animales: e.animales_en_plataforma,
      perros: e.perros,
      gatos: e.gatos,
      esterilizados: e.esterilizados,
      conMicrochip: e.con_microchip,
      reencuentros: e.reencuentros_12_meses,
      // Los perros comunitarios se cuentan como se muestran: con foto (com-01, com-02, com-04, com-05).
      comunitarios: 4,
    });
  });

  it("impacto del programa en 12 meses: operativos, atenciones por servicio, adopciones y reencuentros", async () => {
    const i = await intel.impactoDelPrograma(CORTE);
    const r = resumen.situacion_actual;
    expect([i.operativos, i.atenciones, i.adopciones, i.reencuentros]).toEqual([4, r.atenciones_realizadas_12_meses, r.adopciones_12_meses, resumen.retrato_comuna.reencuentros_12_meses]);
    expect(i.atencionesPorServicio).toEqual([
      { servicio: "Vacunación", cantidad: 32 },
      { servicio: "Microchip", cantidad: 26 },
      { servicio: "Esterilización", cantidad: 25 },
    ]);
  });

});

describe("mapa del panel con la fecha de corte", () => {
  const reportesJson = leer<{ fecha: string; sector_id: string }[]>("reportes.json");

  it("reportes por sector y mes coinciden con reportes.json", async () => {
    const { datosMapa } = await import("./mapa");
    const d = await datosMapa(CORTE);
    for (const s of d.sectores) {
      d.meses.forEach((m, i) => {
        expect(s.porMes.reportes[i]).toBe(reportesJson.filter((r) => r.sector_id === s.clave && r.fecha.startsWith(m.mes)).length);
      });
    }
    // Los puntos para el calor son los mismos reportes del período.
    expect(d.reportes).toHaveLength(d.sectores.reduce((t, s) => t + s.porMes.reportes.reduce((a, b) => a + b, 0), 0));
  });

  it("la capa de prioridad usa el mismo índice que el resumen", async () => {
    const { datosMapa } = await import("./mapa");
    const d = await datosMapa(CORTE);
    const huerta = d.sectores.find((s) => s.clave === "la-huerta")!;
    expect([huerta.nivel, huerta.puntaje]).toEqual(["ALTA", 1]);
    expect(huerta.pendientes).toBe(22);
  });
});
