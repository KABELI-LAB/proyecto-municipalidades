import { readdirSync, readFileSync, statSync } from "node:fs";
import { AsyncLocalStorage } from "node:async_hooks";
import { join } from "node:path";
import { ENCABEZADO_MUNICIPIO } from "./municipio-claves";

export type Municipio = {
  id: string;
  nombre: string;
  nombreOficial: string;
  /** Nombre de la plataforma que ven las vecinas y vecinos (por ejemplo, «Pawni»). */
  plataforma: string;
  /** Firma institucional en dos líneas; el corte va después de «Municipalidad». */
  firma: [string, string];
  sitioWeb: string;
  region: string;
  /** Zona horaria IANA para mostrar fechas y horas. */
  zonaHoraria: string;
  identidad: {
    /** Escudo a color (nivel institucional, sobre fondos claros). */
    escudo: string;
    /** Logotipo con «Somos tod@s» (nivel ciudadano, sobre blanco). */
    logoCiudadano: string;
    /** Versión vertical en blanco, para fondos azules. */
    logoBlanco: string;
    /** Marca digital cuadrada: favicon y avatar. */
    marcaDigital: string;
    /** Logotipo que ya trae el nombre, para el panel (si no, escudo + nombre). */
    logoInstitucional?: string;
  };
  parametros: {
    limitePorHogar: number;
    /**
     * Invitaciones prioritarias a operativos (retienen cupos para quienes
     * solicitaron el servicio). Apagadas si no se indica: las solicitudes
     * solo miden la necesidad de la comuna.
     */
    invitacionesPrioritarias?: boolean;
  };
};

const ID_VALIDO = /^[a-z0-9-]+$/;
const carpeta = () => join(process.cwd(), "config", "municipios");

// Cada configuración se lee una vez y se vuelve a leer solo si el archivo cambia.
const cache = new Map<string, { modificado: number; revisado: number; municipio: Municipio }>();

/** Lee config/municipios/<id>.json. */
export function municipioPorId(id: string): Municipio {
  if (!ID_VALIDO.test(id)) throw new Error(`Municipio no válido: ${id}`);
  const ruta = join(carpeta(), `${id}.json`);
  const ahora = Date.now();
  const guardado = cache.get(id);
  if (guardado && ahora - guardado.revisado < 1000) return guardado.municipio;
  const modificado = statSync(ruta).mtimeMs;
  if (!guardado || guardado.modificado !== modificado) {
    // «Pawni» si la configuración no trae nombre de plataforma.
    const municipio = { plataforma: "Pawni", ...(JSON.parse(readFileSync(ruta, "utf8")) as Omit<Municipio, "plataforma">) };
    cache.set(id, { modificado, revisado: ahora, municipio });
    return municipio;
  }
  guardado.revisado = ahora;
  return guardado.municipio;
}

/** Municipios configurados (config/municipios/*.json). */
export function idsMunicipios(): string[] {
  return readdirSync(carpeta())
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .filter((id) => ID_VALIDO.test(id));
}

/** El municipio de la variable MUNICIPIO: el que se ve sin elegir otro, y el de los scripts. */
export function municipioPredeterminado(): Municipio {
  const id = process.env.MUNICIPIO;
  if (!id || !ID_VALIDO.test(id)) {
    throw new Error("Falta la variable MUNICIPIO o no es válida (revisa el archivo .env).");
  }
  return municipioPorId(id);
}

// Municipio fijado a mano para un trabajo (cachés, scripts, tareas después de responder).
const contexto = new AsyncLocalStorage<string>();

/** Ejecuta `trabajo` con `id` como municipio activo (donde no hay ruta ni encabezado que lo digan). */
export function conMunicipio<T>(id: string, trabajo: () => T): T {
  return contexto.run(id, trabajo);
}

/**
 * El municipio de la solicitud en curso. Al armar una página viene del
 * segmento [municipio] de la ruta (next/root-params, que no impide guardarla
 * armada); en acciones y rutas de API, del encabezado que pone src/proxy.ts;
 * fuera de Next (scripts, pruebas), el predeterminado.
 */
export async function municipioActivo(): Promise<Municipio> {
  const fijado = contexto.getStore();
  if (fijado) return municipioPorId(fijado);
  if (process.env.NEXT_RUNTIME) {
    try {
      const { municipio } = await import("next/root-params");
      const id = await municipio();
      if (id && ID_VALIDO.test(id)) return municipioPorId(id);
    } catch {
      // Fuera del armado de una página (acción o ruta de API): se usa el encabezado.
    }
    try {
      const { headers } = await import("next/headers");
      const id = (await headers()).get(ENCABEZADO_MUNICIPIO);
      if (id && ID_VALIDO.test(id)) return municipioPorId(id);
    } catch {
      // Sin solicitud en curso (por ejemplo, después de responder).
    }
  }
  return municipioPredeterminado();
}
