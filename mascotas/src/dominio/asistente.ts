// Pawni, el quiltro guía del portal: entiende la pregunta (con inteligencia
// artificial si está encendida; si no, o si falla, con reglas de palabras
// clave) y responde con textos aprobados y el enlace que corresponde. Nunca
// inventa fechas ni cupos: el próximo operativo llega como dato del servidor.
import { clasificar, normalizar, type Intencion } from "./respuestas";

export type TemaPawni = Intencion | "QUE_ES" | "SALUDO" | "COSTO" | "SEGUIMIENTO" | "COMUNITARIOS" | "MAPA" | "AVISOS" | "SALUD";

/** Cada tema explicado, para que la inteligencia artificial elija uno. */
export const TEMAS_PAWNI: Record<TemaPawni, string> = {
  QUE_ES: "pregunta por Pawni o por el portal: quién eres, cómo te llamas, qué se puede hacer aquí",
  SALUDO: "solo saluda",
  GRACIAS: "agradece, felicita o se despide",
  OPERATIVO: "fechas, horarios, lugar, cupos o inscripción de operativos",
  SERVICIO: "vacunas, microchip, esterilización o cómo pedir un servicio",
  COSTO: "precios o si algo se paga",
  PERDI: "perdió su mascota o quiere buscarla",
  VISTO: "vio o encontró un animal que parece perdido",
  ES_MIO: "dice que un animal de un aviso es suyo",
  AVISOS: "quiere ver cuántas o cuáles mascotas perdidas o avistadas hay",
  SOS: "un animal en la calle o ajeno que está herido, maltratado, abandonado, atropellado, atrapado, agresivo, en jauría o en peligro",
  SALUD: "su propia mascota está enferma, no come o tiene un problema de salud",
  ADOPTAR: "adoptar o dar en adopción",
  SEGUIMIENTO: "estado de sus solicitudes o trámites",
  COMUNITARIOS: "perros comunitarios del barrio",
  MAPA: "el mapa de la comuna",
  OTRO: "nada de lo anterior, o consultas ajenas al cuidado de mascotas (horarios de la municipalidad, otros trámites, bromas)",
};

/** Ánimo del personaje al responder (cada uno es una ilustración). */
export type AnimoPawni = "reposo" | "saluda" | "feliz" | "atento";

export type AccionPawni = { texto: string; href: string };
export type RespuestaPawni = { texto: string; acciones: AccionPawni[]; animo: AnimoPawni };

/** Enlace especial: inicia el recorrido guiado por el inicio. */
export const RECORRIDO = "#recorrido";

/** Preguntas sugeridas en el panel de conversación. */
export const SUGERENCIAS = [
  "¿Qué puedo hacer aquí?",
  "¿Cuándo es el próximo operativo?",
  "Perdí a mi mascota",
  "Vi un animal herido",
  "Quiero adoptar",
  "¿Cuesta algo?",
];

// Temas propios del portal, después de SOS y antes de las reglas de Instagram.
const PROPIAS: [TemaPawni, RegExp][] = [
  ["SEGUIMIENTO", /\b(mis solicitudes|mi solicitud|mi tramite|mis tramites|estado de mi|seguimiento)\b/],
  ["COSTO", /\b(cuesta|cuestan|cuanto vale|precio|valor|gratis|gratuit\w*|cobran?|pagar|pago)\b/],
  ["COMUNITARIOS", /\bcomunitari\w*/],
  ["MAPA", /\bmapa\b/],
  // Preguntar por las mascotas perdidas no es haber perdido una.
  ["AVISOS", /\b(cuant[ao]s|hay|ver|veo|lista|donde estan)\b.*\b(perdid|extraviad|avistad)/],
  ["QUE_ES", /\b(tu nombre|como te llamas|quien eres|que eres|que es pawni|que es este portal|para que sirve|como funciona)\b/],
  ["SALUDO", /^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|wena|alo|hey)\b/],
  ["SALUD", /\b(mi (perr|gat|mascota)\w*).*\b(no come|enferm\w*|vomit\w*|diarrea|fiebre|cojea|decaid\w*)/],
];

// Pregunta general: solo si no habla de nada más concreto.
const GENERAL = /\b(que puedo hacer|que haces|muestrame|ensename|ayuda|ayudame|pawni)\b/;

export function temaDe(texto: string): TemaPawni {
  const reglas = clasificar(texto);
  if (reglas === "SOS") return "SOS";
  const t = normalizar(texto);
  for (const [tema, patron] of PROPIAS) if (patron.test(t)) return tema;
  if (reglas !== "OTRO") return reglas;
  return GENERAL.test(t) ? "QUE_ES" : "OTRO";
}

/** Datos del próximo operativo publicado, ya formateados en el servidor. */
export type OperativoPawni = { id: string; cuando: string; donde: string; abierto: boolean; conCupos: string[] } | null;

const lista = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);

export function responderPawni(tema: TemaPawni, operativo: OperativoPawni, nombre: string): RespuestaPawni {
  switch (tema) {
    case "QUE_ES":
      return {
        texto: `Soy ${nombre}, el quiltro guía del portal. Aquí te inscribes en operativos, avisas si perdiste o viste una mascota, pides ayuda por SOS y adoptas.`,
        acciones: [
          { texto: "Recorrer el portal", href: RECORRIDO },
          { texto: "Ver operativos", href: "/operativos" },
        ],
        animo: "feliz",
      };
    case "OPERATIVO": {
      if (!operativo)
        return {
          texto: "Por ahora no hay operativos publicados. Pide el servicio y te avisamos cuando haya uno en tu sector.",
          acciones: [{ texto: "Solicitar un servicio", href: "/servicio" }],
          animo: "atento",
        };
      const cupos = !operativo.abierto
        ? "Las inscripciones ya cerraron."
        : operativo.conCupos.length
          ? `Quedan cupos para ${lista(operativo.conCupos).toLowerCase()}.`
          : "Ya no quedan cupos.";
      return {
        texto: `El próximo operativo es el ${operativo.cuando}, en ${operativo.donde}. ${cupos}`,
        acciones: [
          { texto: "Ver el operativo", href: `/operativos/${operativo.id}` },
          { texto: "Ver todos los operativos", href: "/operativos" },
        ],
        animo: "feliz",
      };
    }
    case "SERVICIO":
      return {
        texto: "Las vacunas, el microchip y la esterilización se hacen en los operativos. Si no hay uno en tu sector, pídelo y te avisamos.",
        acciones: [
          { texto: "Ver operativos", href: "/operativos" },
          { texto: "Solicitar un servicio", href: "/servicio" },
        ],
        animo: "feliz",
      };
    case "COSTO":
      return {
        texto: "Cada operativo indica sus servicios, requisitos y condiciones. Revísalo antes de inscribirte.",
        acciones: [{ texto: "Ver operativos", href: "/operativos" }],
        animo: "atento",
      };
    case "PERDI":
      return {
        texto: "Lo siento mucho. Publica un aviso con foto y te ayudamos a difundirlo. Revisa también las mascotas avistadas.",
        acciones: [
          { texto: "Publicar aviso", href: "/mascotas/publicar?tipo=PERDIDA" },
          { texto: "Ver mascotas avistadas", href: "/mascotas" },
        ],
        animo: "atento",
      };
    case "VISTO":
      return {
        texto: "Gracias por ayudar. Revisa si alguien la está buscando o publica que la viste.",
        acciones: [
          { texto: "Ver mascotas perdidas", href: "/mascotas" },
          { texto: "Publicar que la vi", href: "/mascotas/publicar?tipo=ENCONTRADA" },
        ],
        animo: "feliz",
      };
    case "ES_MIO":
      return {
        texto: "Si viste a tu mascota en un aviso, entra al aviso e informa la coincidencia. Te pediremos datos que solo tu familia conoce.",
        acciones: [{ texto: "Ver avisos de mascotas", href: "/mascotas" }],
        animo: "atento",
      };
    case "SOS":
      return {
        texto: "Si un animal está herido o en peligro, avísanos por SOS Mascotas. Lo revisa el equipo municipal. Si hay riesgo para personas, llama a emergencias.",
        acciones: [{ texto: "Pedir ayuda", href: "/reportar" }],
        animo: "atento",
      };
    case "ADOPTAR":
      return {
        texto: "Estos animales buscan un hogar. También puedes dar en adopción a uno que no puedas cuidar.",
        acciones: [
          { texto: "Ver adopciones", href: "/adoptar" },
          { texto: "Dar en adopción", href: "/adoptar/dar" },
        ],
        animo: "feliz",
      };
    case "SEGUIMIENTO":
      return {
        texto: "En Mis solicitudes ves el estado de tus trámites. Entras con tu RUT y un código, sin registrarte.",
        acciones: [{ texto: "Ir a Mis solicitudes", href: "/mis-solicitudes" }],
        animo: "feliz",
      };
    case "COMUNITARIOS":
      return {
        texto: "Los perros comunitarios viven en el barrio y los cuidan vecinas y vecinos. Conócelos y ayuda a cuidarlos.",
        acciones: [{ texto: "Ver perros comunitarios", href: "/comunitarios" }],
        animo: "feliz",
      };
    case "MAPA":
      return {
        texto: "En el mapa ves las mascotas perdidas y avistadas por sector, y dónde viven los perros comunitarios.",
        acciones: [{ texto: "Ver el mapa", href: "/mapa" }],
        animo: "feliz",
      };
    case "SALUDO":
      return {
        texto: `¡Hola! Soy ${nombre}. ¿En qué te ayudo? Pregúntame por operativos, mascotas perdidas, SOS o adopción.`,
        acciones: [{ texto: "Recorrer el portal", href: RECORRIDO }],
        animo: "saluda",
      };
    case "SALUD":
      return {
        texto: "Si tu mascota está enferma, llévala a un veterinario lo antes posible. Para vacunas y esterilización, revisa los operativos.",
        acciones: [{ texto: "Ver operativos", href: "/operativos" }],
        animo: "atento",
      };
    case "AVISOS":
      return {
        texto: "Las mascotas perdidas y avistadas están en el portal, con foto. En el mapa las ves por sector.",
        acciones: [
          { texto: "Ver mascotas perdidas", href: "/mascotas" },
          { texto: "Ver el mapa", href: "/mapa" },
        ],
        animo: "atento",
      };
    case "GRACIAS":
      return { texto: "¡De nada! Aquí estoy si necesitas algo más.", acciones: [], animo: "feliz" };
    default:
      return {
        texto: "Eso no lo sé responder. Te ayudo con operativos, mascotas perdidas, SOS y adopción. Para otras consultas, contacta a la municipalidad.",
        acciones: [{ texto: "Recorrer el portal", href: RECORRIDO }],
        animo: "atento",
      };
  }
}
