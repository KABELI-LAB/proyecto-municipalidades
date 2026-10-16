// Pawni, el quiltro guía del portal: entiende la pregunta con reglas de
// palabras clave (las mismas de Instagram, más algunas propias del portal) y
// responde con textos aprobados y el enlace que corresponde. Nunca inventa
// fechas ni cupos: el próximo operativo llega como dato desde el servidor.
import { clasificar, normalizar, type Intencion } from "./respuestas";

export type TemaPawni = Intencion | "QUE_ES" | "COSTO" | "SEGUIMIENTO" | "COMUNITARIOS" | "MAPA";

/** Ánimo del personaje al responder (cada uno es una ilustración). */
export type AnimoPawni = "reposo" | "saluda" | "feliz" | "atento";

export type AccionPawni = { texto: string; href: string };
export type RespuestaPawni = { texto: string; acciones: AccionPawni[]; animo: AnimoPawni; /** Firma para leerla con la voz del servidor. */ voz?: string };

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
  ["QUE_ES", /\b(que es|que puedo hacer|para que sirve|como funciona|quien eres|que haces|muestrame|ensename|pawni)\b/],
];

export function temaDe(texto: string): TemaPawni {
  const reglas = clasificar(texto);
  if (reglas === "SOS") return "SOS";
  const t = normalizar(texto);
  for (const [tema, patron] of PROPIAS) if (patron.test(t)) return tema;
  return reglas;
}

/** Primer mensaje de Pawni en la conversación. */
export const saludoPawni = (nombre: string) => `¡Hola! Soy ${nombre}. Te cuento todo lo que puedes hacer en el portal. ¿Qué te gustaría saber?`;

/** Lo que dice Pawni cuando algo falla (sin datos de nadie). */
export const AVISOS_PAWNI = {
  sinRespuesta: "No pude responder ahora. Inténtalo de nuevo en un momento.",
  sinPermiso: "Para hablarme, permite el micrófono en tu navegador. También puedes escribirme.",
  noEscuche: "No te escuché. Toca el micrófono y prueba de nuevo.",
  sinMicrofono: "No pude escucharte ahora. Puedes escribirme.",
} as const;

export type PasoRecorrido = { marca: string; titulo: string; texto: string; animo: AnimoPawni };

/** Pasos del recorrido guiado por el inicio (cada uno resalta su data-recorrido). */
export const PASOS_RECORRIDO: PasoRecorrido[] = [
  { marca: "operativos", titulo: "Operativos", texto: "Revisa fechas, servicios y cupos, e inscríbete en el de tu sector.", animo: "feliz" },
  { marca: "mascotas", titulo: "Mascotas perdidas y avistadas", texto: "Avisa si perdiste o viste una mascota. Te ayudamos a difundirlo.", animo: "atento" },
  { marca: "sos", titulo: "SOS Mascotas", texto: "Si ves un animal herido o en peligro, avísanos aquí.", animo: "atento" },
  { marca: "otros", titulo: "Más para hacer", texto: "Adopta, pide un servicio o conoce a los perros comunitarios.", animo: "feliz" },
  { marca: "mapa", titulo: "Tu comuna en el mapa", texto: "Mira las mascotas perdidas y avistadas por sector.", animo: "atento" },
  { marca: "solicitudes", titulo: "Mis solicitudes", texto: "Sigue el estado de tus trámites cuando quieras.", animo: "saluda" },
];

/** Cómo se lee en voz alta un paso del recorrido. */
export const vozDePaso = (p: PasoRecorrido) => `${p.titulo}. ${p.texto}`;

/** Textos fijos que Pawni puede leer en voz alta (el servidor los firma de antemano). */
export const frasesFijasPawni = (nombre: string) => [saludoPawni(nombre), ...Object.values(AVISOS_PAWNI), ...PASOS_RECORRIDO.map(vozDePaso)];

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
    case "GRACIAS":
      return { texto: "¡De nada! Aquí estoy si necesitas algo más.", acciones: [], animo: "feliz" };
    default:
      return {
        texto: "No estoy seguro de haberte entendido. Prueba con una de las preguntas de abajo o recorre el portal conmigo.",
        acciones: [{ texto: "Recorrer el portal", href: RECORRIDO }],
        animo: "atento",
      };
  }
}
