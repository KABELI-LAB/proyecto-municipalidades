import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { distanciaKm } from "./geo";
import { celdasCalor, nivelIntensidad, ubicarEtiquetas } from "./mapa";

describe("nivelIntensidad", () => {
  it("usa 0 sin registros y 3 para el máximo", () => {
    expect([0, 1, 2, 3, 5].map((v) => nivelIntensidad(v, 5))).toEqual([0, 1, 2, 2, 3]);
    expect(nivelIntensidad(3, 0)).toBe(0);
  });
});

describe("ubicarEtiquetas", () => {
  const etiqueta = { ancho: 100, alto: 40 };
  it("pone la etiqueta a la derecha si hay espacio", () => {
    expect(ubicarEtiquetas([{ x: 50, y: 100, r: 10, ...etiqueta }], 480, 360)).toEqual(["derecha"]);
  });
  it("cambia de lado cerca del borde derecho", () => {
    expect(ubicarEtiquetas([{ x: 450, y: 100, r: 10, ...etiqueta }], 480, 360)).toEqual(["izquierda"]);
  });
  it("evita tapar la etiqueta de un vecino", () => {
    const lados = ubicarEtiquetas(
      [
        { x: 200, y: 160, r: 20, ...etiqueta },
        { x: 350, y: 150, r: 10, ...etiqueta },
      ],
      480,
      360,
    );
    expect(lados[0]).toBe("derecha");
    expect(lados[1]).not.toBe("izquierda");
  });
});

describe("celdasCalor", () => {
  it("muestra calor solo donde hay 3 o más registros", () => {
    const p = { lat: -35.0685, lng: -71.7007 };
    expect(celdasCalor([p, p])).toEqual([]);
    const [c] = celdasCalor([p, p, { lat: -35.0687, lng: -71.7005 }]);
    expect(c.cantidad).toBe(3);
    // Se dibuja el centro de la celda, no la posición de un registro.
    expect(c.centro).not.toEqual(p);
    expect(distanciaKm(c.centro, p)).toBeLessThan(1);
    // El cuadro de la celda contiene los puntos que agrupa.
    const [[sur, oeste], [norte, este]] = c.limites;
    expect(p.lat).toBeGreaterThanOrEqual(sur);
    expect(p.lat).toBeLessThan(norte);
    expect(p.lng).toBeGreaterThanOrEqual(oeste);
    expect(p.lng).toBeLessThan(este);
  });

  it("con los reportes de la demo, las celdas con más reportes son el centro de Hualañé y Orilla de Valdés", () => {
    const reportes = (JSON.parse(readFileSync(join(process.cwd(), "demo", "datos", "reportes.json"), "utf8")) as { datos: { posicion: { lat: number; lng: number } }[] }).datos;
    const celdas = celdasCalor(reportes.map((r) => r.posicion));
    expect(celdas.every((c) => c.cantidad >= 3)).toBe(true);
    expect(distanciaKm(celdas[0].centro, { lat: -34.976, lng: -71.805 })).toBeLessThan(1.5);
    expect(distanciaKm(celdas[1].centro, { lat: -35.067, lng: -71.7 })).toBeLessThan(1.5);
  });
});
