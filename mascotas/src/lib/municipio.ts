import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export type Municipio = {
  id: string;
  nombre: string;
  nombreOficial: string;
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

// Se lee una vez y se vuelve a leer solo si el archivo cambia (se usa en cada fecha que se formatea).
let cache: { ruta: string; modificado: number; revisado: number; municipio: Municipio } | null = null;

/** Lee el municipio activo desde config/municipios/<MUNICIPIO>.json. */
export function municipioActivo(): Municipio {
  const id = process.env.MUNICIPIO;
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    throw new Error("Falta la variable MUNICIPIO o no es válida (revisa el archivo .env).");
  }
  const ruta = join(process.cwd(), "config", "municipios", `${id}.json`);
  const ahora = Date.now();
  if (cache?.ruta === ruta && ahora - cache.revisado < 1000) return cache.municipio;
  const modificado = statSync(ruta).mtimeMs;
  if (cache?.ruta !== ruta || cache.modificado !== modificado) {
    cache = { ruta, modificado, revisado: ahora, municipio: JSON.parse(readFileSync(ruta, "utf8")) as Municipio };
  }
  cache.revisado = ahora;
  return cache.municipio;
}
