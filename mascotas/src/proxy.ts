// Elige el municipio de cada visita sin cambiar las direcciones: «/mascotas»
// se arma internamente como «/<municipio>/mascotas» (src/app/[municipio]/).
// El municipio viene de la cookie que pone el selector de la demostración, o
// es el predeterminado. Así cada municipio tiene sus páginas guardadas armadas
// por separado y la cookie no obliga a armarlas en cada visita.
import { NextResponse, type NextRequest } from "next/server";
import municipios from "@/generated/municipios.json";
import { COOKIE_MUNICIPIO, ENCABEZADO_MUNICIPIO } from "@/lib/municipio-claves";

const IDS = new Set<string>(municipios.ids);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const primero = pathname.split("/")[1] ?? "";
  // Dirección que ya trae el municipio (la propia reescritura, o un enlace directo).
  const explicito = IDS.has(primero);
  const elegido = request.cookies.get(COOKIE_MUNICIPIO)?.value;
  const id = explicito ? primero : elegido && IDS.has(elegido) ? elegido : municipios.predeterminado;

  const encabezados = new Headers(request.headers);
  encabezados.set(ENCABEZADO_MUNICIPIO, id);
  const respuesta = explicito
    ? NextResponse.next({ request: { headers: encabezados } })
    : NextResponse.rewrite(new URL(`/${id}${pathname}${request.nextUrl.search}`, request.url), { request: { headers: encabezados } });
  // La misma dirección cambia según la cookie: que la red de Netlify no las mezcle.
  respuesta.headers.set("Netlify-Vary", `cookie=${COOKIE_MUNICIPIO}`);
  return respuesta;
}

export const config = {
  // Todo menos archivos de Next, rutas de API, imágenes de redes y archivos estáticos.
  matcher: ["/((?!_next/|api/|redes/|ds/|fotos/|pawni/|favicon|.*\\.[a-z0-9]+$).*)"],
};
