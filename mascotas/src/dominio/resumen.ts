// El resumen para el equipo que escribe la inteligencia artificial: un titular,
// lo que destaca (cada punto con su cifra) y una o dos recomendaciones con el
// porqué. Se valida su forma y que no traiga cifras que no estén en los datos.
import { z } from "zod";

export const esquemaResumen = z.object({
  titular: z.string().trim().min(10).max(140),
  destacados: z
    .array(
      z.object({
        titulo: z.string().trim().min(3).max(48),
        cifra: z.number().int().nonnegative().nullable(),
        detalle: z.string().trim().min(5).max(200),
        /** «atencion»: algo que pide mirar con prioridad (se muestra en amarillo). */
        tono: z.enum(["normal", "atencion"]),
      }),
    )
    .min(2)
    .max(3),
  recomendaciones: z
    .array(z.object({ texto: z.string().trim().min(10).max(200), porque: z.string().trim().min(5).max(200) }))
    .min(1)
    .max(2),
});

export type ResumenEquipo = z.infer<typeof esquemaResumen>;

/** Todas las cifras que aparecen en los datos enviados. */
export function cifrasDe(datos: unknown): Set<number> {
  const s = new Set<number>();
  const recorrer = (x: unknown) => {
    if (typeof x === "number") s.add(x);
    else if (Array.isArray(x)) x.forEach(recorrer);
    else if (x && typeof x === "object") Object.values(x).forEach(recorrer);
  };
  recorrer(datos);
  return s;
}

/** Cifras escritas en el texto del resumen que no están en los datos (no debería haber). */
export function cifrasInventadas(r: ResumenEquipo, datos: unknown): number[] {
  const validas = cifrasDe(datos);
  // Además de los datos: conteos pequeños («3 sectores») y el período de los reportes.
  for (let n = 0; n <= 10; n++) validas.add(n);
  validas.add(30);
  const usadas = [
    ...r.destacados.map((d) => d.cifra).filter((n): n is number => n !== null),
    ...JSON.stringify([r.titular, r.destacados.map((d) => [d.titulo, d.detalle]), r.recomendaciones])
      .match(/\d+/g)
      ?.map(Number) ?? [],
  ];
  return [...new Set(usadas.filter((n) => !validas.has(n)))];
}

/** «debe» → «se recomienda», por si la IA no siguió la instrucción. */
export const suavizar = (t: string) => t.replace(/\b(se )?deben?\b/gi, (m) => (/^[SD]/.test(m) ? "Se recomienda" : "se recomienda"));

export function suavizarResumen(r: ResumenEquipo): ResumenEquipo {
  return {
    titular: suavizar(r.titular),
    destacados: r.destacados.map((d) => ({ ...d, titulo: suavizar(d.titulo), detalle: suavizar(d.detalle) })),
    recomendaciones: r.recomendaciones.map((x) => ({ texto: suavizar(x.texto), porque: suavizar(x.porque) })),
  };
}

/** Lee lo guardado: el resumen estructurado o, si es uno antiguo, su texto. */
export function leerResumen(guardado: string): ResumenEquipo | string {
  try {
    const r = esquemaResumen.safeParse(JSON.parse(guardado));
    return r.success ? r.data : guardado;
  } catch {
    return guardado;
  }
}
