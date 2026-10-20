// Textos para el ciudadano de cada valor guardado. Los estados llevan además
// un «tono» que la interfaz traduce a color + ícono (nunca solo color).

export type Tono = "recibido" | "informacion" | "espera" | "confirmado" | "finalizado" | "cerrado";
export type Estado = { texto: string; tono: Tono };

export const ESPECIE: Record<string, string> = { PERRO: "Perro", GATO: "Gato", OTRA: "Otra especie" };
export const SEXO: Record<string, string> = { MACHO: "Macho", HEMBRA: "Hembra", DESCONOCIDO: "No se sabe" };
export const TAMANO: Record<string, string> = { PEQUENO: "Pequeño", MEDIANO: "Mediano", GRANDE: "Grande" };
/** «Avistada»: alguien vio una mascota que podría estar perdida (tipo interno ENCONTRADA; puede tenerla resguardada o solo haberla visto). */
export const TIPO_PUBLICACION: Record<string, string> = { PERDIDA: "Perdida", ENCONTRADA: "Avistada" };
export const TIPO_AVISO: Record<string, string> = {
  OPERATIVO: "Operativo",
  CAMBIO: "Cambio o cancelación",
  CAMPANA: "Campaña",
  ALERTA: "Alerta",
  INFORMACION: "Información general",
};

export const ESTADO_SOLICITUD: Record<string, Estado> = {
  RECIBIDA: { texto: "Recibida", tono: "recibido" },
  INVITADO: { texto: "Invitado a operativo", tono: "informacion" },
  CUPO_CONFIRMADO: { texto: "Cupo confirmado", tono: "confirmado" },
  EN_LISTA_ESPERA: { texto: "En lista de espera", tono: "espera" },
  ATENDIDA: { texto: "Atendida", tono: "finalizado" },
  NO_ASISTIO: { texto: "No asistió", tono: "cerrado" },
  CANCELADA_PERSONA: { texto: "Cancelada por la persona", tono: "cerrado" },
  CANCELADA_MUNICIPIO: { texto: "Cancelada por el municipio", tono: "cerrado" },
};

export const ESTADO_CUPO: Record<string, Estado> = {
  INVITADO: { texto: "Invitado a operativo", tono: "informacion" },
  CONFIRMADO: { texto: "Cupo confirmado", tono: "confirmado" },
  EN_LISTA_ESPERA: { texto: "En lista de espera", tono: "espera" },
  ASISTIO: { texto: "Asistió", tono: "finalizado" },
  NO_ASISTIO: { texto: "No asistió", tono: "cerrado" },
  CANCELADO_PERSONA: { texto: "Cancelado por la persona", tono: "cerrado" },
  CANCELADO_MUNICIPIO: { texto: "Cancelado por el municipio", tono: "cerrado" },
};

// «Recibido» no significa atendido: el reporte aún no se revisa. «Cerrado»
// significa que el equipo lo revisó y lo cerró, no que el animal fue atendido.
export const ESTADO_REPORTE: Record<string, Estado> = {
  ABIERTO: { texto: "Recibido", tono: "recibido" },
  EN_REVISION: { texto: "En revisión", tono: "informacion" },
  CERRADO: { texto: "Cerrado", tono: "finalizado" },
};

export const ESTADO_PUBLICACION: Record<string, Estado> = {
  ABIERTA: { texto: "Vigente", tono: "informacion" },
  REENCONTRADA: { texto: "Reencontrada", tono: "finalizado" },
  YA_NO_APLICA: { texto: "Ya no aplica", tono: "cerrado" },
  ARCHIVADA: { texto: "Archivada", tono: "cerrado" },
};

export const ESTADO_POSTULACION: Record<string, Estado> = {
  RECIBIDA: { texto: "Recibida", tono: "recibido" },
  EN_EVALUACION: { texto: "En evaluación", tono: "informacion" },
  APROBADA: { texto: "Aprobada", tono: "confirmado" },
  NO_SELECCIONADA: { texto: "No seleccionada", tono: "cerrado" },
};

export const ESTADO_ADOPCION: Record<string, Estado> = {
  DISPONIBLE: { texto: "Disponible", tono: "confirmado" },
  EN_PROCESO: { texto: "En proceso de adopción", tono: "espera" },
  ADOPTADO: { texto: "Adoptado", tono: "finalizado" },
};

/** Revisión de una propuesta de «Dar en adopción», como la ve quien la envió. */
export const REVISION_ADOPCION: Record<string, Estado> = {
  PENDIENTE: { texto: "En revisión", tono: "recibido" },
  CORRECCIONES: { texto: "Requiere correcciones", tono: "espera" },
  APROBADA: { texto: "Publicada", tono: "confirmado" },
  RECHAZADA: { texto: "No publicada", tono: "cerrado" },
  OCULTA: { texto: "Retirada por el municipio", tono: "cerrado" },
  RETIRADA: { texto: "Retirada", tono: "cerrado" },
};

/** Relación de quien propone con el animal. */
export const RELACION_ANIMAL: Record<string, string> = {
  PROPIO: "Es mi animal",
  RESCATADO: "Lo rescaté o lo encontré",
  HOGAR_TEMPORAL: "Le doy hogar temporal",
  COMUNITARIO: "Lo cuido en la comunidad",
  OTRA: "Otra relación",
};

/** Rangos de edad que se ofrecen en los formularios y su valor aproximado en meses. */
// Los cortes coinciden con lo que importa en un operativo: antes de los 4 meses
// en general no se esteriliza, y los adultos mayores pueden requerir evaluación.
export const EDADES = [
  { valor: "2", texto: "Menos de 4 meses" },
  { valor: "8", texto: "Entre 4 meses y 1 año" },
  { valor: "36", texto: "Entre 1 y 7 años" },
  { valor: "108", texto: "Más de 7 años" },
] as const;

/** Especies que atienden los operativos (vacuna antirrábica, microchip y esterilización). */
export const ESPECIE_ATENDIDA: Record<string, string> = { PERRO: "Perro", GATO: "Gato" };

export const MODERACION: Record<string, Estado> = {
  PENDIENTE: { texto: "Por aceptar", tono: "espera" },
  APROBADA: { texto: "Publicada", tono: "confirmado" },
  OCULTA: { texto: "Oculta", tono: "cerrado" },
};

export const ESTADO_COINCIDENCIA: Record<string, Estado> = {
  SUGERIDA: { texto: "Por validar", tono: "espera" },
  VALIDADA: { texto: "Validada", tono: "confirmado" },
  DESCARTADA: { texto: "Descartada", tono: "cerrado" },
};

export const CANTIDAD_ANIMALES: Record<string, string> = {
  UNO: "Uno",
  DOS_A_CINCO: "Entre 2 y 5",
  MAS_DE_CINCO: "Más de 5",
};

/** Texto libre como oración: mayúscula inicial y punto final si no termina en puntuación. */
export function oracion(texto: string): string {
  const t = texto.trim();
  if (!t) return t;
  const conMayuscula = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(conMayuscula) ? conMayuscula : `${conMayuscula}.`;
}

export function textoEdad(meses: number | null | undefined): string {
  if (meses == null) return "Edad no informada";
  if (meses < 4) return "Menos de 4 meses";
  if (meses < 12) return "Menos de 1 año";
  const anos = Math.round(meses / 12);
  return anos === 1 ? "1 año aprox." : `${anos} años aprox.`;
}

/** Colores principales que se ofrecen al publicar una mascota (lista cerrada para comparar). */
export const SI_NO_SE: Record<string, string> = { SI: "Sí", NO: "No", NO_SE: "No sé" };

export const ESTADO_OPERATIVO: Record<string, Estado> = {
  BORRADOR: { texto: "Borrador", tono: "recibido" },
  PUBLICADO: { texto: "Inscripciones abiertas", tono: "confirmado" },
  INSCRIPCIONES_CERRADAS: { texto: "Inscripciones cerradas", tono: "informacion" },
  EN_CURSO: { texto: "En curso", tono: "espera" },
  CERRADO: { texto: "Cerrado", tono: "finalizado" },
  CANCELADO: { texto: "Cancelado", tono: "cerrado" },
};

export const ORIGEN_OPERATIVO: Record<string, string> = {
  RECOMENDACION: "Recomendación de prioridad",
  FICHA_SECTOR: "Ficha del sector",
  DESDE_CERO: "Creado desde cero",
};

/**
 * Dónde está una mascota avistada: con quien informa, retenida en otro lugar
 * (con la localidad y su sector, y qué lugar es) o solo vista. Nunca una dirección.
 */
export function textoResguardo(p: {
  resguardada: boolean | null;
  resguardo?: string | null;
  resguardoDetalle?: string | null;
  resguardoLocalidad?: { nombre: string; sector: { nombre: string } } | null;
}): string | null {
  if (p.resguardada === null) return null;
  if (!p.resguardada) return "No, solo fue vista";
  const donde = p.resguardoLocalidad ? `, en ${p.resguardoLocalidad.nombre} (sector ${p.resguardoLocalidad.sector.nombre})` : "";
  if (p.resguardo === "OTRO_LUGAR") return `Sí, está retenida en otro lugar${donde}${p.resguardoDetalle ? `: ${p.resguardoDetalle}` : ""}`;
  return `Sí, la tiene la persona que la vio${donde}${p.resguardoDetalle ? `: ${p.resguardoDetalle}` : ""}`;
}

/**
 * Tipo de aviso concordado con el sexo del animal: «Perdido» o «Perdida»,
 * «Avistado» o «Avistada». Si no se sabe el sexo, en femenino (por «mascota»).
 */
export function tipoAviso(tipo: string, sexo: string | null): string {
  const base = TIPO_PUBLICACION[tipo] ?? tipo;
  return sexo === "MACHO" ? base.replace(/a$/, "o") : base;
}

/** «Perra», «Gato», «Otra especie»: la especie con el sexo, si se conoce. */
export function especieConSexo(especie: string, sexo: string | null): string {
  const hembra = sexo === "HEMBRA";
  if (especie === "PERRO") return hembra ? "Perra" : "Perro";
  if (especie === "GATO") return hembra ? "Gata" : "Gato";
  return ESPECIE[especie] ?? "Animal";
}

/** Nombre de la mascota con mayúscula inicial («pelusa» → «Pelusa»). */
export const nombreMascota = (nombre: string) => nombre.trim().charAt(0).toUpperCase() + nombre.trim().slice(1);

/**
 * Título de un aviso de mascota: su nombre, si quien la perdió lo indicó; si
 * no, la especie y el color («Perra café»).
 */
export function tituloAviso(p: { nombreAnimal: string | null; especie: string; sexo: string | null; colorPrincipal: string }): string {
  return p.nombreAnimal?.trim() ? nombreMascota(p.nombreAnimal) : `${especieConSexo(p.especie, p.sexo)} ${p.colorPrincipal}`;
}

export const RESULTADO_ATENCION: Record<string, string> = {
  REALIZADA: "Realizada",
  NO_REALIZADA: "No realizada",
  DERIVADA: "Derivada",
};
