// Consultas del portal que cambian poco y se piden en cada visita, guardadas en
// caché unos segundos: así no se consulta la base (en otra región) por cada
// página. Solo datos simples (sin fechas), que la caché guarda como JSON.
import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/servidor/db";
import { hayDatosDemo } from "@/servidor/demo/borrar";
import { impactoDelPrograma, retratoComuna } from "@/servidor/inteligencia";
import { mapaPublico, mosaicoInicio } from "@/servidor/portal/consultas";

/** Segundos que una cifra puede tener de atraso en la portada. */
const SEGUNDOS = 60;

export const hayDemoEnCache = unstable_cache(() => hayDatosDemo(db), ["hay-demo"], { revalidate: SEGUNDOS });
export const retratoEnCache = unstable_cache(() => retratoComuna(), ["retrato-comuna"], { revalidate: SEGUNDOS });
export const impactoEnCache = unstable_cache(() => impactoDelPrograma(), ["impacto-programa"], { revalidate: SEGUNDOS });
export const mapaPublicoEnCache = unstable_cache(() => mapaPublico(), ["mapa-publico"], { revalidate: SEGUNDOS });
export const mosaicoEnCache = unstable_cache((n: number) => mosaicoInicio(n), ["mosaico-inicio"], { revalidate: SEGUNDOS });
