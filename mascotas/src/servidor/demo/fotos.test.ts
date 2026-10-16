import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { aplicarCambiosDeFotos, fotosFaltantes, type EntradaFotoAnimal } from "./fotos";

const colores = { perro: ["café", "negro", "gris"], gato: ["blanco", "negro"] };
const animales = [
  { id: "a1", especie: "perro", color: "gris", tamano: "mediano" },
  { id: "a2", especie: "gato", color: "blanco", tamano: "pequeño" },
];

describe("aplicarCambiosDeFotos", () => {
  it("aplica color y tamaño cuando el valor de origen coincide", () => {
    const r = aplicarCambiosDeFotos(animales, [{ foto: "x.png", animal_id: "a1", cambios: { color: ["gris", "negro"], tamano: ["mediano", "grande"] } }], colores);
    expect(r[0]).toMatchObject({ color: "negro", tamano: "grande" });
    expect(r[1]).toBe(animales[1]);
  });

  it("falla si el origen cambió, si el color no está en el catálogo o si el animal no existe", () => {
    const con = (e: EntradaFotoAnimal) => () => aplicarCambiosDeFotos(animales, [e], colores);
    expect(con({ foto: "x", animal_id: "a1", cambios: { color: ["café", "negro"] } })).toThrow(/espera que a1 sea «café»/);
    expect(con({ foto: "x", animal_id: "a2", cambios: { color: ["blanco", "naranjo"] } })).toThrow(/no está en el catálogo/);
    expect(con({ foto: "x", animal_id: "a9", cambios: { tamano: ["mediano", "grande"] } })).toThrow(/no está en animales.json/);
  });
});

describe("asignación aprobada de la demo", () => {
  const carpeta = join(process.cwd(), "demo", "fotos");
  const a = JSON.parse(readFileSync(join(carpeta, "asignacion.json"), "utf8")) as {
    animales: EntradaFotoAnimal[];
    comunitarios: EntradaFotoAnimal[];
    operativos: { foto: string }[];
  };

  it("todas las fotos asignadas existen en demo/fotos/", () => {
    expect(fotosFaltantes(carpeta, [...a.animales, ...a.comunitarios, ...a.operativos].map((x) => x.foto))).toEqual([]);
  });

  it("los cambios calzan con animales.json y con el catálogo de colores", () => {
    const leer = <T,>(f: string) => (JSON.parse(readFileSync(join(process.cwd(), "demo", "datos", f), "utf8")) as { datos: T }).datos;
    const cat = leer<{ colores_perro: string[]; colores_gato: string[] }>("catalogos.json");
    expect(() => aplicarCambiosDeFotos(leer<{ id: string; especie: string; color: string; tamano: string }[]>("animales.json"), [...a.animales, ...a.comunitarios], { perro: cat.colores_perro, gato: cat.colores_gato })).not.toThrow();
  });
});
