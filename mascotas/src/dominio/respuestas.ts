// Respuestas automáticas en Instagram: reglas puras por palabras clave, sin
// inteligencia artificial ni servicios externos. Cada comentario o mensaje se
// clasifica en una intención y se responde con el enlace del portal que
// corresponde. En un comentario sabemos de qué publicación habla (un
// operativo, un aviso o una adopción), así que el enlace es exacto.
// Nunca se piden ni se repiten datos personales: el contacto pasa por el portal.
import type { TipoRed } from "./redes";

export type Intencion = "SOS" | "VISTO" | "ES_MIO" | "PERDI" | "OPERATIVO" | "SERVICIO" | "ADOPTAR" | "GRACIAS" | "OTRO";

/** Etiqueta para el panel. */
export const INTENCION: Record<Intencion, string> = {
  SOS: "Animal en peligro",
  VISTO: "Dice que lo vio",
  ES_MIO: "Dice que es suyo",
  PERDI: "Perdió su mascota",
  OPERATIVO: "Pregunta por operativos",
  SERVICIO: "Pregunta por servicios",
  ADOPTAR: "Quiere adoptar",
  GRACIAS: "Saludo o agradecimiento",
  OTRO: "Otra consulta",
};

/** Minúsculas, sin tildes ni signos: «¿Lo VÍ?» → «lo vi». */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// En orden de prioridad: un animal en peligro va primero.
const REGLAS: [Intencion, RegExp][] = [
  ["SOS", /\b(herid|atropell|maltrat|envenen|sangr|agoniz|abandon|emergencia|urgente|se esta muriendo|golpead|peligro|jauri|agresiv|mordi|atrapad)/],
  ["ES_MIO", /\b(es mio|es mia|es mi (perr|gat|mascota)|es el mio|es la mia|es de mi (casa|familia)|es nuestr)/],
  ["VISTO", /\b(vi|vimos|lo vi|la vi|los vi|las vi|lo he visto|la he visto|lo hemos visto|visto|vista|anda por|andaba|esta en|estaba en|lo tengo|la tengo|lo encontre|la encontre|aparecio|lo veo|la veo|pasa por|pasea por)\b/],
  ["PERDI", /\b(perdi|se me perdio|se perdio|se escapo|se me escapo|extravi|busco a mi|no encuentro a mi|se arranco|se me arranco|se fue de la casa)/],
  ["ADOPTAR", /\b(adopt|adopcion|darle (un )?hogar|lo quiero|la quiero|me lo llevo|me la llevo)/],
  ["SERVICIO", /\b(vacun|esteriliz|castra|chip|antirrabic|desparasit|servicio)/],
  ["OPERATIVO", /\b(operativo|cupo|inscrib|inscripcion|horario|a que hora|que hora|cuando es|cuando son|donde es|donde sera|requisito|ayuno)/],
  ["GRACIAS", /^(gracias|muchas gracias|que lindo|que linda|hermos[oa]|bello|bella|bkn|bacan|excelente|buena iniciativa|felicitaciones|hola|buenas|buenos dias|buenas tardes|buenas noches)\b/],
];

export function clasificar(texto: string): Intencion {
  const t = normalizar(texto);
  // Solo emojis o signos (el texto queda vacío): se toma como apoyo.
  if (!t) return "GRACIAS";
  for (const [intencion, patron] of REGLAS) if (patron.test(t)) return intencion;
  return "OTRO";
}

/**
 * Enlace a un contenido del portal escrito en el texto de una publicación
 * («…/mascotas/<id>», «…/operativos/<id>», «…/adoptar/<id>»), con o sin dominio.
 */
export function enlaceEnTexto(texto: string): { seccion: "mascotas" | "operativos" | "adoptar"; id: string } | null {
  const m = texto.match(/\/(mascotas|operativos|adoptar)\/([a-z0-9][a-z0-9_-]{2,})/i);
  return m ? { seccion: m[1].toLowerCase() as "mascotas" | "operativos" | "adoptar", id: m[2] } : null;
}

/** La publicación de Instagram que comentaron (si es nuestra), con su enlace en el portal. */
export type Contexto = { tipo: TipoRed; url: string } | null;

export type Enlaces = {
  portal: string;
  operativos: string;
  servicio: string;
  mascotas: string;
  perdi: string;
  vi: string;
  adoptar: string;
  sos: string;
};

export const enlacesDe = (base: string): Enlaces => ({
  portal: base,
  operativos: `${base}/operativos`,
  servicio: `${base}/servicio`,
  mascotas: `${base}/mascotas`,
  perdi: `${base}/mascotas/publicar?tipo=PERDIDA`,
  vi: `${base}/mascotas/publicar?tipo=ENCONTRADA`,
  adoptar: `${base}/adoptar`,
  sos: `${base}/reportar`,
});

const SOS = (e: Enlaces) =>
  `Si un animal está herido o en peligro, avísanos en SOS Mascotas: ${e.sos} . Lo revisa el equipo municipal. Si hay riesgo para personas, llama a los servicios de emergencia.`;

/** Mensaje privado: qué hacer y el enlace exacto. Frases cortas, trato de tú, sin emoji. */
export function mensajePrivado(intencion: Intencion, contexto: Contexto, e: Enlaces): string | null {
  if (intencion === "SOS") return SOS(e);
  if (contexto) {
    const { tipo, url } = contexto;
    if (tipo === "PERDIDA") {
      if (intencion === "VISTO" || intencion === "OTRO" || intencion === "ES_MIO")
        return `Gracias por ayudar. Si lo viste o tienes información, entra al aviso y pulsa «Informar que la vi»: ${url} . Así le llega a la familia sin publicar datos personales.`;
    }
    if (tipo === "AVISTADA") {
      if (intencion === "ES_MIO" || intencion === "PERDI")
        return `Si crees que es tuyo, entra al aviso e informa la coincidencia: ${url} . Te pediremos datos que solo tu familia conoce para confirmarlo.`;
      if (intencion === "VISTO" || intencion === "OTRO") return `Gracias por ayudar. Revisa el aviso y avísanos por ahí si tienes información: ${url}`;
    }
    if (tipo === "ADOPCION" && (intencion === "ADOPTAR" || intencion === "OTRO"))
      return `Revisa su ficha y postula en el portal: ${url} . La persona que lo da en adopción revisa las postulaciones.`;
    if (tipo === "OPERATIVO" && (intencion === "OPERATIVO" || intencion === "SERVICIO" || intencion === "OTRO"))
      return `En la página del operativo están la fecha, el horario, el lugar, los requisitos y los cupos. Inscríbete ahí: ${url}`;
  }
  switch (intencion) {
    case "OPERATIVO":
      return `Los próximos operativos, con fechas, cupos e inscripción, están aquí: ${e.operativos}`;
    case "SERVICIO":
      return `Puedes inscribirte en un operativo (${e.operativos}) o pedir el servicio para cuando haya uno en tu sector: ${e.servicio}`;
    case "PERDI":
      return `Lamentamos que se haya perdido. Publica el aviso aquí y lo difundimos: ${e.perdi} . También revisa las mascotas avistadas: ${e.mascotas}`;
    case "VISTO":
    case "ES_MIO":
      return `Gracias por avisar. Revisa los avisos de mascotas perdidas (${e.mascotas}) o publica que la viste: ${e.vi}`;
    case "ADOPTAR":
      return `Los animales en adopción están aquí: ${e.adoptar}`;
    case "GRACIAS":
      return null;
    default:
      return `Gracias por escribirnos. En el portal puedes ver operativos, mascotas perdidas y adopción, y pedir ayuda para un animal: ${e.portal} . El equipo municipal también revisará tu mensaje.`;
  }
}

/** Respuesta pública al comentario: breve y sin enlaces ni datos; el detalle va por privado. */
export function respuestaPublica(intencion: Intencion, conPrivado: boolean): string {
  if (!conPrivado) return "Gracias por tu apoyo.";
  if (intencion === "SOS") return "Gracias por avisar. Te escribimos por mensaje privado para que lo reportes.";
  return "Gracias por comentar. Te enviamos la información por mensaje privado.";
}
