// Coincidencias de mascotas perdidas y encontradas por reglas explicables
// (docs/concepto.md, sección 6). Es una función experimental: nunca afirma
// que se trata del mismo animal.
import { distanciaKm, type Punto } from "./geo";
import { numero } from "./formato";

export type PublicacionComparable = {
  id: string;
  tipo: "PERDIDA" | "ENCONTRADA";
  especie: string;
  sectorId: string;
  /** Coordenada aproximada de la localidad donde se perdió o encontró. */
  localidad: Punto | null;
  fechaEvento: Date;
  colorPrincipal: string;
  tamano: string | null;
  collar: string | null; // SI | NO | NO_SE
  colorCollar: string | null;
  senas: string | null;
};

export type Coincidencia = { id: string; puntaje: number; motivos: string[] };

export const VENTANA_DIAS = 15;
export const MAXIMO_RESULTADOS = 3;
export const PUNTAJE_MINIMO = 0.45;
/** Fuera del mismo sector, se comparan localidades a menos de esta distancia. */
export const DISTANCIA_MAXIMA_KM = 10;

const ORDEN_TAMANO: Record<string, number> = { PEQUENO: 0, MEDIANO: 1, GRANDE: 2 };

/**
 * Igual → 1; comparten un color («negro» y «negro con blanco») → 0,5; si no, 0.
 * «con» e «y» no son colores: «café con blanco» y «negro con gris» no coinciden por ellas.
 */
export function compatibilidadColor(a: string, b: string): number {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x === y) return 1;
  const colores = (c: string) => new Set(c.split(/\s+/).filter((p) => p !== "con" && p !== "y" && p.length > 2));
  const cx = colores(x);
  return [...colores(y)].some((p) => cx.has(p)) ? 0.5 : 0;
}

// Palabras que no ayudan a distinguir un animal de otro.
const VACIAS = new Set([
  "tiene", "tenia", "lleva", "llevaba", "esta", "este", "estaba", "como", "pero", "para", "porque", "cuando",
  "donde", "desde", "hasta", "sobre", "entre", "muy", "poco", "algo", "bien", "mucho", "harto", "color",
  "colores", "lado", "parte", "perro", "perra", "gato", "gata", "animal", "mascota", "anda", "andaba",
]);

const normalizar = (p: string) => p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Palabras significativas de un texto libre. La clave se compara sin tildes
 * ni mayúsculas; el valor es la palabra como la escribió la persona.
 */
export function palabrasClave(texto: string | null | undefined): Map<string, string> {
  const palabras = new Map<string, string>();
  for (const original of (texto ?? "").split(/[^\p{L}]+/u)) {
    const clave = normalizar(original);
    if (clave.length >= 4 && !VACIAS.has(clave) && !palabras.has(clave)) palabras.set(clave, original.toLowerCase());
  }
  return palabras;
}

/**
 * Compara `base` con publicaciones del tipo opuesto y devuelve hasta 3
 * posibles coincidencias, ordenadas por puntaje (0 a 1), con sus motivos.
 * Cercanía: mismo sector, o localidades a menos de 10 km según sus coordenadas.
 */
export function buscarCoincidencias(base: PublicacionComparable, candidatos: PublicacionComparable[]): Coincidencia[] {
  const resultados: Coincidencia[] = [];
  const senasBase = palabrasClave([base.senas, base.colorCollar].filter(Boolean).join(" "));

  for (const c of candidatos) {
    if (c.id === base.id || c.tipo === base.tipo) continue;
    // Obligatorios: misma especie, sector igual o vecino, dentro de la ventana de días.
    if (c.especie !== base.especie) continue;
    const mismoSector = c.sectorId === base.sectorId;
    const km = base.localidad && c.localidad ? distanciaKm(base.localidad, c.localidad) : null;
    if (!mismoSector && (km === null || km >= DISTANCIA_MAXIMA_KM)) continue;
    const dias = Math.abs(c.fechaEvento.getTime() - base.fechaEvento.getTime()) / 86_400_000;
    if (dias > VENTANA_DIAS) continue;
    // Color y tamaño deben ser compatibles.
    const color = compatibilidadColor(base.colorPrincipal, c.colorPrincipal);
    if (color === 0) continue;
    const difTamano =
      base.tamano && c.tamano ? Math.abs(ORDEN_TAMANO[base.tamano] - ORDEN_TAMANO[c.tamano]) : null;
    if (difTamano !== null && difTamano > 1) continue;

    const motivos = ["Misma especie"];
    let puntaje = 0;

    puntaje += mismoSector ? 0.3 : 0.15;
    motivos.push(mismoSector ? "Mismo sector" : `Localidades a ${numero(km!, 1)} km`);

    puntaje += 0.3 * color;
    motivos.push(color === 1 ? `Mismo color (${c.colorPrincipal})` : `Color parecido (${c.colorPrincipal})`);

    if (difTamano === 0) {
      puntaje += 0.2;
      motivos.push("Mismo tamaño");
    } else if (difTamano === 1) {
      puntaje += 0.05;
      motivos.push("Tamaño parecido");
    } else {
      puntaje += 0.1; // tamaño no informado en alguna de las dos
    }

    // Un collar puede perderse: que solo una lo tenga no descarta la coincidencia.
    if (base.collar === "SI" && c.collar === "SI") {
      puntaje += 0.05;
      motivos.push("Ambos con collar");
    }

    // Señas particulares (y color del collar): palabras significativas en común.
    const senasC = palabrasClave([c.senas, c.colorCollar].filter(Boolean).join(" "));
    const comunes = [...senasBase.keys()].filter((p) => senasC.has(p));
    if (comunes.length > 0) {
      puntaje += 0.15 * Math.min(1, comunes.length / Math.min(senasBase.size, senasC.size));
      motivos.push(`Señas en común: ${comunes.map((p) => senasBase.get(p)).join(", ")}`);
    }

    const diasRedondeados = Math.round(dias);
    motivos.push(
      diasRedondeados === 0
        ? "Mismo día"
        : diasRedondeados === 1
          ? "1 día de diferencia"
          : `${diasRedondeados} días de diferencia`,
    );

    puntaje = Math.round(puntaje * 100) / 100;
    if (puntaje >= PUNTAJE_MINIMO) resultados.push({ id: c.id, puntaje, motivos });
  }

  return resultados.sort((a, b) => b.puntaje - a.puntaje).slice(0, MAXIMO_RESULTADOS);
}

/** Motivo de una coincidencia que indicó quien vio al animal (vinculó su avistamiento a un aviso de pérdida). */
export const MOTIVO_AVISTAMIENTO = "Quien la vio indicó este aviso";
