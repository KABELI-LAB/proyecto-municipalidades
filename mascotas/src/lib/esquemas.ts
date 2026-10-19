// Validación de los trámites ciudadanos. Se usa en el navegador (paso a paso)
// y de nuevo en el servidor antes de guardar. Mensajes en trato de tú.
import { z } from "zod";
import { EDADES } from "@/dominio/etiquetas";
import { FORMATO_CODIGO } from "@/dominio/codigo";
import { MESES_MAXIMOS } from "@/dominio/propuestas";
import { normalizarRut } from "@/dominio/rut";

const texto = (min: number, max: number, mensaje: string) =>
  z.string().trim().min(min, mensaje).max(max, `Usa como máximo ${max} caracteres.`);
const eleccion = (mensaje: string) => z.string().min(1, mensaje);
const opcional = (max: number) => z.string().trim().max(max, `Usa como máximo ${max} caracteres.`);

const ESPECIES = ["PERRO", "GATO", "OTRA"] as const;
const SEXOS = ["MACHO", "HEMBRA", "DESCONOCIDO"] as const;
const TAMANOS = ["PEQUENO", "MEDIANO", "GRANDE"] as const;

export const telefonoValido = (v: string) => /^\+?\d{8,12}$/.test(v.replace(/[\s-]/g, ""));
export const correoValido = (v: string) => z.email().safeParse(v).success;

/** Mismos valores que demo/datos/postulaciones.json. */
export const TIPOS_VIVIENDA = ["casa con patio", "casa sin patio", "departamento", "parcela"] as const;

// ── Datos de la persona ──
const persona = {
  nombre: texto(3, 100, "Indica tu nombre y apellido."),
  rut: z.string().trim().refine((v) => normalizarRut(v) !== null, "Revisa el RUT: el dígito verificador no coincide."),
  telefono: opcional(20),
  correo: opcional(120),
  // Lista cerrada: de la localidad se deduce el sector (docs/concepto.md, sección 6).
  localidadId: eleccion("Elige tu localidad de la lista."),
};

/**
 * RUT opcional: vacío o válido. Se usa donde el RUT no hace falta (SOS,
 * avistamiento, novedad de perro comunitario) o es voluntario (solicitar un
 * servicio). Sin RUT, el trámite no aparece en Mis solicitudes.
 */
const rutOpcional = z
  .string()
  .trim()
  .default("")
  .refine((v) => v === "" || normalizarRut(v) !== null, "Revisa el RUT: el dígito verificador no coincide.");
/** Mismos datos de la persona, con RUT opcional. */
const personaSinRut = { ...persona, rut: rutOpcional };

// Las reglas que cruzan campos se evalúan aunque otros campos tengan errores,
// para mostrar todos los errores de un paso de una sola vez.
const SIEMPRE = { when: () => true };

/**
 * Correo obligatorio (teléfono opcional): con el correo se avisa del trámite y
 * se entra a Mis solicitudes. Para los trámites con seguimiento.
 */
function contactoConCorreo(d: { telefono: string; correo: string }, ctx: z.RefinementCtx) {
  if (!d.correo) {
    ctx.addIssue({ code: "custom", path: ["correo"], message: "Escribe tu correo: ahí te avisamos y con él entras a Mis solicitudes." });
  } else if (!correoValido(d.correo)) {
    ctx.addIssue({ code: "custom", path: ["correo"], message: "Revisa el correo; por ejemplo, nombre@correo.cl." });
  }
  if (d.telefono && !telefonoValido(d.telefono)) {
    ctx.addIssue({ code: "custom", path: ["telefono"], message: "Escribe el teléfono con 9 dígitos, por ejemplo 9 1234 5678." });
  }
}

/** Teléfono o correo: al menos uno, y bien escrito (SOS, novedades y mensajes, sin seguimiento obligatorio). */
function contacto(d: { telefono: string; correo: string }, ctx: z.RefinementCtx) {
  if (!d.telefono && !d.correo) {
    ctx.addIssue({ code: "custom", path: ["telefono"], message: "Indica un teléfono o un correo para avisarte." });
  }
  if (d.telefono && !telefonoValido(d.telefono)) {
    ctx.addIssue({ code: "custom", path: ["telefono"], message: "Escribe el teléfono con 9 dígitos, por ejemplo 9 1234 5678." });
  }
  if (d.correo && !correoValido(d.correo)) {
    ctx.addIssue({ code: "custom", path: ["correo"], message: "Revisa el correo; por ejemplo, nombre@correo.cl." });
  }
}

// ── Datos del animal (servicios y cupos) ──
// Los operativos atienden perros y gatos. El tamaño solo se pregunta para perros:
// en gatos casi no varía y no cambia la atención.
const animal = {
  especie: z.enum(["PERRO", "GATO"], "Indica si es perro o gato."),
  nombreAnimal: opcional(40),
  sexo: z.enum(SEXOS, "Indica el sexo o elige «No sé»."),
  tamano: z.enum([...TAMANOS, ""]),
  edad: z.enum(EDADES.map((e) => e.valor) as [string, ...string[]], "Indica la edad aproximada."),
};

function tamanoDePerro(d: { especie: string; tamano: string }, ctx: z.RefinementCtx) {
  if (d.especie === "PERRO" && !d.tamano) {
    ctx.addIssue({ code: "custom", path: ["tamano"], message: "Indica el tamaño del perro." });
  }
}

export const esquemaServicio = z
  .object({ servicioId: eleccion("Elige el servicio que necesitas."), ...animal, ...personaSinRut })
  .superRefine(contactoConCorreo, SIEMPRE)
  .superRefine(tamanoDePerro, SIEMPRE);

export const esquemaCupo = z
  .object({ operativoId: z.string().min(1), servicioId: eleccion("Elige un servicio."), ...animal, ...persona })
  .superRefine(contactoConCorreo, SIEMPRE)
  .superRefine(tamanoDePerro, SIEMPRE);

export const esquemaReporte = z
  .object({
    tipo: eleccion("Elige qué situación quieres informar."), // clave del catálogo de tipos de reporte
    especie: z.enum([...ESPECIES, ""]),
    cantidad: z.enum(["UNO", "DOS_A_CINCO", "MAS_DE_CINCO"], "Indica cuántos animales hay."),
    sigueEnLugar: z.enum(["SI", "NO", "NO_SE", ""]),
    descripcion: texto(15, 600, "Describe la situación en al menos 15 caracteres."),
    ...personaSinRut,
  })
  .superRefine(contacto, SIEMPRE)
  .superRefine((d, ctx) => {
    if (PREGUNTA_SI_SIGUE.includes(d.tipo) && !d.sigueEnLugar) {
      ctx.addIssue({ code: "custom", path: ["sigueEnLugar"], message: "Indica si el animal sigue en el lugar o elige «No sé»." });
    }
  }, SIEMPRE);

/** Tipos de reporte en que se pregunta si el animal sigue en el lugar. */
export const PREGUNTA_SI_SIGUE: readonly string[] = ["animal herido", "maltrato o abandono", "animal agresivo", "animal atrapado", "abandono", "atropello"];

export const esquemaPublicacion = z
  .object({
    tipo: z.enum(["PERDIDA", "ENCONTRADA"], "Indica si perdiste o encontraste una mascota."),
    especie: z.enum(ESPECIES, "Indica la especie."),
    // Perros y gatos: del catálogo de colores (se revisa en el servidor). Otras especies: texto libre.
    colorPrincipal: texto(3, 40, "Indica el color principal."),
    tamano: z.enum(TAMANOS, "Indica el tamaño."),
    sexo: z.enum(SEXOS, "Indica el sexo o elige «No se sabe»."),
    nombreAnimal: opcional(40),
    collar: z.enum(["SI", "NO", "NO_SE"], "Indica si llevaba collar o elige «No sé»."),
    colorCollar: opcional(40),
    microchip: z.enum(["SI", "NO", "NO_SE", ""]),
    senas: opcional(300),
    fechaEvento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indica la fecha."),
    /** «si»: con quien informa; «lugar»: retenida en otro lugar; «no»: solo la vio. */
    resguardada: z.enum(["si", "lugar", "no", ""]),
    /** Localidad donde está resguardada (se muestra con su sector). */
    resguardoLocalidadId: z.string().trim().default(""),
    /** Qué lugar es, sin dirección ni teléfono («en una veterinaria del centro»). */
    resguardoDetalle: opcional(120).default("").refine((t) => !/\d[\d\s.-]{6,}\d/.test(t), "No escribas teléfonos: el contacto es a través de la plataforma."),
    /** Avistamiento: aviso de pérdida al que quien la vio lo vincula (posible coincidencia, sin certeza). */
    vinculo: z.string().trim().default(""),
    // Obligatorio solo al reportar una pérdida: con él, el dueño gestiona su aviso en Mis solicitudes.
    ...personaSinRut,
  })
  .superRefine(contactoConCorreo, SIEMPRE)
  .superRefine((d, ctx) => {
    if (d.tipo === "PERDIDA" && !d.rut) {
      ctx.addIssue({ code: "custom", path: ["rut"], message: "Indica tu RUT: con él podrás revisar y cerrar tu aviso." });
    }
    if (d.tipo === "ENCONTRADA" && !d.resguardada) {
      ctx.addIssue({ code: "custom", path: ["resguardada"], message: "Indica si el animal está resguardado." });
    }
    if (d.tipo === "ENCONTRADA" && (d.resguardada === "si" || d.resguardada === "lugar") && !d.resguardoLocalidadId) {
      ctx.addIssue({ code: "custom", path: ["resguardoLocalidadId"], message: "Indica la localidad donde está resguardada." });
    }
    if (d.tipo === "ENCONTRADA" && d.resguardada === "lugar" && !d.resguardoDetalle) {
      ctx.addIssue({ code: "custom", path: ["resguardoDetalle"], message: "Cuenta brevemente qué lugar es, por ejemplo «una veterinaria»." });
    }
    if (d.tipo === "PERDIDA" && !d.microchip) {
      ctx.addIssue({ code: "custom", path: ["microchip"], message: "Indica si tiene microchip o elige «No sé»." });
    }
  }, SIEMPRE);

/**
 * «Dar en adopción»: todo antecedente del animal admite «No sé» (no se obliga
 * a inventar información). Las fotos (1 a 3) viajan aparte y se validan en el
 * servidor. `corregir`: código de una propuesta que el municipio devolvió con
 * correcciones; vacío si es una propuesta nueva.
 */
const SI_NO_NO_SE = (mensaje: string) => z.enum(["SI", "NO", "NO_SE"], mensaje);
export const esquemaPropuesta = z
  .object({
    corregir: z.union([z.literal(""), z.string().trim().toUpperCase().regex(FORMATO_CODIGO)]).default(""),
    nombreAnimal: opcional(40),
    especie: z.enum(ESPECIES, "Indica la especie."),
    sexo: z.enum(SEXOS, "Indica el sexo o elige «No se sabe»."),
    // Meses («NO_SE» si no se conoce): el formulario la pide como un número en años o meses.
    edad: z
      .string()
      .trim()
      .refine((x) => x === "NO_SE" || (/^\d+$/.test(x) && Number(x) <= MESES_MAXIMOS), "Escribe la edad aproximada o elige «No se sabe»."),
    tamano: z.enum([...TAMANOS, "NO_SE"], "Indica el tamaño o elige «No sé»."),
    esterilizado: SI_NO_NO_SE("Indica si está esterilizado o elige «No sé»."),
    vacunas: SI_NO_NO_SE("Indica si tiene sus vacunas al día o elige «No sé»."),
    microchip: SI_NO_NO_SE("Indica si tiene microchip o elige «No sé»."),
    // Un solo texto opcional: carácter, salud, convivencia y qué hogar le vendría bien.
    caracter: opcional(800),
    relacion: z.enum(["PROPIO", "RESCATADO", "HOGAR_TEMPORAL", "COMUNITARIO", "OTRA"], "Indica tu relación con el animal."),
    autoriza: z.literal("SI", "Debes declarar que puedes darlo en adopción para enviar la propuesta."),
    ...persona,
  })
  .superRefine(contactoConCorreo, SIEMPRE);

/**
 * Perro comunitario registrado por un vecino: se publica de inmediato y quien
 * lo registra queda como su cuidador (lo gestiona en Mis solicitudes, entrando
 * con su correo). La ubicación es un lugar público de referencia, nunca un domicilio.
 */
export const esquemaDatosComunitario = z.object({
  apodo: texto(2, 60, "Indica cómo lo conocen en el barrio."),
  lugarId: eleccion("Elige el lugar donde suele estar."),
  sexo: z.enum(SEXOS, "Indica el sexo o elige «No se sabe»."),
  tamano: z.enum([...TAMANOS, "NO_SE"], "Indica el tamaño o elige «No se sabe»."),
  colorPrincipal: opcional(40),
  rasgos: opcional(160).refine((t) => !/\d[\d\s.-]{6,}\d/.test(t), "No escribas teléfonos ni direcciones."),
  esterilizado: SI_NO_NO_SE("Indica si está esterilizado o elige «No sé»."),
  vacunas: SI_NO_NO_SE("Indica si tiene vacunas al día o elige «No sé»."),
  microchip: SI_NO_NO_SE("Indica si tiene microchip o elige «No sé»."),
});
const cuidador = { nombre: persona.nombre, rut: persona.rut, telefono: persona.telefono, correo: persona.correo };
export const esquemaRegistroComunitario = esquemaDatosComunitario.extend(cuidador).superRefine(contactoConCorreo, SIEMPRE);
/** Hacerse cargo de un perro comunitario que no tiene cuidador. */
export const esquemaCuidarComunitario = z.object({ perroId: z.string().min(1), ...cuidador }).superRefine(contactoConCorreo, SIEMPRE);

/**
 * Novedad de un vecino sobre un perro comunitario: le llega a quien lo cuida
 * (o al municipio si no tiene cuidador). No pide RUT; basta un contacto.
 */
export const esquemaNovedad = z
  .object({
    perroId: z.string().min(1),
    tipo: z.enum(["SALUD", "NO_ESTA", "ALIMENTACION", "CORRECCION", "OTRA"], "Elige qué quieres informar."),
    texto: texto(10, 600, "Cuéntanos la novedad en al menos 10 caracteres."),
    ...personaSinRut,
  })
  .superRefine(contacto, SIEMPRE);

export const esquemaPostulacion = z
  .object({
    fichaId: z.string().min(1),
    ...persona,
    tipoVivienda: z.enum(TIPOS_VIVIENDA, "Elige el tipo de vivienda."),
    experiencia: z.enum(["SI", "NO"], "Indica si has tenido animales antes."),
    tieneOtros: z.enum(["SI", "NO"], "Indica si hay otros animales en tu hogar."),
    otrosAnimales: opcional(100),
    // Animales propuestos por vecinos: el servidor exige «SI» (ver postularAdopcion).
    compartir: z.enum(["SI", ""]).default(""),
  })
  .superRefine(contactoConCorreo, SIEMPRE)
  .superRefine((d, ctx) => {
    if (d.tieneOtros === "SI" && (d.otrosAnimales ?? "").trim().length < 3) {
      ctx.addIssue({ code: "custom", path: ["otrosAnimales"], message: "Cuéntanos qué animales tienes; por ejemplo, «un perro adulto»." });
    }
  }, SIEMPRE);

/** Mensaje protegido sobre un aviso de mascota (`publicacionId`) o una ficha de adopción de un vecino (`fichaId`). */
export const esquemaMensaje = z
  .object({
    publicacionId: z.string().default(""),
    fichaId: z.string().default(""),
    nombre: texto(3, 100, "Indica tu nombre."),
    telefono: opcional(20),
    correo: opcional(120),
    texto: texto(10, 500, "Escribe un mensaje de al menos 10 caracteres."),
  })
  // Con el correo le llega la respuesta, sin que nadie vea la dirección del otro.
  .superRefine(contactoConCorreo, SIEMPRE)
  .refine((d) => Boolean(d.publicacionId) !== Boolean(d.fichaId), { message: "Falta indicar sobre qué es el mensaje.", path: ["texto"] });

/** Respuesta de quien publicó a un mensaje recibido. */
export const esquemaRespuestaMensaje = z.object({
  mensajeId: z.string().min(1),
  texto: texto(5, 500, "Escribe una respuesta de al menos 5 caracteres."),
});

export type Errores = Record<string, string>;

/** Valida solo los campos de un paso y devuelve el primer error de cada uno. */
export function validarCampos(esquema: z.ZodType, valores: unknown, campos?: readonly string[]): Errores {
  const r = esquema.safeParse(valores);
  if (r.success) return {};
  const errores: Errores = {};
  for (const issue of r.error.issues) {
    const campo = String(issue.path[0] ?? "");
    if (campos && !campos.includes(campo)) continue;
    errores[campo] ??= issue.message;
  }
  return errores;
}
