import { describe, expect, it } from "vitest";
import { especieYColor, tituloAviso } from "./etiquetas";

describe("especie y color con concordancia", () => {
  it("el color concuerda con una hembra; café, gris y tricolor no cambian", () => {
    expect(especieYColor("PERRO", "HEMBRA", "negro")).toBe("Perra negra");
    expect(especieYColor("PERRO", "HEMBRA", "negro con blanco")).toBe("Perra negra con blanco");
    expect(especieYColor("GATO", "HEMBRA", "atigrado")).toBe("Gata atigrada");
    expect(especieYColor("GATO", "HEMBRA", "naranjo")).toBe("Gata naranja");
    expect(especieYColor("PERRO", "HEMBRA", "café con blanco")).toBe("Perra café con blanco");
    expect(especieYColor("GATO", "HEMBRA", "tricolor")).toBe("Gata tricolor");
    expect(especieYColor("PERRO", "HEMBRA", "gris")).toBe("Perra gris");
  });

  it("en un macho o sin sexo conocido queda como se escribió", () => {
    expect(especieYColor("PERRO", "MACHO", "negro")).toBe("Perro negro");
    expect(especieYColor("PERRO", null, "blanco con negro")).toBe("Perro blanco con negro");
    expect(tituloAviso({ nombreAnimal: null, especie: "PERRO", sexo: "HEMBRA", colorPrincipal: "amarillo" })).toBe("Perra amarilla");
  });
});
