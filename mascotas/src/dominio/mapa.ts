// Reglas de dibujo de los mapas (portal y panel) sobre el mapa base.
import type { Punto } from "./geo";

/** Intensidad en 4 niveles (0 = sin registros) respecto del máximo, para colorear por sector. */
export function nivelIntensidad(valor: number, maximo: number): 0 | 1 | 2 | 3 {
  if (valor <= 0 || maximo <= 0) return 0;
  const f = valor / maximo;
  return f > 2 / 3 ? 3 : f > 1 / 3 ? 2 : 1;
}

export type Lado = "derecha" | "izquierda" | "abajo" | "arriba";
type Caja = { x0: number; y0: number; x1: number; y1: number };
export type Circulo = { x: number; y: number; r: number; ancho: number; alto: number };

const SEPARACION = 4;
const seCruzan = (a: Caja, b: Caja) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

function caja(c: Circulo, lado: Lado): Caja {
  const d = c.r + SEPARACION;
  switch (lado) {
    case "derecha":
      return { x0: c.x + d, x1: c.x + d + c.ancho, y0: c.y - c.alto / 2, y1: c.y + c.alto / 2 };
    case "izquierda":
      return { x0: c.x - d - c.ancho, x1: c.x - d, y0: c.y - c.alto / 2, y1: c.y + c.alto / 2 };
    case "abajo":
      return { x0: c.x - c.ancho / 2, x1: c.x + c.ancho / 2, y0: c.y + d, y1: c.y + d + c.alto };
    case "arriba":
      return { x0: c.x - c.ancho / 2, x1: c.x + c.ancho / 2, y0: c.y - d - c.alto, y1: c.y - d };
  }
}

/**
 * Elige el lado de cada etiqueta para que no tape círculos ni otras etiquetas
 * y quede dentro del lienzo. Si ningún lado sirve, usa la derecha.
 */
export function ubicarEtiquetas(circulos: Circulo[], ancho: number, alto: number): Lado[] {
  const ocupadas: Caja[] = circulos.map((c) => ({ x0: c.x - c.r, x1: c.x + c.r, y0: c.y - c.r, y1: c.y + c.r }));
  return circulos.map((c, i) => {
    const lados: Lado[] = ["derecha", "izquierda", "abajo", "arriba"];
    const libre = lados.find((l) => {
      const k = caja(c, l);
      const dentro = k.x0 >= 0 && k.y0 >= 0 && k.x1 <= ancho && k.y1 <= alto;
      return dentro && !ocupadas.some((o, j) => j !== i && seCruzan(k, o));
    });
    const lado = libre ?? "derecha";
    ocupadas.push(caja(c, lado));
    return lado;
  });
}

/** Mapa de calor: solo se muestra calor donde hay al menos 3 registros (CLAUDE.md). */
export const MINIMO_CALOR = 3;
/** Lado de la celda, en grados: cerca de 1 km en la latitud de la comuna. */
const CELDA_LAT = 0.009;
const CELDA_LNG = 0.011;

/** `limites`: el cuadro de la celda (sur, oeste, norte, este), para dibujarla sobre el mapa base. */
export type Celda = { clave: string; centro: Punto; cantidad: number; limites: [[number, number], [number, number]] };

/**
 * Agrupa puntos en celdas de ~1 km y devuelve solo las que alcanzan el mínimo.
 * Se dibuja el centro de la celda, nunca el punto de un registro.
 */
export function celdasCalor(puntos: Punto[], minimo = MINIMO_CALOR): Celda[] {
  const celdas = new Map<string, { i: number; j: number; cantidad: number }>();
  for (const p of puntos) {
    const i = Math.floor(p.lat / CELDA_LAT);
    const j = Math.floor(p.lng / CELDA_LNG);
    const clave = `${i}:${j}`;
    const c = celdas.get(clave) ?? { i, j, cantidad: 0 };
    c.cantidad++;
    celdas.set(clave, c);
  }
  return [...celdas.entries()]
    .filter(([, c]) => c.cantidad >= minimo)
    .map(([clave, c]) => ({
      clave,
      cantidad: c.cantidad,
      centro: { lat: (c.i + 0.5) * CELDA_LAT, lng: (c.j + 0.5) * CELDA_LNG },
      limites: [
        [c.i * CELDA_LAT, c.j * CELDA_LNG],
        [(c.i + 1) * CELDA_LAT, (c.j + 1) * CELDA_LNG],
      ] as [[number, number], [number, number]],
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}
