// Consultas del portal que cambian poco y se piden en cada visita, guardadas en
// caché unos segundos: así no se consulta la base (en otra región) por cada
// página. Solo datos simples (sin fechas), que la caché guarda como JSON.
// Cada municipio tiene su propia entrada: su id va en la clave de la caché y
// la consulta corre con ese municipio fijado (dentro de la caché no hay ruta).
import "server-only";
import { unstable_cache } from "next/cache";
import { conMunicipio, municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { hayDatosDemo } from "@/servidor/demo/borrar";
import { impactoDelPrograma } from "@/servidor/inteligencia";
import { mapaPublico, mosaicoInicio } from "@/servidor/portal/consultas";

/** Segundos que una cifra puede tener de atraso en la portada. */
const SEGUNDOS = 60;

function porMunicipio<A extends unknown[], R>(consulta: (...a: A) => Promise<R>, clave: string) {
  const guardada = unstable_cache((id: string, ...a: A) => conMunicipio(id, () => consulta(...a)), [clave], { revalidate: SEGUNDOS });
  return async (...a: A) => guardada((await municipioActivo()).id, ...a);
}

export const hayDemoEnCache = porMunicipio(() => hayDatosDemo(db), "hay-demo");
export const impactoEnCache = porMunicipio(() => impactoDelPrograma(), "impacto-programa");
export const mapaPublicoEnCache = porMunicipio(() => mapaPublico(), "mapa-publico");
export const mosaicoEnCache = porMunicipio((n: number) => mosaicoInicio(n), "mosaico-inicio");
