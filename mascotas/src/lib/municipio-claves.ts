// Nombres compartidos por src/proxy.ts y el resto del servidor (sin acceso a archivos).

/** Encabezado con el municipio de la solicitud (lo pone src/proxy.ts). */
export const ENCABEZADO_MUNICIPIO = "x-municipio";
/** Cookie con el municipio que eligió la persona en la demostración. */
export const COOKIE_MUNICIPIO = "pawni-municipio";
