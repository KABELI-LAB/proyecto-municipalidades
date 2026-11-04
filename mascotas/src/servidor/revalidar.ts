// Renueva páginas guardadas del municipio en curso. Las páginas se arman bajo
// /<municipio>/… (src/proxy.ts), así que «/mascotas» es «/<id>/mascotas».
import { revalidatePath as revalidarNext } from "next/cache";
import { municipioActivo } from "@/lib/municipio";

export async function revalidatePath(ruta: string, tipo?: "layout" | "page") {
  const { id } = await municipioActivo();
  revalidarNext(ruta === "/" ? `/${id}` : `/${id}${ruta}`, tipo);
}
