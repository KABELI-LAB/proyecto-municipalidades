// Adónde lleva «Volver» desde cada página: a la página de la que depende.

/** Páginas de bandeja del panel, reunidas en /panel/bandejas. */
export const BANDEJAS = ["reportes", "publicaciones", "coincidencias", "propuestas", "postulaciones"];

export type Contexto = "portal" | "panel";

export const CONFIG: Record<Contexto, { inicio: string; textoInicio: string; secciones: Record<string, string>; detalles: Record<string, string> }> = {
  portal: {
    inicio: "/",
    textoInicio: "Inicio",
    secciones: {
      mascotas: "Perdidas y avistadas",
      adoptar: "Adopción",
      comunitarios: "Perros comunitarios",
      operativos: "Operativos",
      avisos: "Avisos",
      "mis-solicitudes": "Mis solicitudes",
      servicio: "Solicitar un servicio",
      reportar: "SOS Mascotas",
      mapa: "Mapa",
    },
    detalles: {},
  },
  panel: {
    inicio: "/panel",
    textoInicio: "Inicio",
    secciones: {
      operativos: "Operativos",
      sectores: "Sectores",
      avisos: "Avisos",
      mapa: "Mapa",
      inteligencia: "Inteligencia",
      instagram: "Instagram",
      reportes: "Reportes",
      publicaciones: "Publicaciones",
      coincidencias: "Coincidencias",
      postulaciones: "Postulaciones",
    },
    // Volver desde una subpágina de un registro (por ejemplo, editar un operativo).
    detalles: { operativos: "al operativo", sectores: "al sector", avisos: "al aviso" },
  },
};

export function destinoVolver(contexto: Contexto, ruta: string): { href: string; texto: string } | null {
  const c = CONFIG[contexto];
  // Cada bandeja (y «Por aprobar») cuelga de la pantalla principal: basta «Inicio».
  if (contexto === "panel" && [...BANDEJAS, "aprobar"].some((b) => ruta === `/panel/${b}`)) return null;
  const padre = ruta.slice(0, ruta.lastIndexOf("/")) || "/";
  if (padre === c.inicio || padre === "/" || ruta === c.inicio) return null;
  const partes = padre.split("/").filter(Boolean);
  const ultima = partes[partes.length - 1];
  if (c.secciones[ultima]) return { href: padre, texto: `Volver a ${c.secciones[ultima]}` };
  const seccion = partes[partes.length - 2];
  return { href: padre, texto: c.detalles[seccion] ? `Volver ${c.detalles[seccion]}` : "Volver" };
}
