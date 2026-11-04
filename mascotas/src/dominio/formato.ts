// Formato chileno: coma decimal, espacio antes de % y unidades, horas 10:00.
// Las fechas se muestran en la zona horaria del municipio.
//
// Crear un Intl.DateTimeFormat es costoso: se crea uno por combinación de
// idioma, zona y opciones, y se reutiliza.
const formateadores = new Map<string, Intl.DateTimeFormat>();
function formateador(idioma: string, opciones: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const clave = `${idioma}|${JSON.stringify(opciones)}`;
  let f = formateadores.get(clave);
  if (!f) formateadores.set(clave, (f = new Intl.DateTimeFormat(idioma, opciones)));
  return f;
}
const numeros = new Map<number, Intl.NumberFormat>();

export function numero(valor: number, decimales = 0): string {
  let f = numeros.get(decimales);
  if (!f) numeros.set(decimales, (f = new Intl.NumberFormat("es-CL", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })));
  return f.format(valor);
}

export function porcentaje(fraccion: number, decimales = 0): string {
  return `${numero(fraccion * 100, decimales)} %`;
}

/** «sábado 18 de octubre» (agrega el año si no es el actual). */
export function fechaLarga(fecha: Date, zona: string, hoy = new Date()): string {
  const mismoAno = anio(fecha, zona) === anio(hoy, zona);
  return formateador("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(mismoAno ? {} : { year: "numeric" }),
    timeZone: zona,
  }).format(fecha);
}

/** «18 de octubre de 2026». */
export function fechaCorta(fecha: Date, zona: string): string {
  return formateador("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: zona }).format(fecha);
}

/** «oct» (mes abreviado, sin punto). */
export function mesCorto(fecha: Date, zona: string): string {
  return formateador("es-CL", { month: "short", timeZone: zona }).format(fecha).replace(".", "");
}

/** «09:30». */
export function hora(fecha: Date, zona: string): string {
  return formateador("es-CL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zona }).format(fecha);
}

/** «2026-10-18» en la zona del municipio, para comparar días y para inputs de fecha. */
export function diaISO(fecha: Date, zona: string): string {
  return formateador("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: zona }).format(fecha);
}

function anio(fecha: Date, zona: string) {
  return formateador("es-CL", { year: "numeric", timeZone: zona }).format(fecha);
}

/** «hace 3 días», «hoy», «ayer». */
export function haceDias(fecha: Date, zona: string, hoy = new Date()): string {
  const dias = Math.round((Date.parse(diaISO(hoy, zona)) - Date.parse(diaISO(fecha, zona))) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

/** Instante de las 00:00 del día `dia` («2026-10-18») en la zona indicada. */
export function medianocheEn(dia: string, zona: string): Date {
  const utc = new Date(`${dia}T00:00:00Z`);
  // hourCycle h23: con hour12:false algunos motores escriben la medianoche como «24:00».
  const opciones = { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" } as const;
  const comoZona = new Date(formateador("en-US", { ...opciones, timeZone: zona }).format(utc));
  const comoUtc = new Date(formateador("en-US", { ...opciones, timeZone: "UTC" }).format(utc));
  return new Date(utc.getTime() - (comoZona.getTime() - comoUtc.getTime()));
}

/** Inicio del día de hoy en la zona indicada. */
export function inicioDeHoy(zona: string, ahora = new Date()): Date {
  return medianocheEn(diaISO(ahora, zona), zona);
}

/** «2026-10-06» + n días → «2026-10-xx» (aritmética de calendario, sin zona horaria). */
export function sumarDiasISO(dia: string, n: number): string {
  const d = new Date(`${dia}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Días de calendario entre dos días ISO (hasta − desde). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}
