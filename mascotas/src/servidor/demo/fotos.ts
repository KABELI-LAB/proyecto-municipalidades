// Asignación de fotos aprobada (demo/fotos/asignacion.json): cada entrada
// puede pedir un ajuste de color o tamaño para que el animal calce con su
// foto. Se aplica al cargar, sin tocar demo/datos/, y solo si el valor de
// origen sigue siendo el que la asignación esperaba.
import { existsSync } from "node:fs";
import { join } from "node:path";

type Cambio = [de: string, a: string];
export type EntradaFotoAnimal = { foto: string; animal_id: string; cambios?: { color?: Cambio; tamano?: Cambio } };
type AnimalOrigen = { id: string; especie: string; color: string; tamano: string };

const TAMANOS = ["pequeño", "mediano", "grande"];

/**
 * Devuelve los animales con los cambios aprobados. Falla con un mensaje claro
 * si el animal no existe, si el valor de origen no coincide o si el color
 * nuevo no está en el catálogo de su especie.
 */
export function aplicarCambiosDeFotos<A extends AnimalOrigen>(animales: A[], entradas: EntradaFotoAnimal[], colores: { perro: string[]; gato: string[] }): A[] {
  const cambios = new Map(entradas.filter((e) => e.cambios && Object.keys(e.cambios).length > 0).map((e) => [e.animal_id, e.cambios!]));
  for (const id of cambios.keys()) {
    if (!animales.some((a) => a.id === id)) throw new Error(`asignacion.json cambia ${id}, que no está en animales.json.`);
  }
  return animales.map((a) => {
    const c = cambios.get(a.id);
    if (!c) return a;
    const nuevo = { ...a };
    if (c.color) {
      const [de, por] = c.color;
      if (a.color !== de) throw new Error(`asignacion.json espera que ${a.id} sea «${de}», pero animales.json dice «${a.color}».`);
      const catalogo = a.especie === "gato" ? colores.gato : colores.perro;
      if (!catalogo.includes(por)) throw new Error(`El color «${por}» para ${a.id} no está en el catálogo de ${a.especie}.`);
      nuevo.color = por;
    }
    if (c.tamano) {
      const [de, por] = c.tamano;
      if (a.tamano !== de) throw new Error(`asignacion.json espera que ${a.id} sea «${de}», pero animales.json dice «${a.tamano}».`);
      if (!TAMANOS.includes(por)) throw new Error(`El tamaño «${por}» para ${a.id} no es válido.`);
      nuevo.tamano = por;
    }
    return nuevo;
  });
}

/** Rutas de la asignación que no existen en demo/fotos/. */
export function fotosFaltantes(carpeta: string, rutas: string[]): string[] {
  return [...new Set(rutas)].filter((r) => !existsSync(join(carpeta, r)));
}
