// Carga demo/datos/ en la base (docs/concepto.md, sección 17; demo/README.md).
//
// - Configuración (municipio, territorio, servicios, catálogos): se actualiza y
//   NO se borra con la demo.
// - Datos de demostración: todo lo demás, con su id original y un lote, para
//   borrarlo de una vez.
// - Fechas: los datos están fechados respecto de resumen.json → fecha_corte.
//   Al cargar se trasladan para que el corte sea `hoy` (por defecto, hoy).
// - Nada se inventa: si falta una referencia, la carga se detiene y lo dice.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PrismaClient } from "@/generated/prisma/client";
import { buscarCoincidencias, type PublicacionComparable } from "@/dominio/coincidencias";
import { diaISO, medianocheEn } from "@/dominio/formato";
import { normalizarRut } from "@/dominio/rut";
import type { Municipio } from "@/lib/municipio";
import { cifrarContrasena } from "@/servidor/contrasenas";
import { borrarDatosDemo } from "@/servidor/demo/borrar";
import { aplicarCambiosDeFotos, fotosFaltantes, type EntradaFotoAnimal } from "@/servidor/demo/fotos";

// ───────────── Lectura ─────────────

type Archivo<T> = { _demo: boolean; datos: T };

export function leerDemo<T>(nombre: string, carpeta = join(process.cwd(), "demo", "datos")): T {
  const contenido = JSON.parse(readFileSync(join(carpeta, `${nombre}.json`), "utf8")) as Archivo<T>;
  if (contenido._demo !== true) throw new Error(`${nombre}.json no está marcado como datos de demostración («_demo»: true).`);
  return contenido.datos;
}

type Posicion = { lat: number; lng: number };
type DSector = { id: string; nombre: string; tipo: string; poblacion: number | null; viviendas: number | null; centro: Posicion; coordenadas_estado: string };
type DLocalidad = { id: string; nombre: string; sector_id: string; lat: number | null; lng: number | null; coordenadas_estado: string };
type DLugar = { id: string; nombre: string; tipo: string; sector_id: string; localidad_id: string; lat: number | null; lng: number | null; coordenadas_estado: string };
type DCatalogos = { tipos_reporte: { id: string; nombre: string; publico: boolean; activo?: boolean }[]; servicios: { id: string; nombre: string }[]; colores_perro: string[]; colores_gato: string[] };
type DUsuario = { id: string; nombre: string; rol: string; correo: string; operativos_asignados?: string[] };
type DPersona = { id: string; nombre: string; rut: string; telefono: string; correo: string; sector_id: string; localidad_id: string };
type DAnimal = { id: string; nombre: string | null; especie: string; sexo: string; edad_aprox_anios: number; color: string; tamano: string; esterilizado: boolean; vacunas_al_dia: boolean; microchip: boolean; rasgos: string; foto: string | null };
type DSolicitud = { id: string; codigo: string; servicio: string; persona_id: string; animal_id: string; sector_id: string; localidad_id: string; fecha: string; estado: string };
type DReporte = { id: string; tipo: string; sector_id: string; referencia: { tipo: "localidad" | "lugar"; id: string }; posicion: Posicion; fecha: string; estado: string; descripcion: string };
type DPublicacion = { id: string; tipo: string; animal_id: string; persona_id: string; sector_id: string; localidad_id: string; fecha: string; estado: string; posicion: Posicion; resguardado?: boolean; resuelta?: string; via_coincidencia?: boolean; coincidencia_con?: string };
type DAdopcion = { id: string; animal_id: string; caracter: string; convive_con_ninos: boolean; convive_con_animales: boolean; publicado: string; estado: string };
type DAdoptada = { id: string; animal_id: string; publicado: string; adoptado: string; sector_adoptante_id: string; adoptante_id: string };
type DPostulacion = { id: string; adopcion_id: string; persona_id: string; fecha: string; estado: string; tipo_vivienda: string; experiencia_previa: boolean; otros_animales: boolean; acepta_compartir_contacto?: boolean };
type DPropuesta = { adopcion_id: string; persona_id: string; codigo: string; relacion: "PROPIO" | "RESCATADO" | "HOGAR_TEMPORAL" | "COMUNITARIO" | "OTRA" };
type DComunitario = { id: string; animal_id: string; apodo: string; lugar_id: string; sector_id: string; cuidadores: string; ultimo_control: string; necesita_atencion: boolean; posicion: Posicion };
type DOperativo = { id: string; nombre: string; sector_id: string; lugar_id: string; fecha: string; horario: string; servicios: string[]; estado: string; resultados?: Record<string, { cupos: number; inscritos: number; asistieron: number }>; cupos?: Record<string, number>; lista_espera_no_cubierta?: number; nota_demo?: string };
type DAtencion = { id: string; operativo_id: string | null; servicio: string; sector_id: string; lugar_id?: string; fecha: string; especie: string; resultado: string };
type DAviso = { id: string; tipo: string; titulo: string; texto: string; sectores: "todos" | string[]; desde: string; hasta: string; nota_demo?: string };
type DResumen = { fecha_corte: string; pesos_prioridad: { D: number; R: number; T: number; E: number } };
type DMunicipio = { id: string; nombre: string };

/** Asignación de fotos (demo/fotos/asignacion.json): solo se aplica si está aprobada. */
type DAsignacion = {
  _aprobada?: boolean;
  animales: EntradaFotoAnimal[];
  comunitarios: (EntradaFotoAnimal & { comunitario_id: string })[];
  operativos: { foto: string; operativo_id: string }[];
};

// ───────────── Traducciones de valores ─────────────

const ESPECIE = { perro: "PERRO", gato: "GATO" } as const;
const SEXO = { macho: "MACHO", hembra: "HEMBRA" } as const;
const TAMANO = { "pequeño": "PEQUENO", mediano: "MEDIANO", grande: "GRANDE" } as const;
const TIPO_SECTOR = { urbano: "URBANO", rural: "RURAL", "urbano-rural": "URBANO_RURAL" } as const;
const ROL = { coordinador: "COORDINADOR", terreno: "TERRENO", comunicaciones: "COMUNICACIONES", directivo: "DIRECTIVO", administrador: "ADMINISTRADOR" } as const;
const ESTADO_SOLICITUD = { recibida: "RECIBIDA", atendida: "ATENDIDA" } as const;
const ESTADO_REPORTE = { abierto: "ABIERTO", "en revision": "EN_REVISION", cerrado: "CERRADO" } as const;
const ESTADO_PUBLICACION = { activa: "ABIERTA", reencontrada: "REENCONTRADA", archivada: "ARCHIVADA" } as const;
const TIPO_PUBLICACION = { perdida: "PERDIDA", encontrada: "ENCONTRADA" } as const;
const ESTADO_POSTULACION = { recibida: "RECIBIDA", "en evaluacion": "EN_EVALUACION", aprobada: "APROBADA", "no seleccionada": "NO_SELECCIONADA" } as const;
const ESTADO_OPERATIVO = { borrador: "BORRADOR", cerrado: "CERRADO" } as const;
const TIPO_AVISO = { campana: "CAMPANA", operativo: "OPERATIVO", informacion: "INFORMACION", alerta: "ALERTA", cambio: "CAMBIO" } as const;
const RESULTADO = { realizado: "REALIZADA" } as const;

/** Traduce un valor de los datos; si no está previsto, se detiene en vez de adivinar. */
function traducir<T extends Record<string, string>>(mapa: T, valor: string, que: string): T[keyof T] {
  const r = mapa[valor as keyof T];
  if (!r) throw new Error(`Valor no previsto en ${que}: «${valor}».`);
  return r;
}

/** «collar rojo» → collar sí, rojo; «sin rasgos visibles» → nada; lo demás son señas. */
export function rasgosAPublicacion(rasgos: string | null) {
  if (!rasgos || rasgos === "sin rasgos visibles") return { collar: null, colorCollar: null, senas: null };
  const collar = /^collar (.+)$/.exec(rasgos);
  if (collar) return { collar: "SI" as const, colorCollar: collar[1], senas: null };
  return { collar: null, colorCollar: null, senas: rasgos.charAt(0).toUpperCase() + rasgos.slice(1) + "." };
}

// ───────────── Carga ─────────────

export type OpcionesCarga = {
  municipio: Municipio;
  /** Día que pasa a ser la fecha de corte (YYYY-MM-DD). Por defecto, hoy en la zona del municipio. */
  hoy?: string;
  /** Contraseña de las cuentas de demostración (DEMO_CONTRASENA en .env). */
  contrasena: string;
  carpeta?: string;
  carpetaFotos?: string;
};

export type ResultadoCarga = { loteId: string; fechaCorte: string; hoy: string; desfaseDias: number; registros: Record<string, number>; fotosAplicadas: boolean };

export async function cargarDemo(db: PrismaClient, op: OpcionesCarga): Promise<ResultadoCarga> {
  const carpeta = op.carpeta ?? join(process.cwd(), "demo", "datos");
  const L = <T>(n: string) => leerDemo<T>(n, carpeta);
  const m = op.municipio;
  const zona = m.zonaHoraria;

  const dMunicipio = L<DMunicipio>("municipio");
  if (dMunicipio.id !== m.id) throw new Error(`demo/datos es del municipio «${dMunicipio.id}», pero el activo es «${m.id}».`);
  if (!op.contrasena || op.contrasena.length < 8) throw new Error("Falta DEMO_CONTRASENA en .env (al menos 8 caracteres) para las cuentas de demostración.");

  const resumen = L<DResumen>("resumen");
  const hoy = op.hoy ?? diaISO(new Date(), zona);
  const desfaseDias = Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${resumen.fecha_corte}T00:00:00Z`)) / 86_400_000);

  /** Día trasladado, a una hora local dada (por defecto mediodía, para no caer en bordes de zona horaria). */
  const fecha = (dia: string, horaMin = "12:00") => {
    const d = new Date(`${dia}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + desfaseDias);
    const [h, mi] = horaMin.split(":").map(Number);
    return new Date(medianocheEn(d.toISOString().slice(0, 10), zona).getTime() + (h * 60 + mi) * 60_000);
  };

  // ── Configuración (no es demo) ──
  const pesos = resumen.pesos_prioridad;
  const parametros = { nombre: m.nombre, nombreOficial: m.nombreOficial, sitioWeb: m.sitioWeb, pesoDemanda: pesos.D, pesoReportes: pesos.R, pesoTiempo: pesos.T, pesoNoCubierta: pesos.E, limitePorHogar: m.parametros.limitePorHogar };
  await db.municipio.upsert({ where: { id: m.id }, create: { id: m.id, ...parametros }, update: parametros });

  const sectorId = new Map<string, string>();
  for (const [orden, s] of L<DSector[]>("sectores").entries()) {
    const datos = { nombre: s.nombre, tipo: traducir(TIPO_SECTOR, s.tipo, "tipo de sector"), centroLat: s.centro?.lat ?? null, centroLng: s.centro?.lng ?? null, estadoCoordenadas: s.coordenadas_estado, viviendas: s.viviendas, poblacion: s.poblacion, orden };
    const r = await db.sector.upsert({ where: { municipioId_clave: { municipioId: m.id, clave: s.id } }, create: { municipioId: m.id, clave: s.id, ...datos }, update: datos });
    sectorId.set(s.id, r.id);
  }
  const idSector = (clave: string, donde: string) => sectorId.get(clave) ?? falta(`sector «${clave}»`, donde);

  const localidadId = new Map<string, string>();
  const localidades = L<DLocalidad[]>("localidades");
  for (const [orden, l] of localidades.entries()) {
    const datos = { sectorId: idSector(l.sector_id, `localidad ${l.id}`), nombre: l.nombre, lat: l.lat, lng: l.lng, estadoCoordenadas: l.coordenadas_estado, orden };
    const r = await db.localidad.upsert({ where: { clave: l.id }, create: { clave: l.id, ...datos }, update: datos });
    localidadId.set(l.id, r.id);
  }
  const idLocalidad = (clave: string, donde: string) => localidadId.get(clave) ?? falta(`localidad «${clave}»`, donde);

  const lugarId = new Map<string, string>();
  for (const l of L<DLugar[]>("lugares")) {
    const datos = { sectorId: idSector(l.sector_id, `lugar ${l.id}`), localidadId: idLocalidad(l.localidad_id, `lugar ${l.id}`), nombre: l.nombre, tipo: l.tipo, lat: l.lat, lng: l.lng, estadoCoordenadas: l.coordenadas_estado };
    const r = await db.lugar.upsert({ where: { clave: l.id }, create: { clave: l.id, ...datos }, update: datos });
    lugarId.set(l.id, r.id);
  }
  const idLugar = (clave: string, donde: string) => lugarId.get(clave) ?? falta(`lugar «${clave}»`, donde);

  const catalogos = L<DCatalogos>("catalogos");
  const servicioId = new Map<string, string>();
  for (const s of catalogos.servicios) {
    const r = await db.servicio.upsert({ where: { municipioId_clave: { municipioId: m.id, clave: s.id } }, create: { municipioId: m.id, clave: s.id, nombre: s.nombre }, update: { nombre: s.nombre, activo: true } });
    servicioId.set(s.id, r.id);
  }
  const idServicio = (clave: string, donde: string) => servicioId.get(clave) ?? falta(`servicio «${clave}»`, donde);

  const tipoReporteId = new Map<string, string>();
  for (const [orden, t] of catalogos.tipos_reporte.entries()) {
    const datos = { nombre: t.nombre, publico: t.publico, activo: t.activo ?? true, orden };
    const r = await db.tipoReporte.upsert({ where: { municipioId_clave: { municipioId: m.id, clave: t.id } }, create: { municipioId: m.id, clave: t.id, ...datos }, update: datos });
    tipoReporteId.set(t.id, r.id);
  }
  await db.colorCatalogo.deleteMany({ where: { municipioId: m.id } });
  await db.colorCatalogo.createMany({
    data: [
      ...catalogos.colores_perro.map((nombre, orden) => ({ municipioId: m.id, especie: "PERRO" as const, nombre, orden })),
      ...catalogos.colores_gato.map((nombre, orden) => ({ municipioId: m.id, especie: "GATO" as const, nombre, orden })),
    ],
  });

  // ── Datos de demostración ──
  await borrarDatosDemo(db);
  const hash = await cifrarContrasena(op.contrasena);

  // Fotos aprobadas: sus ajustes de color o tamaño se aplican antes de usar los animales en cualquier parte.
  const carpetaFotos = op.carpetaFotos ?? join(process.cwd(), "demo", "fotos");
  const asignacion = leerAsignacion(carpetaFotos);
  if (asignacion) {
    const faltan = fotosFaltantes(carpetaFotos, [...asignacion.animales, ...asignacion.comunitarios, ...asignacion.operativos].map((x) => x.foto));
    if (faltan.length) throw new Error(`Faltan fotos de asignacion.json en demo/fotos/: ${faltan.join(", ")}`);
  }

  const personas = L<DPersona[]>("personas");
  const animales = asignacion
    ? aplicarCambiosDeFotos(L<DAnimal[]>("animales"), [...asignacion.animales, ...asignacion.comunitarios], { perro: catalogos.colores_perro, gato: catalogos.colores_gato })
    : L<DAnimal[]>("animales");
  const solicitudes = L<DSolicitud[]>("solicitudes");
  const reportes = L<DReporte[]>("reportes");
  const publicaciones = L<DPublicacion[]>("publicaciones");
  const adopcion = L<DAdopcion[]>("adopcion");
  const adoptadas = L<DAdoptada[]>("adopciones_realizadas");
  const postulaciones = L<DPostulacion[]>("postulaciones");
  const propuestas = L<DPropuesta[]>("propuestas_adopcion");
  const comunitarios = L<DComunitario[]>("perros_comunitarios");
  const operativos = L<DOperativo[]>("operativos");
  const atenciones = L<DAtencion[]>("atenciones");
  const avisos = L<DAviso[]>("avisos");
  const usuarios = L<DUsuario[]>("usuarios");

  const fotoAnimal = new Map(asignacion?.animales.map((a) => [a.animal_id, a.foto]) ?? []);
  const agrupar = (pares: [string, string][]) => {
    const mapa = new Map<string, string[]>();
    for (const [id, foto] of pares) mapa.set(id, [...(mapa.get(id) ?? []), foto]);
    return mapa;
  };
  const fotosComunitario = agrupar((asignacion?.comunitarios ?? []).map((c) => [c.comunitario_id, c.foto]));
  const fotosOperativo = agrupar((asignacion?.operativos ?? []).map((o) => [o.operativo_id, o.foto]));

  const ids = (lista: { id: string }[]) => new Set(lista.map((x) => x.id));
  const personaIds = ids(personas);
  const animalIds = ids(animales);
  const existe = (conjunto: Set<string>, id: string, que: string, donde: string) => (conjunto.has(id) ? id : falta(`${que} «${id}»`, donde));

  // Dueño de cada animal: quien lo inscribe en una solicitud, quien lo publica como perdido o quien lo adopta.
  const duenio = new Map<string, string>();
  for (const s of solicitudes) duenio.set(s.animal_id, s.persona_id);
  for (const p of publicaciones) if (p.tipo === "perdida" && !duenio.has(p.animal_id)) duenio.set(p.animal_id, p.persona_id);
  for (const a of adoptadas) duenio.set(a.animal_id, a.adoptante_id);

  let loteDemoId = "";
  await db.$transaction(
    async (tx) => {
      // El lote se crea dentro de la transacción: si la carga falla, no queda un lote vacío.
      const lote = await tx.loteDemo.create({
        data: { descripcion: `Datos de demo/datos/ (corte ${resumen.fecha_corte}, trasladados ${desfaseDias} días)`, fechaCorte: fecha(resumen.fecha_corte), desfaseDias },
      });
      loteDemoId = lote.id;
      await tx.usuarioMunicipal.createMany({
        data: usuarios.map((u) => ({ id: u.id, municipioId: m.id, nombre: u.nombre, correo: u.correo.toLowerCase(), hashContrasena: hash, rol: traducir(ROL, u.rol, "rol"), loteDemoId })),
      });

      await tx.persona.createMany({
        data: personas.map((p) => ({
          id: p.id,
          municipioId: m.id,
          rut: normalizarRut(p.rut) ?? falta(`RUT válido`, `persona ${p.id} (${p.rut})`),
          nombre: p.nombre,
          telefono: p.telefono || null,
          correo: p.correo || null,
          sectorId: idSector(p.sector_id, `persona ${p.id}`),
          localidadId: idLocalidad(p.localidad_id, `persona ${p.id}`),
          loteDemoId,
        })),
      });

      await tx.animal.createMany({
        data: animales.map((a) => ({
          id: a.id,
          especie: traducir(ESPECIE, a.especie, `especie de ${a.id}`),
          nombre: a.nombre,
          sexo: traducir(SEXO, a.sexo, `sexo de ${a.id}`),
          edadAproxMeses: Math.round(a.edad_aprox_anios * 12),
          colorPrincipal: a.color,
          tamano: traducir(TAMANO, a.tamano, `tamaño de ${a.id}`),
          rasgos: a.rasgos === "sin rasgos visibles" ? null : a.rasgos,
          esterilizado: a.esterilizado,
          vacunasAlDia: a.vacunas_al_dia,
          microchip: a.microchip,
          foto: fotoAnimal.get(a.id) ?? a.foto,
          personaId: duenio.has(a.id) ? existe(personaIds, duenio.get(a.id)!, "persona", `dueño de ${a.id}`) : null,
          creadoEn: fecha(resumen.fecha_corte),
          loteDemoId,
        })),
      });

      await tx.solicitudServicio.createMany({
        data: solicitudes.map((s) => ({
          id: s.id,
          codigo: s.codigo,
          personaId: existe(personaIds, s.persona_id, "persona", `solicitud ${s.id}`),
          animalId: existe(animalIds, s.animal_id, "animal", `solicitud ${s.id}`),
          servicioId: idServicio(s.servicio, `solicitud ${s.id}`),
          sectorId: idSector(s.sector_id, `solicitud ${s.id}`),
          localidadId: idLocalidad(s.localidad_id, `solicitud ${s.id}`),
          estado: traducir(ESTADO_SOLICITUD, s.estado, `estado de ${s.id}`),
          origen: "PORTAL" as const,
          creadaEn: fecha(s.fecha),
          loteDemoId,
        })),
      });

      await tx.reporteCiudadano.createMany({
        data: reportes.map((r) => ({
          id: r.id,
          tipoId: tipoReporteId.get(r.tipo) ?? falta(`tipo de reporte «${r.tipo}»`, `reporte ${r.id}`),
          sectorId: idSector(r.sector_id, `reporte ${r.id}`),
          localidadId: r.referencia.tipo === "localidad" ? idLocalidad(r.referencia.id, `reporte ${r.id}`) : null,
          lugarId: r.referencia.tipo === "lugar" ? idLugar(r.referencia.id, `reporte ${r.id}`) : null,
          lat: r.posicion.lat,
          lng: r.posicion.lng,
          descripcion: r.descripcion,
          estado: traducir(ESTADO_REPORTE, r.estado, `estado de ${r.id}`),
          creadoEn: fecha(r.fecha),
          loteDemoId,
        })),
      });

      const animalPorId = new Map(animales.map((a) => [a.id, a]));
      await tx.publicacionMascota.createMany({
        data: publicaciones.map((p) => {
          const a = animalPorId.get(p.animal_id) ?? falta(`animal «${p.animal_id}»`, `publicación ${p.id}`);
          const perdida = p.tipo === "perdida";
          const r = rasgosAPublicacion(a.rasgos);
          const cuando = fecha(p.fecha);
          return {
            id: p.id,
            tipo: traducir(TIPO_PUBLICACION, p.tipo, `tipo de ${p.id}`),
            animalId: a.id,
            especie: traducir(ESPECIE, a.especie, `especie de ${a.id}`),
            sexo: traducir(SEXO, a.sexo, `sexo de ${a.id}`),
            tamano: traducir(TAMANO, a.tamano, `tamaño de ${a.id}`),
            colorPrincipal: a.color,
            nombreAnimal: perdida ? a.nombre : null,
            collar: r.collar,
            colorCollar: r.colorCollar,
            microchip: perdida ? (a.microchip ? ("SI" as const) : ("NO" as const)) : null,
            senas: r.senas,
            sectorId: idSector(p.sector_id, `publicación ${p.id}`),
            localidadId: idLocalidad(p.localidad_id, `publicación ${p.id}`),
            lat: p.posicion.lat,
            lng: p.posicion.lng,
            fechaEvento: cuando,
            resguardada: perdida ? null : (p.resguardado ?? null),
            estado: traducir(ESTADO_PUBLICACION, p.estado, `estado de ${p.id}`),
            moderacion: "APROBADA" as const,
            personaId: existe(personaIds, p.persona_id, "persona", `publicación ${p.id}`),
            vigenteHasta: new Date(cuando.getTime() + 30 * 86_400_000),
            reencuentroPorCoincidencia: p.estado === "reencontrada" ? (p.via_coincidencia ?? false) : null,
            creadaEn: cuando,
            resueltaEn: p.resuelta ? fecha(p.resuelta) : null,
            loteDemoId,
          };
        }),
      });

      // Coincidencias indicadas en los datos (coincidencia_con): se guardan con el puntaje y los motivos de la regla.
      for (const p of publicaciones.filter((x) => x.coincidencia_con)) {
        const otra = publicaciones.find((x) => x.id === p.coincidencia_con) ?? falta(`publicación «${p.coincidencia_con}»`, `coincidencia de ${p.id}`);
        const [perdida, encontrada] = p.tipo === "perdida" ? [p, otra] : [otra, p];
        const comparable = (x: DPublicacion): PublicacionComparable => {
          const a = animalPorId.get(x.animal_id)!;
          const r = rasgosAPublicacion(a.rasgos);
          const loc = localidades.find((l) => l.id === x.localidad_id);
          return { id: x.id, tipo: traducir(TIPO_PUBLICACION, x.tipo, "tipo"), especie: traducir(ESPECIE, a.especie, "especie"), sectorId: x.sector_id, localidad: loc?.lat != null && loc.lng != null ? { lat: loc.lat, lng: loc.lng } : null, fechaEvento: fecha(x.fecha), colorPrincipal: a.color, tamano: traducir(TAMANO, a.tamano, "tamaño"), collar: r.collar, colorCollar: r.colorCollar, senas: r.senas };
        };
        const [c] = buscarCoincidencias(comparable(perdida), [comparable(encontrada)]);
        await tx.coincidencia.create({
          data: {
            perdidaId: perdida.id,
            encontradaId: encontrada.id,
            puntaje: c?.puntaje ?? 0,
            motivos: c ? c.motivos.join("; ") : "Indicada en los datos de demostración",
          },
        });
      }

      // Cada ficha la propuso un vecino (propuestas_adopcion.json): las postulaciones le llegan a esa persona.
      const personaPorId = new Map(personas.map((p) => [p.id, p]));
      const propuestaDe = (fichaId: string) => {
        const p = propuestas.find((x) => x.adopcion_id === fichaId);
        if (!p) return {};
        const persona = personaPorId.get(p.persona_id) ?? falta(`persona «${p.persona_id}»`, `propuesta de ${fichaId}`);
        return {
          proponenteId: persona.id,
          codigo: p.codigo,
          relacion: p.relacion,
          autorizaPublicar: true,
          sectorId: idSector(persona.sector_id, `propuesta de ${fichaId}`),
          localidadId: idLocalidad(persona.localidad_id, `propuesta de ${fichaId}`),
        };
      };
      await tx.fichaAdopcion.createMany({
        data: [
          ...adopcion.map((f) => ({
            id: f.id,
            animalId: existe(animalIds, f.animal_id, "animal", `adopción ${f.id}`),
            caracter: f.caracter,
            conviveConNinos: f.convive_con_ninos,
            conviveConAnimales: f.convive_con_animales,
            estado: f.estado === "disponible" ? ("DISPONIBLE" as const) : falta(`estado previsto («${f.estado}»)`, `adopción ${f.id}`),
            publicadaEn: fecha(f.publicado),
            creadaEn: fecha(f.publicado),
            ...propuestaDe(f.id),
            loteDemoId,
          })),
          ...adoptadas.map((f) => ({
            id: f.id,
            animalId: existe(animalIds, f.animal_id, "animal", `adopción ${f.id}`),
            estado: "ADOPTADO" as const,
            publicadaEn: fecha(f.publicado),
            adoptadaEn: fecha(f.adoptado),
            adoptanteId: existe(personaIds, f.adoptante_id, "persona", `adopción ${f.id}`),
            sectorAdoptanteId: idSector(f.sector_adoptante_id, `adopción ${f.id}`),
            creadaEn: fecha(f.publicado),
            ...propuestaDe(f.id),
            loteDemoId,
          })),
        ],
      });

      const fichaIds = ids(adopcion);
      await tx.postulacionAdopcion.createMany({
        data: postulaciones.map((p) => ({
          id: p.id,
          fichaId: existe(fichaIds, p.adopcion_id, "adopción", `postulación ${p.id}`),
          personaId: existe(personaIds, p.persona_id, "persona", `postulación ${p.id}`),
          tipoVivienda: p.tipo_vivienda,
          experienciaPrevia: p.experiencia_previa,
          otrosAnimales: p.otros_animales,
          compartirContacto: p.acepta_compartir_contacto ?? false,
          estado: traducir(ESTADO_POSTULACION, p.estado, `estado de ${p.id}`),
          creadaEn: fecha(p.fecha),
          loteDemoId,
        })),
      });

      await tx.perroComunitario.createMany({
        data: comunitarios.map((c) => ({
          id: c.id,
          animalId: existe(animalIds, c.animal_id, "animal", `comunitario ${c.id}`),
          apodo: c.apodo,
          sectorId: idSector(c.sector_id, `comunitario ${c.id}`),
          lugarId: idLugar(c.lugar_id, `comunitario ${c.id}`),
          cuidadores: c.cuidadores,
          ultimoControl: c.ultimo_control ? fecha(c.ultimo_control) : null,
          necesitaAtencion: c.necesita_atencion,
          lat: c.posicion.lat,
          lng: c.posicion.lng,
          fotos: (fotosComunitario.get(c.id) ?? []).join(","),
          loteDemoId,
        })),
      });

      for (const o of operativos) {
        const [horaInicio, horaFin] = /^(\d{2}:\d{2}) a (\d{2}:\d{2})$/.exec(o.horario)?.slice(1) ?? falta(`horario «HH:MM a HH:MM»`, `operativo ${o.id} (${o.horario})`);
        const estado = traducir(ESTADO_OPERATIVO, o.estado, `estado de ${o.id}`);
        const cupos = estado === "CERRADO" ? Object.fromEntries(Object.entries(o.resultados ?? {}).map(([s, r]) => [s, r.cupos])) : (o.cupos ?? {});
        await tx.operativo.create({
          data: {
            id: o.id,
            nombre: o.nombre,
            sectorId: idSector(o.sector_id, `operativo ${o.id}`),
            lugarId: idLugar(o.lugar_id, `operativo ${o.id}`),
            fecha: fecha(o.fecha, horaInicio),
            horaInicio,
            horaFin,
            estado,
            // El borrador de la demo nace de la recomendación de prioridad (nota_demo).
            origen: estado === "BORRADOR" ? "RECOMENDACION" : "DESDE_CERO",
            cerradoEn: estado === "CERRADO" ? fecha(o.fecha, horaFin) : null,
            fotos: (fotosOperativo.get(o.id) ?? []).join(","),
            loteDemoId,
            capacidades: { create: o.servicios.map((s) => ({ servicioId: idServicio(s, `operativo ${o.id}`), cupos: cupos[s] ?? falta(`cupos de «${s}»`, `operativo ${o.id}`) })) },
          },
        });
      }

      const operativoIds = ids(operativos);
      await tx.atencion.createMany({
        data: atenciones.map((a) => ({
          id: a.id,
          operativoId: a.operativo_id ? existe(operativoIds, a.operativo_id, "operativo", `atención ${a.id}`) : null,
          servicioId: idServicio(a.servicio, `atención ${a.id}`),
          especie: traducir(ESPECIE, a.especie, `especie de ${a.id}`),
          sectorId: idSector(a.sector_id, `atención ${a.id}`),
          lugarId: a.lugar_id ? idLugar(a.lugar_id, `atención ${a.id}`) : null,
          resultado: traducir(RESULTADO, a.resultado, `resultado de ${a.id}`),
          realizadaEn: fecha(a.fecha),
          loteDemoId,
        })),
      });

      // Resultado de cada operativo cerrado: por servicio desde operativos.json; atenciones desde atenciones.json.
      for (const o of operativos.filter((x) => x.estado === "cerrado")) {
        const r = o.resultados ?? falta("resultados", `operativo cerrado ${o.id}`);
        const suyas = atenciones.filter((a) => a.operativo_id === o.id && a.resultado === "realizado");
        const porServicio: Record<string, number> = {};
        for (const a of suyas) porServicio[a.servicio] = (porServicio[a.servicio] ?? 0) + 1;
        await tx.resultadoOperativo.create({
          data: {
            operativoId: o.id,
            inscritos: Object.values(r).reduce((t, x) => t + x.inscritos, 0),
            asistentes: Object.values(r).reduce((t, x) => t + x.asistieron, 0),
            atenciones: suyas.length,
            atencionesPorServicio: JSON.stringify(porServicio),
            detallePorServicio: JSON.stringify(r),
            demandaNoCubierta: o.lista_espera_no_cubierta ?? 0,
            calculadoEn: fecha(o.fecha, "18:00"),
          },
        });
      }

      for (const u of usuarios) {
        for (const opId of u.operativos_asignados ?? []) {
          await tx.asignacionTerreno.create({ data: { usuarioId: u.id, operativoId: existe(operativoIds, opId, "operativo", `asignación de ${u.id}`) } });
        }
      }

      for (const a of avisos) {
        // «Se publica durante la demostración»: queda en borrador, unido al operativo en borrador de su sector.
        const enVivo = a.nota_demo?.includes("Se publica durante la demostración") ?? false;
        const sectores = a.sectores === "todos" ? [] : a.sectores.map((s) => idSector(s, `aviso ${a.id}`));
        const operativo = enVivo && a.tipo === "operativo" ? operativos.find((o) => o.estado === "borrador" && a.sectores !== "todos" && a.sectores.includes(o.sector_id)) : undefined;
        await tx.aviso.create({
          data: {
            id: a.id,
            tipo: traducir(TIPO_AVISO, a.tipo, `tipo de ${a.id}`),
            titulo: a.titulo,
            texto: a.texto,
            vigenteDesde: fecha(a.desde, "00:00"),
            vigenteHasta: fecha(a.hasta, "23:59"),
            estado: enVivo ? "BORRADOR" : "PUBLICADO",
            destacado: a.tipo === "alerta",
            operativoId: operativo?.id ?? null,
            creadoEn: fecha(a.desde, "00:00"),
            loteDemoId,
            sectores: { create: sectores.map((sectorId) => ({ sectorId })) },
          },
        });
      }
    },
    { timeout: 120_000 },
  );

  const registros = {
    usuarios: usuarios.length,
    personas: personas.length,
    animales: animales.length,
    solicitudes: solicitudes.length,
    reportes: reportes.length,
    publicaciones: publicaciones.length,
    "fichas de adopción": adopcion.length + adoptadas.length,
    postulaciones: postulaciones.length,
    "perros comunitarios": comunitarios.length,
    operativos: operativos.length,
    atenciones: atenciones.length,
    avisos: avisos.length,
  };
  return { loteId: loteDemoId, fechaCorte: resumen.fecha_corte, hoy, desfaseDias, registros, fotosAplicadas: !!asignacion };
}

/** La asignación de fotos se aplica solo si quien la revisó la marcó como aprobada. */
function leerAsignacion(carpeta: string): DAsignacion | null {
  try {
    const a = JSON.parse(readFileSync(join(carpeta, "asignacion.json"), "utf8")) as DAsignacion;
    return a._aprobada === true ? a : null;
  } catch {
    return null;
  }
}

function falta(que: string, donde: string): never {
  throw new Error(`Falta ${que} en ${donde}. Revisa demo/datos/: la carga no inventa datos que no existen.`);
}
