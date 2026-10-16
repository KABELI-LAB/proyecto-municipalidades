import { describe, expect, it } from "vitest";
import { buscarCoincidencias, compatibilidadColor, palabrasClave, type PublicacionComparable } from "./coincidencias";

const dia = (n: number) => new Date(Date.UTC(2026, 9, n));
// Coordenadas de demo/coordenadas.json.
const LA_HUERTA = { lat: -35.0895, lng: -71.6557 };
const ORILLA_DE_VALDES = { lat: -35.067, lng: -71.7 };
const PATACON = { lat: -34.9, lng: -71.783 };
const perdida: PublicacionComparable = {
  id: "p1",
  tipo: "PERDIDA",
  especie: "PERRO",
  sectorId: "la-huerta",
  localidad: ORILLA_DE_VALDES,
  fechaEvento: dia(1),
  colorPrincipal: "café",
  tamano: "MEDIANO",
  collar: "SI",
  colorCollar: "rojo",
  senas: "Mancha blanca en el pecho",
};
const encontrada = (cambios: Partial<PublicacionComparable>): PublicacionComparable => ({
  ...perdida,
  id: "e1",
  tipo: "ENCONTRADA",
  sectorId: "otro-sector",
  localidad: LA_HUERTA,
  fechaEvento: dia(3),
  senas: "Tiene una mancha blanca en el pecho",
  ...cambios,
});

describe("coincidencias", () => {
  it("encuentra el par evidente y explica por qué", () => {
    const [c] = buscarCoincidencias(perdida, [encontrada({})]);
    expect(c.id).toBe("e1");
    expect(c.puntaje).toBe(0.85);
    expect(c.motivos).toEqual([
      "Misma especie",
      "Localidades a 4,7 km",
      "Mismo color (café)",
      "Mismo tamaño",
      "Ambos con collar",
      "Señas en común: mancha, blanca, pecho, rojo",
      "2 días de diferencia",
    ]);
  });

  it("exige misma especie, tipo opuesto, sector igual o vecino y ventana de 15 días", () => {
    expect(buscarCoincidencias(perdida, [encontrada({ especie: "GATO" })])).toEqual([]);
    expect(buscarCoincidencias(perdida, [encontrada({ tipo: "PERDIDA" })])).toEqual([]);
    expect(buscarCoincidencias(perdida, [encontrada({ localidad: PATACON })])).toEqual([]);
    expect(buscarCoincidencias(perdida, [encontrada({ localidad: null })])).toEqual([]);
    expect(buscarCoincidencias(perdida, [encontrada({ fechaEvento: dia(17) })])).toEqual([]);
  });

  it("descarta colores y tamaños incompatibles", () => {
    expect(buscarCoincidencias(perdida, [encontrada({ colorPrincipal: "blanco" })])).toEqual([]);
    expect(
      buscarCoincidencias({ ...perdida, tamano: "PEQUENO" }, [encontrada({ tamano: "GRANDE" })]),
    ).toEqual([]);
  });

  it("no descarta si solo uno lleva collar: el collar puede perderse", () => {
    const [c] = buscarCoincidencias(perdida, [encontrada({ collar: "NO", colorCollar: null })]);
    expect(c.motivos).not.toContain("Ambos con collar");
    expect(c.puntaje).toBeGreaterThan(0.45);
  });

  it("devuelve como máximo 3, ordenadas por puntaje", () => {
    const candidatos = [
      encontrada({ id: "a", collar: null, colorCollar: null, senas: null }),
      encontrada({ id: "b", sectorId: "la-huerta" }),
      encontrada({ id: "c" }),
      encontrada({ id: "d", tamano: "GRANDE" }),
    ];
    const r = buscarCoincidencias(perdida, candidatos);
    expect(r.map((c) => c.id)).toEqual(["b", "c", "d"]);
  });

  it("en el mismo sector coincide aunque las localidades estén lejos o sin coordenada", () => {
    const [c] = buscarCoincidencias(perdida, [encontrada({ sectorId: "la-huerta", localidad: null })]);
    expect(c.motivos).toContain("Mismo sector");
  });

  it("reconoce colores parecidos sin contar «con»", () => {
    expect(compatibilidadColor("negro", "negro con blanco")).toBe(0.5);
    expect(compatibilidadColor("café con blanco", "negro con gris")).toBe(0);
    expect(compatibilidadColor("Café", "café")).toBe(1);
    expect(compatibilidadColor("gris", "crema")).toBe(0);
  });

  it("extrae palabras significativas de las señas", () => {
    const p = palabrasClave("Tiene la Oreja izquierda caída y una cicatriz");
    expect([...p.values()]).toEqual(["oreja", "izquierda", "caída", "cicatriz"]);
    expect(p.has("caida")).toBe(true); // se compara sin tildes
    expect(palabrasClave(null).size).toBe(0);
  });
});
