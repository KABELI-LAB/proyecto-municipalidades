// Publicación en Instagram: reglas puras, sin base de datos. Estados de una
// publicación y el texto que acompaña cada tipo. Solo se usa información
// existente y autorizada: nunca RUT, teléfonos, correos, domicilios,
// cuidadores ni datos de salud sin confirmar.

export type TipoRed = "OPERATIVO" | "ADOPCION" | "PERDIDA" | "AVISTADA";
export type EstadoRed = "BORRADOR" | "PENDIENTE_REVISION" | "APROBADO" | "PUBLICANDO" | "PUBLICADO" | "ERROR" | "CANCELADO";

/** Desde qué estados se puede publicar: aprobado, o reintentar tras un error. */
export const TRANSICION_RED = {
  publicar: ["APROBADO", "ERROR"],
} as const satisfies Record<string, readonly EstadoRed[]>;

export const puedeRed = (accion: keyof typeof TRANSICION_RED, estado: string) => (TRANSICION_RED[accion] as readonly string[]).includes(estado);

/** Etiquetas pocas y pertinentes: el programa y el municipio. */
export function etiquetas(municipio: string, extra: string[] = []): string {
  const comuna = municipio.normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "");
  return [...extra, "TenenciaResponsable", comuna].map((e) => `#${e}`).join(" ");
}

/** Dirección del portal para el texto, o una indicación sin enlace si no hay dirección pública. */
const enPortal = (url: string | null, ruta: string) => (url ? `en el portal municipal: ${url}${ruta}` : "en el portal de tenencia responsable de la municipalidad");

const juntar = (...partes: (string | null | false | undefined)[]) => partes.filter(Boolean).join("\n\n");

// ───────────── Operativo ─────────────

export type DatosOperativo = {
  id: string;
  sector: string;
  fecha: string; // «sábado 24 de octubre»
  horaInicio: string;
  horaFin: string;
  lugar: string;
  localidad: string;
  servicios: string[];
  requisitos: string;
};

export function textoOperativo(d: DatosOperativo, municipio: string, url: string | null) {
  const servicios = d.servicios.length ? `Servicios: ${listar(d.servicios.map((s) => s.toLowerCase()))}.` : null;
  const texto = juntar(
    `Operativo de tenencia responsable en ${d.sector}.`,
    `${mayuscula(d.fecha)}, de ${d.horaInicio} a ${d.horaFin} horas, en ${d.lugar}, ${d.localidad}.`,
    servicios,
    d.requisitos.trim() ? `Requisitos: ${d.requisitos.trim()}` : null,
    `Inscríbase ${enPortal(url, `/operativos/${d.id}`)}. Los cupos son limitados por servicio.`,
    etiquetas(municipio),
  );
  const alternativo = `Pieza informativa de la municipalidad: operativo de tenencia responsable en ${d.localidad}, ${d.fecha}, de ${d.horaInicio} a ${d.horaFin} horas.`;
  return { texto, alternativo };
}

// ───────────── Adopción ─────────────

export type DatosAdopcion = {
  id: string;
  nombre: string | null;
  especie: string; // «perro», «gata»
  tamano: string | null; // «mediano»
  donde: string | null; // localidad o sector
};

/** Sin afirmar salud, vacunas ni esterilización: los antecedentes se revisan en la ficha oficial. */
export function textoAdopcion(d: DatosAdopcion, municipio: string, url: string | null) {
  const quien = d.nombre ? `${d.nombre} busca hogar.` : `Este ${d.especie} busca hogar.`;
  const descripcion = [d.nombre ? `Es un ${d.especie}` : null, d.tamano ? `de tamaño ${d.tamano}` : null, d.donde ? `y está en ${d.donde}` : null].filter(Boolean).join(" ");
  const texto = juntar(
    quien,
    d.nombre && descripcion ? `${descripcion}.` : null,
    "Adoptar es un compromiso para toda su vida. Antes de postular, revise su ficha oficial con sus antecedentes y lo que necesita.",
    `Ficha y postulación ${enPortal(url, `/adoptar/${d.id}`)}.`,
    etiquetas(municipio, ["AdopciónResponsable"]),
  );
  const alternativo = `Fotografía de ${d.nombre ?? `un ${d.especie}`} en adopción${d.donde ? ` en ${d.donde}` : ""}.`;
  return { texto, alternativo };
}

// ───────────── Mascotas perdidas y avistadas ─────────────

export type DatosAviso = {
  id: string;
  especie: "PERRO" | "GATO" | "OTRA";
  sexo: "MACHO" | "HEMBRA" | "DESCONOCIDO";
  color: string;
  tamano: string | null; // «pequeño»
  localidad: string | null;
  sector: string;
  fecha: string; // «5 de octubre de 2026»
  /** Solo en perdidas: el nombre al que responde, si quien lo perdió lo indicó. */
  nombre?: string | null;
  collar?: "SI" | "NO" | "NO_SE" | null;
  colorCollar?: string | null;
  senas?: string | null;
};

/** Cómo nombrar al animal según especie y sexo: «perra», «la», «esta», «vista». */
export function generoAviso(especie: DatosAviso["especie"], sexo: DatosAviso["sexo"]) {
  const hembra = sexo === "HEMBRA";
  const sustantivo = especie === "PERRO" ? (hembra ? "perra" : "perro") : especie === "GATO" ? (hembra ? "gata" : "gato") : "animal";
  const femenino = hembra && especie !== "OTRA";
  return { sustantivo, lo: femenino ? "la" : "lo", este: femenino ? "esta" : "este", visto: femenino ? "vista" : "visto", suyo: femenino ? "suya" : "suyo" };
}

const conPunto = (t: string) => (/[.!?…]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
/** Texto libre del vecino: se omite si parece incluir un teléfono, un correo o un RUT. */
const sinDatosPersonales = (t: string | null | undefined) => (t && !/\d[\d\s.-]{6,}\d|@|\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/.test(t) ? t.trim() : null);

/**
 * Lo mismo que muestra el aviso en el portal, para reconocer al animal:
 * especie y sexo, color, tamaño, collar y señas particulares. Nunca el
 * microchip ni dónde está resguardado.
 */
export function rasgosAviso(d: DatosAviso): string[] {
  const g = generoAviso(d.especie, d.sexo);
  const senas = sinDatosPersonales(d.senas);
  return [
    `${mayuscula(g.sustantivo)} de color ${d.color}${d.tamano ? `, tamaño ${d.tamano}` : ""}.`,
    d.collar === "SI" ? `Lleva collar${d.colorCollar ? ` ${d.colorCollar}` : ""}.` : d.collar === "NO" ? "No lleva collar." : null,
    senas ? `Señas: ${conPunto(senas)}` : null,
  ].filter((x): x is string => Boolean(x));
}

/** Nombre, rasgos, dónde y cuándo se perdió. El contacto es siempre por el aviso oficial, nunca un teléfono. */
export function textoPerdida(d: DatosAviso, municipio: string, url: string | null) {
  const g = generoAviso(d.especie, d.sexo);
  const donde = d.localidad ? `${d.localidad} (sector ${d.sector})` : `el sector ${d.sector}`;
  const texto = juntar(
    d.nombre ? `Se busca a ${d.nombre}.` : `Se busca a ${g.este} ${g.sustantivo}.`,
    rasgosAviso(d).join("\n"),
    `Se perdió el ${d.fecha} en ${donde}.`,
    `Si ${g.lo} vio o tiene información, avísenos a través del aviso oficial ${enPortal(url, `/mascotas/${d.id}`)}. Por su seguridad, no publique datos personales en los comentarios.`,
    etiquetas(municipio, ["MascotaPerdida"]),
  );
  const alternativo = `Fotografía de ${d.nombre ? `${d.nombre}, ` : ""}${g.sustantivo === "animal" ? "un animal" : `${g.este === "esta" ? "una" : "un"} ${g.sustantivo}`} de color ${d.color} que se perdió en ${donde}.`;
  return { texto, alternativo };
}

/** Rasgos, dónde y cuándo se vio; no dice dónde está resguardado el animal. */
export function textoAvistada(d: DatosAviso, municipio: string, url: string | null) {
  const g = generoAviso(d.especie, d.sexo);
  const donde = d.localidad ? `${d.localidad} (sector ${d.sector})` : `el sector ${d.sector}`;
  const texto = juntar(
    `¿Reconoce a ${g.este} ${g.sustantivo}?`,
    rasgosAviso(d).join("\n"),
    `Fue ${g.visto} el ${d.fecha} en ${donde}.`,
    `Si es ${g.suyo} o ${g.lo} reconoce, revise el aviso oficial e informe una coincidencia ${enPortal(url, `/mascotas/${d.id}`)}. Para confirmar que es ${g.suyo} le pediremos datos que solo su familia conoce.`,
    etiquetas(municipio, ["MascotaAvistada"]),
  );
  const alternativo = `Fotografía de ${g.sustantivo === "animal" ? "un animal" : `${g.este === "esta" ? "una" : "un"} ${g.sustantivo}`} de color ${d.color} ${g.visto} en ${donde}.`;
  return { texto, alternativo };
}

function listar(xs: string[]) {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
