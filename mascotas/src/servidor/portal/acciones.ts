"use server";
// Trámites del portal ciudadano. Cada acción vuelve a validar en el servidor,
// guarda en una transacción; se sigue en Mis solicitudes, entrando con el correo.
//
// Datos de demostración: un registro que cuelga de un padre simulado
// (operativo, ficha o publicación de la demo) hereda su lote, para que borrar
// la demo no deje registros reales apuntando a datos que ya no existen.
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FORMATO_CODIGO } from "@/dominio/codigo";
import { limiteParaResponder, nuevaVigencia } from "@/dominio/vigencia";
import { alcanzaLimiteHogar, CUPO_OCUPA, CUPO_VIGENTE, decidirCupo } from "@/dominio/cupos";
import { ESPECIE, ESTADO_ADOPCION, ESTADO_CUPO, ESTADO_POSTULACION, ESTADO_PUBLICACION, ESTADO_REPORTE, ESTADO_SOLICITUD, REVISION_ADOPCION, TIPO_PUBLICACION, tipoAviso, type Estado } from "@/dominio/etiquetas";
import { ESTADO_NOVEDAD, estadoActualizacion, TIPO_NOVEDAD } from "@/dominio/comunitarios";
import { ESTADO_INVITACION, INVITACION_ABIERTA } from "@/dominio/invitaciones";
import { aSiNoNoSe, MAXIMO_FOTOS, mesesDeEdad, normalizarNombre, REVISION_ABIERTA, siNoNoSe } from "@/dominio/propuestas";
import { normalizarRut } from "@/dominio/rut";
import {
  correoValido,
  esquemaCupo,
  esquemaMensaje,
  esquemaNovedad,
  esquemaPostulacion,
  esquemaPropuesta,
  esquemaPublicacion,
  esquemaReporte,
  esquemaServicio,
  PREGUNTA_SI_SIGUE,
  validarCampos,
  type Errores,
} from "@/lib/esquemas";
import { municipioActivo } from "@/lib/municipio";
import { nuevoCodigo } from "@/servidor/codigos";
import { db } from "@/servidor/db";
import { fechaCorta, fechaLarga, hora, inicioDeHoy, medianocheEn } from "@/servidor/formato";
import { concretarAdopcion } from "@/servidor/adopciones";
import { asignarInteresadas, procesarOperativo } from "@/servidor/invitaciones";
import { PREFIJO_FOTO_AVISO } from "@/componentes/portal/fotoAviso";
import { MOTIVO_AVISTAMIENTO } from "@/dominio/coincidencias";
import { borrarFoto, guardarFoto } from "@/servidor/archivos";
import { FICHA_PUBLICA } from "@/servidor/conFoto";
import { notificar } from "@/servidor/notificaciones";
import { obtenerPersona } from "@/servidor/personas";
import { coincidenciasDe, operativoCercano, publicacion, publicacionPropia } from "@/servidor/portal/consultas";
import { abrirSesionVecino, cerrarSesionVecino, filtroVecino, normalizarCorreo, SESION_VENCIDA } from "@/servidor/portal/sesionVecino";

export type Fallo = { ok: false; errores?: Errores; mensaje?: string };
const fallo = (mensaje: string, errores?: Errores): Fallo => ({ ok: false, mensaje, errores });
const REVISE = "Revisa los datos marcados.";
const ERROR_GENERAL = "No pudimos registrar tu trámite. Intenta nuevamente en unos minutos.";

/** Localidad de la lista cerrada y su sector; null si no pertenece al municipio. */
async function ubicacion(localidadId: string, municipioId: string) {
  const l = await db.localidad.findFirst({ where: { id: localidadId, sector: { municipioId } }, include: { sector: true } });
  return l ? { localidad: l, sector: l.sector, ids: { sectorId: l.sectorId, localidadId: l.id } } : null;
}
const LOCALIDAD_INVALIDA = { localidadId: "Elige una localidad de la lista." };

const datosAnimal = (d: { especie: "PERRO" | "GATO"; nombreAnimal: string; sexo: "MACHO" | "HEMBRA" | "DESCONOCIDO"; tamano: "PEQUENO" | "MEDIANO" | "GRANDE" | ""; edad: string }) => ({
  especie: d.especie,
  nombre: d.nombreAnimal || null,
  sexo: d.sexo,
  tamano: d.especie === "PERRO" && d.tamano ? d.tamano : null,
  edadAproxMeses: Number(d.edad),
});


// ───────────── Solicitud de servicio ─────────────

export type ResultadoServicio =
  | { ok: true; codigo: string; servicio: string; operativo: { id: string; sector: string; fecha: string } | null }
  | Fallo;

export async function solicitarServicio(valores: unknown): Promise<ResultadoServicio> {
  const r = esquemaServicio.safeParse(valores);
  if (!r.success) return fallo(REVISE, validarCampos(esquemaServicio, valores));
  const d = r.data;
  const municipio = municipioActivo();

  try {
    const servicio = await db.servicio.findFirst({ where: { id: d.servicioId, municipioId: municipio.id, activo: true } });
    const u = await ubicacion(d.localidadId, municipio.id);
    if (!servicio) return fallo(REVISE, { servicioId: "Elige un servicio de la lista." });
    if (!u) return fallo(REVISE, LOCALIDAD_INVALIDA);
    const { sector } = u;

    const codigo = await nuevoCodigo(db);
    await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, d, u.ids);
      const animal = await tx.animal.create({ data: { ...datosAnimal(d), personaId: persona.id } });
      await tx.solicitudServicio.create({
        data: { codigo, personaId: persona.id, animalId: animal.id, servicioId: servicio.id, ...u.ids },
      });
      await notificar(tx, persona, "Tu solicitud fue recibida", `Registramos tu solicitud de ${servicio.nombre.toLowerCase()} en el sector ${sector.nombre}. Puedes ver su estado en Mis solicitudes, entrando con tu correo.`);
    });

    const cercano = await operativoCercano(sector.id, servicio.id, u.localidad.id);
    return {
      ok: true,
      codigo,
      servicio: servicio.nombre,
      operativo: cercano ? { id: cercano.id, sector: cercano.sector.nombre, fecha: fechaLarga(cercano.fecha) } : null,
    };
  } catch (e) {
    console.error(e);
    return fallo(ERROR_GENERAL);
  }
}

// ───────────── Solicitud de cupo en un operativo ─────────────

export type ResultadoCupo =
  | { ok: true; codigo: string; estado: "CONFIRMADO" | "EN_LISTA_ESPERA"; posicion: number | null; servicio: string; fecha: string; horario: string; lugar: string }
  | Fallo;

export async function solicitarCupo(valores: unknown): Promise<ResultadoCupo> {
  const r = esquemaCupo.safeParse(valores);
  if (!r.success) return fallo(REVISE, validarCampos(esquemaCupo, valores));
  const d = r.data;
  const municipio = municipioActivo();

  try {
    const operativo = await db.operativo.findFirst({
      where: { id: d.operativoId, estado: "PUBLICADO", fecha: { gte: inicioDeHoy() }, sector: { municipioId: municipio.id } },
      include: { capacidades: { include: { servicio: true } }, lugar: true },
    });
    if (!operativo) return fallo("Las inscripciones de este operativo ya no están abiertas.");
    const capacidad = operativo.capacidades.find((c) => c.servicioId === d.servicioId);
    if (!capacidad) return fallo(REVISE, { servicioId: "Este operativo no ofrece ese servicio." });
    const u = await ubicacion(d.localidadId, municipio.id);
    if (!u) return fallo(REVISE, LOCALIDAD_INVALIDA);

    const codigo = await nuevoCodigo(db);
    const decision = await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, d, u.ids);
      const vigentes = await tx.cupo.count({ where: { operativoId: operativo.id, personaId: persona.id, estado: { in: [...CUPO_VIGENTE] } } });
      if (alcanzaLimiteHogar(vigentes, municipio.parametros.limitePorHogar)) return null;

      // Ocupados por cupos más retenidos por invitaciones prioritarias abiertas.
      const ocupados =
        (await tx.cupo.count({ where: { operativoId: operativo.id, servicioId: d.servicioId, estado: { in: [...CUPO_OCUPA] } } })) +
        (await tx.invitacionOperativo.count({ where: { operativoId: operativo.id, servicioId: d.servicioId, estado: { in: [...INVITACION_ABIERTA] } } }));
      const enEspera = await tx.cupo.count({ where: { operativoId: operativo.id, servicioId: d.servicioId, estado: "EN_LISTA_ESPERA" } });
      const dec = decidirCupo(capacidad.cupos, ocupados, enEspera);

      const animal = await tx.animal.create({ data: { ...datosAnimal(d), personaId: persona.id, loteDemoId: operativo.loteDemoId } });
      await tx.cupo.create({
        data: {
          codigo,
          operativoId: operativo.id,
          servicioId: d.servicioId,
          personaId: persona.id,
          animalId: animal.id,
          estado: dec.estado,
          posicionEspera: dec.estado === "EN_LISTA_ESPERA" ? dec.posicion : null,
          loteDemoId: operativo.loteDemoId,
        },
      });
      const detalle = dec.estado === "CONFIRMADO" ? "Tu cupo está confirmado" : `Quedaste en lista de espera, en el lugar ${dec.posicion}`;
      await notificar(tx, persona, "Solicitud de cupo recibida", `${detalle} para ${capacidad.servicio.nombre.toLowerCase()} el ${fechaLarga(operativo.fecha)}. Te enviaremos un recordatorio 48 horas antes.`, operativo.loteDemoId);
      return dec;
    });

    if (!decision) {
      return fallo(`Cada hogar puede inscribir hasta ${municipio.parametros.limitePorHogar} animales por operativo, y ya alcanzaste ese límite con tu RUT.`);
    }
    revalidatePath(`/operativos/${operativo.id}`);
    return {
      ok: true,
      codigo,
      estado: decision.estado,
      posicion: decision.estado === "EN_LISTA_ESPERA" ? decision.posicion : null,
      servicio: capacidad.servicio.nombre,
      fecha: fechaLarga(operativo.fecha),
      horario: `de ${operativo.horaInicio} a ${operativo.horaFin} horas`,
      lugar: operativo.lugar.nombre,
    };
  } catch (e) {
    console.error(e);
    return fallo(ERROR_GENERAL);
  }
}

// ───────────── Reporte de una situación ─────────────

export type ResultadoReporte = { ok: true; codigo: string } | Fallo;

/**
 * SOS Mascotas (sección 3): llega como FormData con los campos en «datos»
 * (JSON) y una foto opcional en «foto»; también acepta los campos sueltos.
 * La foto se valida y se guarda sin metadatos fuera de la carpeta pública.
 */
export async function reportarSituacion(entrada: unknown): Promise<ResultadoReporte> {
  let valores: unknown = entrada;
  let foto: Blob | null = null;
  if (entrada instanceof FormData) {
    try {
      valores = JSON.parse(String(entrada.get("datos") ?? "{}"));
    } catch {
      return fallo(REVISE);
    }
    const f = entrada.get("foto");
    foto = f instanceof Blob && f.size > 0 ? f : null;
  }
  const r = esquemaReporte.safeParse(valores);
  if (!r.success) return fallo(REVISE, validarCampos(esquemaReporte, valores));
  const d = r.data;
  const municipio = municipioActivo();

  let fotoArchivo: string | null = null;
  try {
    const u = await ubicacion(d.localidadId, municipio.id);
    if (!u) return fallo(REVISE, LOCALIDAD_INVALIDA);
    // Solo las categorías vigentes de SOS Mascotas; las antiguas clasifican reportes anteriores.
    const tipo = await db.tipoReporte.findFirst({ where: { municipioId: municipio.id, clave: d.tipo, activo: true } });
    if (!tipo) return fallo(REVISE, { tipo: "Elige una situación de la lista." });
    if (foto) {
      const g = await guardarFoto(foto, "reportes");
      if (!g.ok) return fallo(REVISE, { foto: g.mensaje });
      fotoArchivo = g.nombre;
    }
    const codigo = await nuevoCodigo(db);
    await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, d, u.ids);
      await tx.reporteCiudadano.create({
        data: {
          codigo,
          tipoId: tipo.id,
          especie: d.especie || null,
          cantidad: d.cantidad,
          sigueEnLugar: PREGUNTA_SI_SIGUE.includes(d.tipo) && d.sigueEnLugar ? d.sigueEnLugar : null,
          ...u.ids,
          descripcion: d.descripcion,
          fotoArchivo,
          personaId: persona.id,
          historial: { create: { estado: "ABIERTO" } },
        },
      });
      await notificar(tx, persona, "Tu reporte fue recibido", "Recibimos tu reporte de SOS Mascotas. El equipo municipal lo revisará en horario de atención.");
    });
    return { ok: true, codigo };
  } catch (e) {
    console.error(e);
    if (fotoArchivo) await borrarFoto("reportes", fotoArchivo);
    return fallo(ERROR_GENERAL);
  }
}

// ───────────── Novedad sobre un perro comunitario ─────────────

export type ResultadoNovedad = { ok: true; codigo: string } | Fallo;

/**
 * Novedad de un vecino sobre un perro comunitario: se le envía a quien lo
 * cuida, sin mostrarle el contacto de quien informa. Un perro sin cuidador no
 * recibe novedades: se ofrece hacerse cargo.
 */
export async function informarNovedad(valores: unknown): Promise<ResultadoNovedad> {
  const r = esquemaNovedad.safeParse(valores);
  if (!r.success) return fallo(REVISE, validarCampos(esquemaNovedad, valores));
  const d = r.data;
  const municipio = municipioActivo();
  try {
    const perro = await db.perroComunitario.findFirst({
      where: { id: d.perroId, oculto: false, sector: { municipioId: municipio.id } },
      include: { cuidadoresAutorizados: { where: { activo: true }, include: { persona: true } } },
    });
    if (!perro) return fallo("No encontramos a este perro comunitario.");
    if (!perro.cuidadoresAutorizados.length) return fallo(`${perro.apodo} aún no tiene un vecino a cargo que reciba la novedad. Si tú lo cuidas, puedes hacerte cargo desde su ficha.`);
    const u = await ubicacion(d.localidadId, municipio.id);
    if (!u) return fallo(REVISE, LOCALIDAD_INVALIDA);
    const codigo = await nuevoCodigo(db);
    await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, { ...d, nombre: d.nombre.trim() }, u.ids);
      await tx.novedadComunitario.create({ data: { codigo, perroId: perro.id, tipo: d.tipo, texto: d.texto, personaId: persona.id, loteDemoId: perro.loteDemoId } });
      await tx.historialComunitario.create({ data: { perroId: perro.id, accion: "Novedad recibida de un vecino", detalle: codigo } });
      // A cada cuidador: el texto de la novedad, nunca el contacto de quien la envió.
      for (const c of perro.cuidadoresAutorizados) {
        await notificar(
          tx,
          c.persona,
          `Novedad sobre ${perro.apodo}`,
          `Un vecino informó sobre ${perro.apodo}: ${TIPO_NOVEDAD[d.tipo]}. «${d.texto}» Revísala y márcala como vista en Mis solicitudes, entrando con tu correo.`,
          perro.loteDemoId,
        );
      }
      await notificar(tx, persona, "Recibimos tu novedad", `Le enviamos tu novedad sobre ${perro.apodo} a quien lo cuida.`, perro.loteDemoId);
    });
    return { ok: true, codigo };
  } catch (e) {
    console.error(e);
    return fallo(ERROR_GENERAL);
  }
}

// ───────────── Mascota perdida o encontrada ─────────────

export type CoincidenciaPublica = { id: string; tipo: string; especie: string; color: string; sector: string; fecha: string; motivos: string[] };
/** `conFoto`: se mostrará en el portal (y en Instagram) cuando el municipio lo acepte; sin foto, solo busca coincidencias. */
export type ResultadoPublicacion = { ok: true; codigo: string; id: string; conFoto: boolean; coincidencias: CoincidenciaPublica[] } | Fallo;

/**
 * Aviso de mascota perdida o avistada. Llega como FormData («datos» en JSON y
 * una foto opcional en «foto»); también acepta los campos sueltos. La foto se
 * guarda sin metadatos fuera de la carpeta pública. Un avistamiento puede
 * vincularse a un aviso de pérdida: queda como posible coincidencia, nunca
 * como confirmación de que es el mismo animal.
 */
export async function publicarMascota(entrada: unknown): Promise<ResultadoPublicacion> {
  let valores: unknown = entrada;
  let foto: Blob | null = null;
  if (entrada instanceof FormData) {
    try {
      valores = JSON.parse(String(entrada.get("datos") ?? "{}"));
    } catch {
      return fallo(REVISE);
    }
    const f = entrada.get("foto");
    foto = f instanceof Blob && f.size > 0 ? f : null;
  }
  const r = esquemaPublicacion.safeParse(valores);
  if (!r.success) return fallo(REVISE, validarCampos(esquemaPublicacion, valores));
  const d = r.data;
  const municipio = municipioActivo();

  const fechaEvento = new Date(medianocheEn(d.fechaEvento).getTime() + 12 * 3_600_000);
  const hoy = inicioDeHoy();
  if (fechaEvento.getTime() > hoy.getTime() + 86_400_000 || fechaEvento.getTime() < hoy.getTime() - 60 * 86_400_000) {
    return fallo(REVISE, { fechaEvento: "Indica una fecha de los últimos 60 días." });
  }

  let fotoArchivo: string | null = null;
  let guardado = false;
  try {
    const u = await ubicacion(d.localidadId, municipio.id);
    if (!u) return fallo(REVISE, LOCALIDAD_INVALIDA);
    if (d.especie !== "OTRA" && !(await db.colorCatalogo.findFirst({ where: { municipioId: municipio.id, especie: d.especie, nombre: d.colorPrincipal } }))) {
      return fallo(REVISE, { colorPrincipal: "Elige un color de la lista." });
    }
    // Dónde está resguardada: una localidad de la lista, nunca una dirección.
    const resguardo = d.tipo === "ENCONTRADA" && (d.resguardada === "si" || d.resguardada === "lugar") ? await ubicacion(d.resguardoLocalidadId, municipio.id) : null;
    if (d.tipo === "ENCONTRADA" && (d.resguardada === "si" || d.resguardada === "lugar") && !resguardo) {
      return fallo(REVISE, { resguardoLocalidadId: "Elige una localidad de la lista." });
    }
    // Solo un avistamiento se vincula, y solo a un aviso de pérdida vigente y visible.
    const vinculada = d.tipo === "ENCONTRADA" && d.vinculo ? await publicacion(d.vinculo) : null;
    if (d.vinculo && (!vinculada || vinculada.tipo !== "PERDIDA")) return fallo("El aviso de mascota perdida que elegiste ya no está vigente.");
    if (foto) {
      const g = await guardarFoto(foto, "avisos");
      if (!g.ok) return fallo(REVISE, { foto: g.mensaje });
      fotoArchivo = g.nombre;
    }
    const codigo = await nuevoCodigo(db);
    const creada = await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, d, u.ids);
      const pub = await tx.publicacionMascota.create({
        data: {
          codigo,
          tipo: d.tipo,
          especie: d.especie,
          sexo: d.sexo,
          tamano: d.tamano,
          colorPrincipal: d.colorPrincipal,
          // Lo que solo sabe quien perdió al animal no se guarda en un «Encontré».
          nombreAnimal: d.tipo === "PERDIDA" ? d.nombreAnimal || null : null,
          microchip: d.tipo === "PERDIDA" && d.microchip ? d.microchip : null,
          collar: d.collar,
          colorCollar: d.collar === "SI" ? d.colorCollar || null : null,
          senas: d.senas || null,
          ...u.ids,
          fechaEvento,
          resguardada: d.tipo === "ENCONTRADA" ? d.resguardada !== "no" : null,
          resguardo: resguardo ? (d.resguardada === "lugar" ? "OTRO_LUGAR" : "CON_QUIEN_INFORMA") : null,
          resguardoLocalidadId: resguardo?.localidad.id ?? null,
          resguardoDetalle: resguardo ? d.resguardoDetalle || null : null,
          fotoUrl: fotoArchivo ? `${PREFIJO_FOTO_AVISO}${fotoArchivo}` : null,
          personaId: persona.id,
          vigenteHasta: new Date(Date.now() + 30 * 86_400_000),
        },
      });
      await notificar(tx, persona, "Recibimos tu aviso", `Recibimos tu aviso. Lo publicaremos en el portal y en las redes sociales del municipio cuando lo revisemos, y te avisaremos si aparece una publicación que podría corresponder.`);
      return { pub, persona };
    });
    guardado = true;

    // Coincidencias: se guardan y se avisa a ambas personas, sin afirmar que es el mismo animal.
    // Se compara contra avisos visibles (aceptados y con foto); el nuevo se verá al aceptarlo el municipio.
    const recien = await publicacionPropia(creada.pub.id);
    const coincidencias = recien ? await coincidenciasDe(recien) : [];
    const conFoto = Boolean(fotoArchivo) || Boolean(recien?.animal?.foto);
    for (const c of coincidencias) {
      const [perdidaId, encontradaId] = d.tipo === "PERDIDA" ? [creada.pub.id, c.id] : [c.id, creada.pub.id];
      await db.coincidencia.upsert({
        where: { perdidaId_encontradaId: { perdidaId, encontradaId } },
        create: { perdidaId, encontradaId, puntaje: c.puntaje, motivos: c.motivos.join("; ") },
        update: { puntaje: c.puntaje, motivos: c.motivos.join("; ") },
      });
      const otra = await db.publicacionMascota.findUnique({ where: { id: c.id }, select: { loteDemoId: true, persona: { select: { telefono: true, correo: true } } } });
      if (otra) await notificar(db, otra.persona, "Posible coincidencia", "Hay una publicación nueva que podría corresponder a tu mascota. La verás en el portal cuando el municipio la revise.", otra.loteDemoId);
    }
    if (coincidencias.length > 0) {
      await notificar(db, creada.persona, "Posible coincidencia", "Hay una publicación que podría corresponder a tu mascota. Revísala en el portal.");
    }
    // Vínculo indicado por quien la vio: se registra como posible coincidencia y se avisa a quien la perdió.
    if (vinculada) {
      const motivos = [MOTIVO_AVISTAMIENTO, ...(coincidencias.find((c) => c.id === vinculada.id)?.motivos ?? [])].join("; ");
      await db.coincidencia.upsert({
        where: { perdidaId_encontradaId: { perdidaId: vinculada.id, encontradaId: creada.pub.id } },
        create: { perdidaId: vinculada.id, encontradaId: creada.pub.id, puntaje: coincidencias.find((c) => c.id === vinculada.id)?.puntaje ?? 0, motivos },
        update: { motivos },
      });
      const duena = await db.publicacionMascota.findUnique({ where: { id: vinculada.id }, select: { codigo: true, loteDemoId: true, persona: { select: { telefono: true, correo: true } } } });
      if (duena) await notificar(db, duena.persona, "Alguien informó que vio una mascota", `Una persona informó que vio una mascota que podría ser la de tu aviso ${duena.codigo ?? ""}. Verás el avistamiento en tu aviso cuando el municipio lo revise; no podemos asegurar que sea el mismo animal.`, duena.loteDemoId);
    }

    revalidatePath("/mascotas");
    return {
      ok: true,
      codigo,
      id: creada.pub.id,
      conFoto,
      coincidencias: coincidencias.map((c) => ({
        id: c.id,
        tipo: tipoAviso(c.publicacion.tipo, c.publicacion.sexo),
        especie: ESPECIE[c.publicacion.especie],
        color: c.publicacion.colorPrincipal,
        sector: c.publicacion.sector.nombre,
        fecha: fechaCorta(c.publicacion.fechaEvento),
        motivos: c.motivos,
      })),
    };
  } catch (e) {
    console.error(e);
    // Si el aviso no alcanzó a guardarse, su foto ya no se usa.
    if (fotoArchivo && !guardado) await borrarFoto("avisos", fotoArchivo);
    return fallo(ERROR_GENERAL);
  }
}

// ───────────── Contacto protegido ─────────────

export type ResultadoMensaje = { ok: true } | Fallo;

/** El mensaje pasa por la plataforma: nadie ve el teléfono de la otra persona. */
export async function enviarMensaje(valores: unknown): Promise<ResultadoMensaje> {
  const r = esquemaMensaje.safeParse(valores);
  if (!r.success) return fallo(REVISE, validarCampos(esquemaMensaje, valores));
  const d = r.data;
  try {
    const pub = await db.publicacionMascota.findFirst({
      where: { id: d.publicacionId, estado: "ABIERTA", moderacion: "APROBADA" },
      select: { id: true, codigo: true, loteDemoId: true, persona: { select: { telefono: true, correo: true } } },
    });
    if (!pub) return fallo("Esta publicación ya no está disponible.");
    await db.$transaction(async (tx) => {
      await tx.mensajeProtegido.create({
        data: { publicacionId: pub.id, remitenteNombre: d.nombre, remitenteContacto: d.correo || d.telefono, texto: d.texto },
      });
      await notificar(tx, pub.persona, "Recibiste un mensaje sobre tu publicación", "Una persona te escribió sobre tu publicación. Puedes leer el mensaje y responder a través de la plataforma.", pub.loteDemoId);
    });
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fallo(ERROR_GENERAL);
  }
}

/** «Reportar publicación»: vuelve a la bandeja de moderación. */
export async function reportarPublicacion(id: string): Promise<{ ok: boolean }> {
  try {
    await db.publicacionMascota.updateMany({ where: { id, estado: "ABIERTA", moderacion: "APROBADA" }, data: { moderacion: "PENDIENTE" } });
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false };
  }
}

// ───────────── Postulación a adopción ─────────────

export type ResultadoPostulacion = { ok: true; codigo: string; nombre: string } | Fallo;

export async function postularAdopcion(valores: unknown): Promise<ResultadoPostulacion> {
  const r = esquemaPostulacion.safeParse(valores);
  if (!r.success) return fallo(REVISE, validarCampos(esquemaPostulacion, valores));
  const d = r.data;
  const municipio = municipioActivo();
  try {
    const ficha = await db.fichaAdopcion.findFirst({ where: { id: d.fichaId, ...FICHA_PUBLICA }, include: { animal: { select: { nombre: true } }, proponente: true } });
    if (!ficha) return fallo("Este animal ya no está disponible para adopción.");
    // Por ahora el municipio no da animales en adopción: solo se postula a los que publica un vecino.
    if (!ficha.proponenteId) return fallo("Este animal no recibe postulaciones por ahora.");
    // Animal propuesto por un vecino: la postulación le llega a esa persona y, si le elige, se comparten los contactos.
    if (ficha.proponenteId && d.compartir !== "SI") {
      return fallo(REVISE, { compartir: "Para postular, acepta que compartamos tu contacto con quien lo da en adopción si te elige." });
    }
    const u = await ubicacion(d.localidadId, municipio.id);
    if (!u) return fallo(REVISE, LOCALIDAD_INVALIDA);
    const codigo = await nuevoCodigo(db);
    await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, d, u.ids);
      const repetida = await tx.postulacionAdopcion.findFirst({ where: { fichaId: ficha.id, personaId: persona.id } });
      if (repetida) throw new PostulacionRepetida(repetida.codigo);
      await tx.postulacionAdopcion.create({
        data: {
          codigo,
          fichaId: ficha.id,
          personaId: persona.id,
          tipoVivienda: d.tipoVivienda,
          experienciaPrevia: d.experiencia === "SI",
          otrosAnimales: d.tieneOtros === "SI",
          otrosAnimalesDetalle: d.tieneOtros === "SI" ? d.otrosAnimales : null,
          compartirContacto: Boolean(ficha.proponenteId) && d.compartir === "SI",
          loteDemoId: ficha.loteDemoId,
        },
      });
      const quien = ficha.proponente ? "Quien lo da en adopción revisará tu postulación" : "La revisaremos y te contactaremos";
      await notificar(tx, persona, "Recibimos tu postulación", `Recibimos tu postulación para adoptar a ${ficha.animal.nombre ?? "este animal"}. ${quien}. Puedes ver su estado en Mis solicitudes, entrando con tu correo.`, ficha.loteDemoId);
      // La postulación le llega a quien propuso: la revisa y decide en Mis solicitudes.
      if (ficha.proponente) {
        await notificar(tx, ficha.proponente, "Alguien postuló para adoptar", `Recibiste una postulación para ${ficha.animal.nombre ?? "el animal que diste en adopción"}. Revísala y decide en Mis solicitudes, entrando con tu correo.`, ficha.loteDemoId);
      }
    });
    return { ok: true, codigo, nombre: ficha.animal.nombre ?? "este animal" };
  } catch (e) {
    if (e instanceof PostulacionRepetida) {
      return fallo("Ya postulaste a este animal. Revisa su estado en Mis solicitudes, entrando con tu correo.");
    }
    console.error(e);
    return fallo(ERROR_GENERAL);
  }
}

class PostulacionRepetida extends Error {
  constructor(readonly codigo: string | null) {
    super("Postulación repetida");
  }
}

// ───────────── Dar en adopción (propuesta de un vecino) ─────────────

export type ResultadoPropuesta = { ok: true; codigo: string; corregida: boolean } | Fallo;

/**
 * Propuesta de «Dar en adopción» (sección 7, paso 0). Llega como FormData con
 * los campos en «datos» (JSON) y de 1 a 3 fotos en «foto0», «foto1» y «foto2».
 * Queda en revisión: nada se publica sin aprobación municipal. Con `corregir`
 * (y el RUT de quien la envió) actualiza una propuesta devuelta con
 * correcciones; si trae fotos nuevas, reemplazan a las anteriores.
 * Evita duplicados: la misma foto en otra propuesta abierta, o el mismo nombre
 * y especie propuestos dos veces por la misma persona.
 */
export async function proponerAdopcion(entrada: unknown): Promise<ResultadoPropuesta> {
  let valores: unknown = entrada;
  let fotos: Blob[] = [];
  if (entrada instanceof FormData) {
    try {
      valores = JSON.parse(String(entrada.get("datos") ?? "{}"));
    } catch {
      return fallo(REVISE);
    }
    fotos = [...entrada.entries()].filter(([k, v]) => /^foto\d$/.test(k) && v instanceof Blob && v.size > 0).map(([, v]) => v as Blob);
  }
  const r = esquemaPropuesta.safeParse(valores);
  if (!r.success) return fallo(REVISE, validarCampos(esquemaPropuesta, valores));
  const d = r.data;
  const municipio = municipioActivo();
  const rut = normalizarRut(d.rut)!;
  if (fotos.length > MAXIMO_FOTOS) return fallo(REVISE, { fotos: `Puedes enviar hasta ${MAXIMO_FOTOS} fotos.` });

  // Corregir una propuesta: solo desde Mis solicitudes, con la sesión de quien la hizo.
  const filtro = d.corregir ? await filtroVecino() : null;
  if (d.corregir && !filtro) return fallo(SESION_VENCIDA);
  const anterior = d.corregir && filtro ? await db.fichaAdopcion.findFirst({ where: { codigo: d.corregir, proponente: filtro } }) : null;
  if (d.corregir && !anterior) return fallo(NO_ENCONTRADO);
  if (anterior && anterior.revision !== "CORRECCIONES") return fallo("Esta propuesta ya no espera correcciones. Revisa su estado en Mis solicitudes.");
  if (!anterior && fotos.length === 0) return fallo(REVISE, { fotos: "Agrega al menos una foto del animal." });

  const guardadas: { nombre: string; huella: string }[] = [];
  const descartar = () => Promise.all(guardadas.map((g) => borrarFoto("adopciones", g.nombre)));
  try {
    const u = await ubicacion(d.localidadId, municipio.id);
    if (!u) return fallo(REVISE, LOCALIDAD_INVALIDA);
    for (const f of fotos) {
      const g = await guardarFoto(f, "adopciones");
      if (!g.ok) {
        await descartar();
        return fallo(REVISE, { fotos: g.mensaje });
      }
      guardadas.push(g);
    }

    // Duplicados: solo cuentan las propuestas y fichas abiertas.
    const abiertas = { revision: { in: [...REVISION_ABIERTA] }, estado: { not: "ADOPTADO" as const }, ...(anterior ? { id: { not: anterior.id } } : {}) };
    if (guardadas.length && (await db.fichaAdopcion.count({ where: { ...abiertas, OR: guardadas.map((g) => ({ huellasFotos: { contains: g.huella } })) } }))) {
      await descartar();
      return fallo(REVISE, { fotos: "Una de estas fotos ya está en otra propuesta de adopción. Si es el mismo animal, revisa esa propuesta en Mis solicitudes." });
    }
    if (d.nombreAnimal) {
      const propias = await db.fichaAdopcion.findMany({
        where: { ...abiertas, proponente: { municipioId: municipio.id, rut }, animal: { especie: d.especie } },
        select: { codigo: true, animal: { select: { nombre: true } } },
      });
      const repetida = propias.find((p) => p.animal.nombre && normalizarNombre(p.animal.nombre) === normalizarNombre(d.nombreAnimal));
      if (repetida) {
        await descartar();
        return fallo(`Ya propusiste a ${d.nombreAnimal} para adopción. Revisa su estado en Mis solicitudes.`);
      }
    }

    const codigo = anterior?.codigo ?? (await nuevoCodigo(db));
    const datosFicha = {
      caracter: d.caracter || null,
      conviveConNinos: null,
      conviveConAnimales: null,
      saludTexto: null,
      hogarTexto: null,
      relacion: d.relacion,
      autorizaPublicar: true,
      ...u.ids,
      revision: "PENDIENTE" as const,
      motivoRevision: null,
      ...(guardadas.length ? { fotos: guardadas.map((g) => g.nombre).join(","), huellasFotos: guardadas.map((g) => g.huella).join(",") } : {}),
    };
    await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, d, u.ids);
      const datosAnimal = {
        especie: d.especie,
        nombre: d.nombreAnimal || null,
        sexo: d.sexo,
        edadAproxMeses: mesesDeEdad(d.edad),
        tamano: d.tamano === "NO_SE" ? null : d.tamano,
        esterilizado: siNoNoSe(d.esterilizado),
        vacunasAlDia: siNoNoSe(d.vacunas),
        microchip: siNoNoSe(d.microchip),
        // Dueño registrado solo si la persona declara que es su animal.
        personaId: d.relacion === "PROPIO" ? persona.id : null,
      };
      if (anterior) {
        await tx.animal.update({ where: { id: anterior.animalId }, data: datosAnimal });
        await tx.fichaAdopcion.update({ where: { id: anterior.id }, data: datosFicha });
      } else {
        const animal = await tx.animal.create({ data: datosAnimal });
        await tx.fichaAdopcion.create({ data: { ...datosFicha, animalId: animal.id, codigo, proponenteId: persona.id } });
      }
      await notificar(
        tx,
        persona,
        anterior ? "Recibimos tu propuesta corregida" : "Recibimos tu propuesta de adopción",
        "El equipo municipal revisará tu propuesta antes de publicarla. Puedes ver su estado en Mis solicitudes, entrando con tu correo.",
      );
    });
    // Las fotos reemplazadas en una corrección ya no se usan.
    if (anterior && guardadas.length) await Promise.all(anterior.fotos.split(",").filter(Boolean).map((n) => borrarFoto("adopciones", n)));
    return { ok: true, codigo, corregida: Boolean(anterior) };
  } catch (e) {
    console.error(e);
    await descartar();
    return fallo(ERROR_GENERAL);
  }
}

export type PropuestaParaCorregir =
  | { ok: true; motivo: string; fotos: number; valores: Record<string, string> }
  | { ok: false; mensaje: string };

const esquemaGestionPropuesta = z.object({
  codigo: z.string().trim().toUpperCase().regex(FORMATO_CODIGO),
  accion: z.enum(["encontro_hogar", "retirar"]),
});

/** Con la sesión de quien la hizo, los datos de una propuesta devuelta con correcciones, para editarla. */
export async function propuestaParaCorregir(valores: unknown): Promise<PropuestaParaCorregir> {
  const filtro = await filtroVecino();
  if (!filtro) return { ok: false, mensaje: SESION_VENCIDA };
  const r = esquemaGestionPropuesta.pick({ codigo: true }).safeParse(valores);
  if (!r.success) return { ok: false, mensaje: NO_ENCONTRADO };
  const f = await db.fichaAdopcion.findFirst({
    where: { codigo: r.data.codigo, proponente: filtro },
    include: { animal: true, proponente: true },
  });
  if (!f || !f.proponente) return { ok: false, mensaje: NO_ENCONTRADO };
  if (f.revision !== "CORRECCIONES") return { ok: false, mensaje: "Esta propuesta no espera correcciones. Revisa su estado en Mis solicitudes." };
  const a = f.animal;
  return {
    ok: true,
    motivo: f.motivoRevision ?? "",
    fotos: f.fotos.split(",").filter(Boolean).length,
    valores: {
      corregir: f.codigo ?? "",
      nombreAnimal: a.nombre ?? "",
      especie: a.especie,
      sexo: a.sexo,
      edad: a.edadAproxMeses === null ? "NO_SE" : String(a.edadAproxMeses),
      tamano: a.tamano ?? "NO_SE",
      esterilizado: aSiNoNoSe(a.esterilizado),
      vacunas: aSiNoNoSe(a.vacunasAlDia),
      microchip: aSiNoNoSe(a.microchip),
      // Propuestas anteriores con datos separados: se juntan en el único texto.
      caracter: [f.caracter, f.saludTexto, f.hogarTexto].filter(Boolean).join("\n"),
      relacion: f.relacion ?? "",
      autoriza: "",
      nombre: f.proponente.nombre,
      rut: f.proponente.rut ?? "",
      telefono: f.proponente.telefono ?? "",
      correo: f.proponente.correo ?? "",
      localidadId: f.localidadId ?? "",
    },
  };
}

/**
 * Quien propuso retira su propuesta, o avisa que el animal encontró hogar por
 * otra vía. No cuenta como adopción de la plataforma. Si hay una adopción en
 * curso (postulación aprobada), debe coordinarlo con el municipio.
 */
export async function gestionarPropuesta(valores: unknown): Promise<{ ok: boolean; mensaje: string }> {
  const filtro = await filtroVecino();
  if (!filtro) return { ok: false, mensaje: SESION_VENCIDA };
  const r = esquemaGestionPropuesta.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: NO_ENCONTRADO };
  try {
    const f = await db.fichaAdopcion.findFirst({ where: { codigo: r.data.codigo, proponente: filtro } });
    if (!f) return { ok: false, mensaje: NO_ENCONTRADO };
    if (f.estado === "EN_PROCESO") return { ok: false, mensaje: "Elegiste a una persona para la adopción. Primero indica en las postulaciones si se concretó o no." };
    const cambio = await db.fichaAdopcion.updateMany({
      where: { id: f.id, revision: { in: [...REVISION_ABIERTA] }, estado: "DISPONIBLE" },
      data: { revision: "RETIRADA", cierre: r.data.accion === "encontro_hogar" ? "ENCONTRO_HOGAR" : "YA_NO_APLICA" },
    });
    if (!cambio.count) return { ok: false, mensaje: "Esta propuesta ya no está abierta." };
    revalidatePath("/adoptar");
    revalidatePath("/", "layout");
    return { ok: true, mensaje: r.data.accion === "encontro_hogar" ? "¡Qué buena noticia! Retiramos la ficha del catálogo." : "Retiramos tu propuesta." };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR_GENERAL };
  }
}

// ───────────── Postulaciones a un animal propuesto por un vecino ─────────────
// Las decide quien lo propuso (desde Mis solicitudes, con su sesión), no el
// municipio. Los contactos solo se comparten al elegir a una persona, que lo
// aceptó al postular.

export type PostulacionRecibida = {
  id: string;
  nombre: string;
  sector: string;
  fecha: string;
  estado: Estado;
  vivienda: string;
  experiencia: boolean;
  otrosAnimales: string | null;
  /** Aún sin decidir: se puede elegir o descartar. */
  pendiente: boolean;
  /** Solo de la persona elegida. */
  contacto: string | null;
};

const esquemaPropia = z.object({ codigo: z.string().trim().toUpperCase().regex(FORMATO_CODIGO) });

async function propuestaPropia(valores: unknown) {
  const filtro = await filtroVecino();
  const r = esquemaPropia.safeParse(valores);
  if (!filtro || !r.success) return null;
  return db.fichaAdopcion.findFirst({
    where: { codigo: r.data.codigo, proponente: filtro },
    include: { animal: true, proponente: true },
  });
}

export async function postulacionesDePropuesta(valores: unknown): Promise<{ ok: true; postulaciones: PostulacionRecibida[] } | { ok: false; mensaje: string }> {
  const f = await propuestaPropia(valores);
  if (!f) return { ok: false, mensaje: NO_ENCONTRADO };
  const lista = await db.postulacionAdopcion.findMany({
    where: { fichaId: f.id },
    include: { persona: { include: { sector: true, localidad: true } } },
    orderBy: { creadaEn: "asc" },
  });
  return {
    ok: true,
    postulaciones: lista.map((p) => ({
      id: p.id,
      nombre: p.persona.nombre,
      sector: p.persona.localidad ? `${p.persona.localidad.nombre}, ${p.persona.sector.nombre}` : p.persona.sector.nombre,
      fecha: fechaCorta(p.creadaEn),
      estado: ESTADO_POSTULACION[p.estado],
      vivienda: p.tipoVivienda,
      experiencia: p.experienciaPrevia,
      otrosAnimales: p.otrosAnimales ? (p.otrosAnimalesDetalle ?? "Sí") : null,
      pendiente: p.estado === "RECIBIDA" || p.estado === "EN_EVALUACION",
      contacto: p.estado === "APROBADA" && p.compartirContacto ? [p.persona.telefono, p.persona.correo].filter(Boolean).join(" · ") || "[sin contacto]" : null,
    })),
  };
}

const esquemaDecision = esquemaPropia.extend({ postulacionId: z.string().min(1), accion: z.enum(["elegir", "descartar", "adoptado", "no_concreto"]) });

/**
 * Quien propuso decide: elegir a una persona (se comparten los contactos y la
 * ficha queda en proceso), descartarla, registrar que se concretó la adopción
 * o que no se concretó (la ficha vuelve a estar disponible).
 */
export async function decidirPostulacion(valores: unknown): Promise<{ ok: boolean; mensaje: string }> {
  const r = esquemaDecision.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: NO_ENCONTRADO };
  const d = r.data;
  try {
    const f = await propuestaPropia(d);
    if (!f || f.revision !== "APROBADA") return { ok: false, mensaje: "Esta propuesta no está publicada." };
    const p = await db.postulacionAdopcion.findFirst({ where: { id: d.postulacionId, fichaId: f.id }, include: { persona: true } });
    if (!p) return { ok: false, mensaje: NO_ENCONTRADO };
    const nombre = f.animal.nombre ?? "el animal";
    const pendiente = p.estado === "RECIBIDA" || p.estado === "EN_EVALUACION";
    const yaCambio = { ok: false, mensaje: "Esta postulación ya cambió de estado. Consulta nuevamente." };

    if (d.accion === "elegir") {
      if (!pendiente || f.estado !== "DISPONIBLE") return f.estado === "EN_PROCESO" ? { ok: false, mensaje: "Ya elegiste a una persona. Indica primero si la adopción se concretó o no." } : yaCambio;
      if (!p.compartirContacto) return { ok: false, mensaje: "Esta persona no aceptó compartir su contacto." };
      const pr = f.proponente!;
      await db.$transaction(async (tx) => {
        await tx.postulacionAdopcion.update({ where: { id: p.id }, data: { estado: "APROBADA" } });
        await tx.fichaAdopcion.update({ where: { id: f.id }, data: { estado: "EN_PROCESO" } });
        const contacto = [pr.telefono, pr.correo].filter(Boolean).join(" · ");
        await notificar(tx, p.persona, "Te eligieron para adoptar", `Quien da en adopción a ${nombre} eligió tu postulación. Comunícate con ${pr.nombre}${contacto ? ` (${contacto})` : ""} para conocerse y acordar la adopción.`, p.loteDemoId);
      });
      return { ok: true, mensaje: `Elegiste a ${p.persona.nombre}. Le compartimos tu contacto y ahora ves el suyo en la postulación.` };
    }
    if (d.accion === "descartar") {
      if (!pendiente) return yaCambio;
      await db.$transaction(async (tx) => {
        await tx.postulacionAdopcion.update({ where: { id: p.id }, data: { estado: "NO_SELECCIONADA" } });
        await notificar(tx, p.persona, "Sobre tu postulación", `Gracias por postular para adoptar a ${nombre}. En esta ocasión no fue seleccionada. Te invitamos a conocer a otros animales que buscan hogar.`, p.loteDemoId);
      });
      return { ok: true, mensaje: "Descartamos la postulación y avisamos a la persona." };
    }
    if (p.estado !== "APROBADA") return yaCambio;
    if (d.accion === "adoptado") {
      const persona = await db.persona.findUniqueOrThrow({ where: { id: p.personaId } });
      const compromisos = await concretarAdopcion({ ...p, persona, ficha: f }, municipioActivo().id);
      revalidatePath("/adoptar");
      revalidatePath("/", "layout");
      return { ok: true, mensaje: `¡Qué buena noticia! Registramos la adopción de ${nombre}.${compromisos.length ? ` Quedó registrado el compromiso de ${compromisos.join(" y ")}.` : ""}` };
    }
    // No se concretó: la persona queda no seleccionada y la ficha vuelve a recibir postulaciones.
    await db.$transaction(async (tx) => {
      await tx.postulacionAdopcion.update({ where: { id: p.id }, data: { estado: "NO_SELECCIONADA" } });
      await tx.fichaAdopcion.update({ where: { id: f.id }, data: { estado: "DISPONIBLE" } });
      await notificar(tx, p.persona, "Sobre la adopción", `La adopción de ${nombre} no se concretó. Gracias por tu interés; te invitamos a conocer a otros animales que buscan hogar.`, p.loteDemoId);
    });
    return { ok: true, mensaje: `${nombre} vuelve a estar disponible para recibir postulaciones.` };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR_GENERAL };
  }
}

// ───────────── Mis solicitudes ─────────────

/**
 * `aviso`: publicaciones propias abiertas, que la persona puede confirmar o
 * cerrar; `coincidencias`: avisos de la contraparte aún abiertos, para cerrar
 * ambos de una vez si el reencuentro vino de uno de ellos.
 */
export type CoincidenciaAviso = { id: string; detalle: string };
export type Tramite = {
  codigo: string | null;
  tipo: string;
  detalle: string;
  fecha: string;
  estado: Estado;
  nota?: string;
  aviso?: { tipo: "PERDIDA" | "ENCONTRADA"; coincidencias: CoincidenciaAviso[] };
  /** Invitación prioritaria abierta: la persona puede confirmar interés o decir que no podrá. */
  invitacion?: { responder: boolean };
  /** Cupo propio vigente de un operativo que aún no comienza: la persona puede cancelarlo (o salir de la lista de espera). */
  cupo?: { enEspera: boolean };
  /** Propuesta propia de «Dar en adopción»: qué puede hacer la persona con ella y cuántas postulaciones tiene. */
  propuesta?: { corregir: boolean; cerrar: boolean; postulaciones: number };
  /** Perro comunitario a su cuidado: lo gestiona y lee las novedades pendientes de los vecinos. */
  comunitario?: { id: string; apodo: string; novedades: { codigo: string; tipo: string; texto: string; fecha: string }[] };
};
/** Avisos internos: lo que el municipio le envió (en el prototipo no salen correos ni SMS). */
export type AvisoPersona = { asunto: string; contenido: string; fecha: string };
export type ResultadoConsulta = { ok: true; tramites: Tramite[]; avisos: AvisoPersona[] } | Fallo;

/** Un aviso de la contraparte que todavía se puede cerrar junto con el propio. */
const CONTRAPARTE_ABIERTA = { estado: "ABIERTA" as const, moderacion: { not: "OCULTA" as const } };

const NO_ENCONTRADO = "No encontramos ese trámite entre los tuyos. Vuelve a entrar a Mis solicitudes para ver su estado.";

/** Un cupo se puede cancelar mientras esté vigente y el operativo no haya comenzado. */
function cupoCancelable(c: { estado: string; operativo: { estado: string; fecha: Date } }) {
  return (CUPO_VIGENTE as readonly string[]).includes(c.estado) && ["PUBLICADO", "INSCRIPCIONES_CERRADAS"].includes(c.operativo.estado) && c.operativo.fecha >= inicioDeHoy();
}

const esquemaCancelarCupo = z.object({ codigo: z.string().trim().toUpperCase().regex(FORMATO_CODIGO) });

/**
 * La persona cancela su propio cupo (desde Mis solicitudes, con su sesión). El
 * lugar se libera y pasa a la primera persona de la lista de espera; si venía
 * de una solicitud de servicio, esta vuelve a contar como necesidad.
 */
export async function cancelarMiCupo(valores: unknown): Promise<{ ok: boolean; mensaje: string }> {
  const filtro = await filtroVecino();
  if (!filtro) return { ok: false, mensaje: SESION_VENCIDA };
  const r = esquemaCancelarCupo.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: NO_ENCONTRADO };
  try {
    const c = await db.cupo.findFirst({ where: { codigo: r.data.codigo, persona: filtro }, include: { operativo: true, servicio: true, persona: true } });
    if (!c) return { ok: false, mensaje: NO_ENCONTRADO };
    const persona = c.persona;
    if (!cupoCancelable(c)) return { ok: false, mensaje: "Este cupo ya no se puede cancelar desde aquí. Si necesitas ayuda, comunícate con el municipio." };
    const enEspera = c.estado === "EN_LISTA_ESPERA";
    await db.$transaction(
      async (tx) => {
        const cambio = await tx.cupo.updateMany({ where: { id: c.id, estado: { in: [...CUPO_VIGENTE] } }, data: { estado: "CANCELADO_PERSONA", posicionEspera: null } });
        if (!cambio.count) throw new Error("El cupo ya cambió");
        if (c.solicitudId) await tx.solicitudServicio.update({ where: { id: c.solicitudId }, data: { estado: "RECIBIDA" } });
        // El lugar liberado pasa a la lista de espera (sin invitaciones si están apagadas).
        await procesarOperativo(tx, c.operativoId);
        // Quienes siguen en espera avanzan un lugar: la lista queda numerada desde 1.
        const espera = await tx.cupo.findMany({ where: { operativoId: c.operativoId, servicioId: c.servicioId, estado: "EN_LISTA_ESPERA" }, orderBy: [{ posicionEspera: "asc" }, { creadoEn: "asc" }], select: { id: true } });
        for (const [i, e] of espera.entries()) await tx.cupo.update({ where: { id: e.id }, data: { posicionEspera: i + 1 } });
        await notificar(tx, persona, enEspera ? "Saliste de la lista de espera" : "Cancelamos tu cupo", `${enEspera ? "Saliste de la lista de espera" : "Cancelamos tu cupo"} de ${c.servicio.nombre.toLowerCase()}. Gracias por avisar.`, c.loteDemoId);
      },
      { timeout: 30_000 },
    );
    revalidatePath(`/operativos/${c.operativoId}`);
    revalidatePath("/operativos");
    return { ok: true, mensaje: enEspera ? "Saliste de la lista de espera." : "Cancelamos tu cupo. Gracias por avisar: quedó libre para otra persona." };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: "No pudimos cancelar el cupo. Consulta nuevamente para ver su estado." };
  }
}

/**
 * Los trámites de quien tiene la sesión abierta (entró con el código enviado a
 * su correo). Sin sesión, `sinSesion`: la página pide entrar.
 */
export async function misSolicitudes(): Promise<ResultadoConsulta | { ok: false; sinSesion: true }> {
  const filtro = await filtroVecino();
  if (!filtro) return { ok: false, sinSesion: true };
  return tramitesDe(await db.persona.findMany({ where: filtro, select: { id: true, correo: true, telefono: true } }));
}

/** Cierra la sesión de Mis solicitudes en este navegador. */
export async function salirDeMisSolicitudes(): Promise<void> {
  await cerrarSesionVecino();
}

/**
 * Todos los trámites de las personas registradas con un mismo correo (cada
 * trámite pudo crear su propia persona, con o sin RUT).
 */
async function tramitesDe(personas: { id: string; correo: string | null; telefono: string | null }[]): Promise<ResultadoConsulta> {
  const ids = { in: personas.map((p) => p.id) };
  // Antes de mostrar, se vencen las invitaciones sin respuesta de los operativos donde la persona tiene una.
  for (const { operativoId } of await db.invitacionOperativo.findMany({ where: { personaId: ids, estado: "ENVIADA", venceEn: { lt: new Date() } }, select: { operativoId: true }, distinct: ["operativoId"] })) {
    await db.$transaction((tx) => procesarOperativo(tx, operativoId), { timeout: 30_000 });
  }
  const [solicitudes, cupos, reportes, publicaciones, postulaciones, propuestas, novedades, invitaciones, cuidados, avisos] = await Promise.all([
    db.solicitudServicio.findMany({ where: { personaId: ids }, include: { servicio: true, sector: true, animal: true } }),
    db.cupo.findMany({ where: { personaId: ids }, include: { servicio: true, operativo: { include: { sector: true } } } }),
    db.reporteCiudadano.findMany({ where: { personaId: ids }, include: { sector: true, tipo: true, historial: { orderBy: { creadoEn: "asc" } } } }),
    db.publicacionMascota.findMany({
      where: { personaId: ids },
      include: {
        sector: true,
        coincidenciasPerdida: { where: { estado: { not: "DESCARTADA" }, encontrada: CONTRAPARTE_ABIERTA }, include: { encontrada: { include: { sector: true } } } },
        coincidenciasEncontrada: { where: { estado: { not: "DESCARTADA" }, perdida: CONTRAPARTE_ABIERTA }, include: { perdida: { include: { sector: true } } } },
      },
    }),
    db.postulacionAdopcion.findMany({ where: { personaId: ids }, include: { ficha: { include: { animal: true, proponente: true } } } }),
    db.fichaAdopcion.findMany({ where: { proponenteId: ids }, include: { animal: true, sector: true, _count: { select: { postulaciones: true } } } }),
    db.novedadComunitario.findMany({ where: { personaId: ids }, include: { perro: { include: { animal: true } } } }),
    db.invitacionOperativo.findMany({ where: { personaId: ids }, include: { servicio: true, cupo: true, operativo: { include: { sector: true, lugar: true } } } }),
    db.cuidadorAutorizado.findMany({
      where: { personaId: ids, activo: true },
      include: { perro: { include: { lugar: true, novedades: { where: { estado: "PENDIENTE", cuidadorId: null }, orderBy: { creadaEn: "desc" } } } } },
    }),
    // Notificaciones internas: las que se registraron a su contacto.
    db.notificacion.findMany({
      where: { destinatario: { in: [...new Set(personas.flatMap((p) => [p.correo, p.telefono]).filter((x): x is string => Boolean(x)))] } },
      orderBy: { creadaEn: "desc" },
      take: 8,
    }),
  ]);
  const describir = (o: { tipo: "PERDIDA" | "ENCONTRADA"; especie: string; colorPrincipal: string; sector: { nombre: string }; creadaEn: Date }) =>
    `Aviso de mascota ${TIPO_PUBLICACION[o.tipo].toLowerCase()}: ${ESPECIE[o.especie].toLowerCase()} ${o.colorPrincipal} · ${o.sector.nombre} · ${fechaCorta(o.creadaEn)}`;

  const tramites: (Tramite & { orden: number })[] = [
    ...solicitudes.map((s) => ({
      codigo: s.codigo,
      tipo: "Solicitud de servicio",
      detalle: `${s.servicio.nombre} · ${s.animal.nombre ?? ESPECIE[s.animal.especie]} · ${s.sector.nombre}`,
      fecha: fechaCorta(s.creadaEn),
      estado: ESTADO_SOLICITUD[s.estado],
      nota: s.estado === "RECIBIDA" ? "Nos ayuda a decidir dónde hacer los próximos operativos. Revisa la sección Operativos para inscribirte." : undefined,
      orden: s.creadaEn.getTime(),
    })),
    ...cupos.map((c) => ({
      codigo: c.codigo,
      tipo: "Cupo en operativo",
      detalle: `${c.servicio.nombre} · ${c.operativo.sector.nombre} · ${fechaLarga(c.operativo.fecha)}, ${c.operativo.horaInicio} horas`,
      fecha: fechaCorta(c.creadoEn),
      estado: ESTADO_CUPO[c.estado],
      nota: c.estado === "EN_LISTA_ESPERA" && c.posicionEspera ? `Lugar ${c.posicionEspera} en la lista de espera.` : undefined,
      cupo: cupoCancelable(c) ? { enEspera: c.estado === "EN_LISTA_ESPERA" } : undefined,
      orden: c.creadoEn.getTime(),
    })),
    ...reportes.map((x) => ({
      codigo: x.codigo,
      tipo: "SOS Mascotas",
      detalle: `${x.tipo.nombre} · ${x.sector.nombre}`,
      fecha: fechaCorta(x.creadoEn),
      estado: ESTADO_REPORTE[x.estado],
      nota: notaReporte(x.estado, x.historial.findLast((h) => h.estado === x.estado)?.creadoEn ?? (x.estado === "CERRADO" ? x.cerradoEn : null)),
      orden: x.creadoEn.getTime(),
    })),
    ...publicaciones.map((p) => ({
      codigo: p.codigo,
      tipo: `Mascota ${TIPO_PUBLICACION[p.tipo].toLowerCase()}`,
      detalle: `${ESPECIE[p.especie]} ${p.colorPrincipal} · ${p.sector.nombre}`,
      fecha: fechaCorta(p.creadaEn),
      estado: ESTADO_PUBLICACION[p.estado],
      nota:
        p.moderacion === "OCULTA"
          ? "La publicación fue retirada por moderación."
          : p.estado === "ABIERTA" && p.moderacion === "PENDIENTE"
            ? "En revisión: lo publicaremos en el portal y en las redes sociales del municipio cuando lo revisemos."
          : p.estado === "ABIERTA" && p.vigenciaPedidaEn
            ? `Confirma si tu aviso sigue vigente antes del ${fechaLarga(limiteParaResponder(p.vigenciaPedidaEn))}; si no, lo archivaremos.`
            : undefined,
      aviso:
        p.estado === "ABIERTA" && p.moderacion !== "OCULTA" && p.codigo
          ? {
              tipo: p.tipo,
              coincidencias: [
                ...p.coincidenciasPerdida.map((c) => ({ id: c.id, detalle: describir(c.encontrada) })),
                ...p.coincidenciasEncontrada.map((c) => ({ id: c.id, detalle: describir(c.perdida) })),
              ],
            }
          : undefined,
      orden: p.creadaEn.getTime(),
    })),
    ...postulaciones.map((p) => ({
      codigo: p.codigo,
      tipo: "Postulación a adopción",
      detalle: p.ficha.animal.nombre ?? ESPECIE[p.ficha.animal.especie],
      fecha: fechaCorta(p.creadaEn),
      estado: ESTADO_POSTULACION[p.estado],
      nota: notaPostulacion(p),
      orden: p.creadaEn.getTime(),
    })),
    ...invitaciones.map((i) => {
      const abierta = (INVITACION_ABIERTA as readonly string[]).includes(i.estado);
      const o = i.operativo;
      return {
        codigo: i.codigo,
        tipo: "Invitación prioritaria a operativo",
        detalle: `${i.servicio.nombre} · ${mayuscula(fechaLarga(o.fecha))}, de ${o.horaInicio} a ${o.horaFin} horas · ${o.lugar.nombre} (${o.sector.nombre})`,
        fecha: fechaCorta(i.creadaEn),
        estado: ESTADO_INVITACION[i.estado],
        nota: notaInvitacion(i, o.requisitos),
        invitacion: abierta ? { responder: i.estado === "ENVIADA" } : undefined,
        // Las invitaciones por responder van primero.
        orden: i.estado === "ENVIADA" ? Number.MAX_SAFE_INTEGER : i.creadaEn.getTime(),
      };
    }),
    ...novedades.map((n) => ({
      codigo: n.codigo,
      tipo: "Novedad de perro comunitario",
      detalle: `${TIPO_NOVEDAD[n.tipo]} · ${n.perro.animal.nombre ?? n.perro.apodo}`,
      fecha: fechaCorta(n.creadaEn),
      estado: ESTADO_NOVEDAD[n.estado],
      nota:
        n.estado === "PENDIENTE"
          ? "Se la enviamos a quien lo cuida."
          : n.respuesta
            ? `Respuesta: ${n.respuesta}`
            : undefined,
      orden: n.creadaEn.getTime(),
    })),
    ...cuidados.map((c) => ({
      codigo: c.codigo,
      tipo: "Perro comunitario a tu cuidado",
      detalle: `${c.perro.apodo} · ${c.perro.lugar.nombre}`,
      fecha: fechaCorta(c.creadoEn),
      estado: c.perro.oculto ? { texto: "No se muestra en el portal", tono: "cerrado" as const } : estadoActualizacion(c.perro.ultimoControl),
      nota: c.perro.novedades.length ? `${c.perro.novedades.length === 1 ? "Tiene 1 novedad" : `Tiene ${c.perro.novedades.length} novedades`} de vecinos por leer.` : undefined,
      comunitario: c.perro.oculto
        ? undefined
        : { id: c.perroId, apodo: c.perro.apodo, novedades: c.perro.novedades.map((n) => ({ codigo: n.codigo, tipo: TIPO_NOVEDAD[n.tipo], texto: n.texto, fecha: fechaCorta(n.creadaEn) })) },
      // Con novedades por leer, primero.
      orden: c.perro.novedades.length ? Number.MAX_SAFE_INTEGER - 1 : c.creadoEn.getTime(),
    })),
    ...propuestas.map((f) => {
      const abierta = (REVISION_ABIERTA as readonly string[]).includes(f.revision) && f.estado === "DISPONIBLE";
      return {
        codigo: f.codigo,
        tipo: "Dar en adopción",
        detalle: `${f.animal.nombre ?? ESPECIE[f.animal.especie]}${f.sector ? ` · ${f.sector.nombre}` : ""}`,
        fecha: fechaCorta(f.creadaEn),
        // Publicada: se muestra el estado de la adopción (disponible, en proceso, adoptado).
        estado: f.revision === "APROBADA" ? ESTADO_ADOPCION[f.estado] : REVISION_ADOPCION[f.revision],
        nota: notaPropuesta(f),
        propuesta: { corregir: f.revision === "CORRECCIONES", cerrar: abierta, postulaciones: f.revision === "APROBADA" ? f._count.postulaciones : 0 },
        orden: f.creadaEn.getTime(),
      };
    }),
  ];
  tramites.sort((a, b) => b.orden - a.orden);
  return {
    ok: true,
    tramites: tramites.map(({ orden: _, ...t }) => t),
    avisos: avisos.map((a) => ({ asunto: a.asunto, contenido: a.contenido, fecha: fechaCorta(a.creadaEn) })),
  };
}

/**
 * Postulación a un animal propuesto por un vecino: quién decide y, si le
 * eligieron, el contacto de quien lo da en adopción (ambos lo aceptaron).
 */
function notaPostulacion(p: { estado: string; compartirContacto: boolean; ficha: { proponente: { nombre: string; telefono: string | null; correo: string | null } | null } }): string | undefined {
  const pr = p.ficha.proponente;
  if (!pr) return undefined;
  if (p.estado === "RECIBIDA" || p.estado === "EN_EVALUACION") return "Quien lo da en adopción revisará tu postulación.";
  if (p.estado === "APROBADA" && p.compartirContacto) {
    const contacto = [pr.telefono, pr.correo].filter(Boolean).join(" · ");
    return `Te eligieron. Comunícate con ${pr.nombre}${contacto ? `: ${contacto}` : ""}, para conocerse y acordar la adopción.`;
  }
  return undefined;
}

/** Qué pasa con una propuesta de «Dar en adopción», con el motivo que escribió el municipio. */
function notaPropuesta(f: { revision: string; estado: string; motivoRevision: string | null; cierre: string | null }): string {
  const motivo = f.motivoRevision ? ` ${f.motivoRevision}` : "";
  switch (f.revision) {
    case "PENDIENTE":
      return "El equipo municipal la revisará antes de publicarla.";
    case "CORRECCIONES":
      return `Te pedimos corregir algunos datos antes de publicarla.${motivo}`;
    case "RECHAZADA":
      return `No la publicamos.${motivo}`;
    case "OCULTA":
      return `La retiramos del catálogo.${motivo}`;
    case "RETIRADA":
      return f.cierre === "ENCONTRO_HOGAR" ? "Nos avisaste que encontró hogar. ¡Gracias!" : "La retiraste.";
    default:
      return f.estado === "ADOPTADO"
        ? "Fue adoptado a través de la plataforma."
        : f.estado === "EN_PROCESO"
          ? "Elegiste a una persona: cuando se concrete (o si no se concreta), indícalo en las postulaciones."
          : "Está publicada en el catálogo. Tú recibes las postulaciones: revísalas aquí.";
  }
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Plazo, condiciones y qué significa cada estado de una invitación. */
function notaInvitacion(i: { estado: string; venceEn: Date; motivoCierre: string | null; cupo: { codigo: string } | null }, requisitos: string): string {
  const condiciones = requisitos ? ` Condiciones: ${requisitos}` : "";
  switch (i.estado) {
    case "ENVIADA":
      return `Responde antes del ${fechaLarga(i.venceEn)}, ${hora(i.venceEn)} horas. Confirmar tu interés no reserva el cupo: se lo asignamos según disponibilidad y prioridad.${condiciones}`;
    case "INTERESADA":
      return `Confirmaste tu interés. Te asignaremos el cupo apenas haya uno disponible; te avisaremos.${condiciones}`;
    case "ASIGNADA":
      return `Tu cupo quedó asignado.${condiciones}`;
    case "RECHAZADA":
      return "Nos indicaste que no podrás asistir. Tu solicitud sigue registrada para un próximo operativo.";
    case "VENCIDA":
      return "Venció sin respuesta. Tu solicitud sigue registrada para un próximo operativo.";
    default:
      return `${i.motivoCierre ?? "Se cerró"}. Tu solicitud sigue registrada.`;
  }
}

// ───────────── Responder una invitación prioritaria ─────────────

const esquemaRespuestaInvitacion = z.object({
  codigo: z.string().trim().toUpperCase().regex(FORMATO_CODIGO),
  accion: z.enum(["interes", "rechazo"]),
});

/**
 * Desde Mis solicitudes, con su sesión: «Me interesa» (el sistema asigna el cupo
 * si hay disponibilidad; si no, queda esperando) o «No podré asistir» (su
 * solicitud vuelve a la demanda pendiente y se invita a la siguiente persona).
 */
export async function responderInvitacion(valores: unknown): Promise<{ ok: boolean; mensaje: string }> {
  const filtro = await filtroVecino();
  if (!filtro) return { ok: false, mensaje: SESION_VENCIDA };
  const r = esquemaRespuestaInvitacion.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: NO_ENCONTRADO };
  const ahora = new Date();
  try {
    const i = await db.invitacionOperativo.findFirst({ where: { codigo: r.data.codigo, persona: filtro } });
    if (!i) return { ok: false, mensaje: NO_ENCONTRADO };
    const mensaje = await db.$transaction(async (tx) => {
      // Si venció mientras tanto, se procesa el vencimiento y ya no se puede responder.
      if (i.estado === "ENVIADA" && i.venceEn < ahora) {
        await procesarOperativo(tx, i.operativoId, ahora);
        return null;
      }
      const cambio = await tx.invitacionOperativo.updateMany({
        where: { id: i.id, estado: "ENVIADA" },
        data: r.data.accion === "interes" ? { estado: "INTERESADA", respondidaEn: ahora } : { estado: "RECHAZADA", respondidaEn: ahora, cerradaEn: ahora, motivoCierre: "La persona no podrá asistir" },
      });
      if (!cambio.count) return null;
      if (r.data.accion === "rechazo") {
        await tx.solicitudServicio.update({ where: { id: i.solicitudId }, data: { estado: "RECIBIDA" } });
        await procesarOperativo(tx, i.operativoId, ahora);
        return "Registramos que no podrás asistir. Tu solicitud sigue registrada para un próximo operativo.";
      }
      await asignarInteresadas(tx, i.operativoId, ahora);
      const despues = await tx.invitacionOperativo.findUniqueOrThrow({ where: { id: i.id }, include: { cupo: true } });
      return despues.estado === "ASIGNADA"
        ? "¡Listo! Te asignamos el cupo. Te enviamos los detalles por correo."
        : "Registramos tu interés. Aún no hay un cupo disponible para asignarte: te avisaremos apenas lo haya.";
    }, { timeout: 30_000 });
    if (!mensaje) return { ok: false, mensaje: "Esta invitación ya no se puede responder. Consulta nuevamente para ver su estado." };
    revalidatePath(`/operativos/${i.operativoId}`);
    return { ok: true, mensaje };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR_GENERAL };
  }
}

/** Qué significa el estado de un reporte para quien lo envió, sin prometer más de lo que ocurrió. */
function notaReporte(estado: string, desde: Date | null | undefined): string {
  const fecha = desde ? ` el ${fechaLarga(desde)}` : "";
  if (estado === "EN_REVISION") return `El equipo municipal comenzó a revisarlo${fecha}.`;
  if (estado === "CERRADO") return `El equipo municipal lo revisó y lo cerró${fecha}.`;
  return "Lo recibimos; aún no ha sido revisado.";
}

// ───────────── Cierre y vigencia de un aviso propio ─────────────

const esquemaGestionAviso = z.object({
  codigo: z.string().trim().toUpperCase().regex(FORMATO_CODIGO),
  accion: z.enum(["confirmar", "reencontrada", "no_aplica"]),
  porCoincidencia: z.enum(["SI", "NO", ""]).default(""),
  /** Si el reencuentro vino de una coincidencia concreta: se cierran ambos avisos. */
  coincidenciaId: z.string().trim().default(""),
});

/**
 * Desde Mis solicitudes, con su sesión (sección 6, pasos 5 y 6): confirmar que sigue
 * vigente, marcarlo Reencontrada (registrando si vino de una coincidencia
 * sugerida) o Ya no aplica. Si la persona indica la coincidencia que la
 * ayudó, también se cierra el aviso de la otra persona y se le avisa.
 */
export async function gestionarAviso(valores: unknown): Promise<{ ok: boolean; mensaje: string }> {
  const filtro = await filtroVecino();
  if (!filtro) return { ok: false, mensaje: SESION_VENCIDA };
  const r = esquemaGestionAviso.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: NO_ENCONTRADO };
  const d = r.data;
  try {
    const p = await db.publicacionMascota.findFirst({ where: { codigo: d.codigo, persona: filtro } });
    if (!p) return { ok: false, mensaje: NO_ENCONTRADO };
    if (p.estado !== "ABIERTA") return { ok: false, mensaje: "Este aviso ya no está vigente." };
    const ahora = new Date();

    if (d.accion === "confirmar") {
      await db.publicacionMascota.update({ where: { id: p.id }, data: { vigenteHasta: nuevaVigencia(ahora), vigenciaPedidaEn: null } });
      revalidatePath("/mascotas");
      return { ok: true, mensaje: `Tu aviso sigue publicado hasta el ${fechaLarga(nuevaVigencia(ahora))}.` };
    }
    if (d.accion === "reencontrada" && !d.porCoincidencia) return { ok: false, mensaje: "Indica si te ayudó una posible coincidencia de la plataforma." };

    if (d.accion === "reencontrada" && d.coincidenciaId) {
      const c = await db.coincidencia.findFirst({
        where: {
          id: d.coincidenciaId,
          estado: { not: "DESCARTADA" },
          OR: [
            { perdidaId: p.id, encontrada: CONTRAPARTE_ABIERTA },
            { encontradaId: p.id, perdida: CONTRAPARTE_ABIERTA },
          ],
        },
        include: { perdida: { include: { persona: true } }, encontrada: { include: { persona: true } } },
      });
      if (!c) return { ok: false, mensaje: "El otro aviso ya no está vigente. Consulta nuevamente para ver tus trámites actualizados." };
      const otra = c.perdidaId === p.id ? c.encontrada : c.perdida;
      await db.$transaction(async (tx) => {
        await tx.coincidencia.update({ where: { id: c.id }, data: { estado: "VALIDADA" } });
        await tx.publicacionMascota.updateMany({
          where: { id: { in: [p.id, otra.id] }, estado: "ABIERTA" },
          data: { estado: "REENCONTRADA", resueltaEn: ahora, reencuentroPorCoincidencia: true },
        });
        await notificar(
          tx,
          otra.persona,
          "La mascota volvió a casa",
          "La otra persona confirmó el reencuentro, así que retiramos también tu aviso. Gracias por ayudar. Si no corresponde, escríbenos.",
          otra.loteDemoId,
        );
      });
      revalidatePath("/mascotas");
      revalidatePath("/", "layout");
      return { ok: true, mensaje: "¡Qué buena noticia! Retiramos tu aviso y el de la otra persona, a quien le avisamos." };
    }

    await db.publicacionMascota.update({
      where: { id: p.id },
      data:
        d.accion === "reencontrada"
          ? { estado: "REENCONTRADA", resueltaEn: ahora, reencuentroPorCoincidencia: d.porCoincidencia === "SI" }
          : { estado: "YA_NO_APLICA", resueltaEn: ahora },
    });
    revalidatePath("/mascotas");
    revalidatePath("/", "layout");
    return { ok: true, mensaje: d.accion === "reencontrada" ? "¡Qué buena noticia! Retiramos tu aviso del portal." : "Retiramos tu aviso del portal." };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR_GENERAL };
  }
}

// ───────────── Entrar a Mis solicitudes con un código enviado al correo ─────────────

const MINUTOS_CODIGO = 10;
const INTENTOS_CODIGO = 5;
/** Códigos que se pueden pedir por correo en 15 minutos (evita llenar el correo de alguien). */
const MAXIMO_PEDIDOS = 3;

const huellaCodigo = (personaId: string, codigo: string) => createHash("sha256").update(`${process.env.SESION_SECRETO ?? ""}:${personaId}:${codigo}`).digest("hex");

const MENSAJE_ENVIADO = "Si ese correo está en alguno de tus trámites, te enviamos un código de 6 dígitos. Revisa tu bandeja de entrada y la carpeta de spam; vence en 10 minutos.";

const esquemaCorreoAcceso = z.object({ correo: z.string().trim().refine(correoValido, "Revisa el correo; por ejemplo, nombre@correo.cl.") });

/** La primera persona registrada con ese correo: a ella se asocia el código. */
const personaDelCorreo = (correo: string) => db.persona.findFirst({ where: { municipioId: municipioActivo().id, correo: normalizarCorreo(correo) }, orderBy: { creadaEn: "asc" } });

export type ResultadoPedirCodigo = { ok: true; mensaje: string; codigoPrueba?: string } | { ok: false; mensaje: string; errores?: Errores };

/**
 * Paso 1: la persona escribe su correo y le enviamos un código de un solo uso.
 * Sin envío configurado y fuera de producción, el código se muestra en pantalla
 * (modo de prueba); en producción sin envío, no es posible entrar.
 */
export async function pedirCodigoAcceso(valores: unknown): Promise<ResultadoPedirCodigo> {
  const r = esquemaCorreoAcceso.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: REVISE, errores: { correo: "Revisa el correo; por ejemplo, nombre@correo.cl." } };
  const { estadoCorreo, enviarCorreo } = await import("@/servidor/correo");
  const correoListo = estadoCorreo().configurado;
  const prueba = !correoListo && process.env.NODE_ENV !== "production";
  if (!correoListo && !prueba) return { ok: false, mensaje: "Por ahora no podemos enviar códigos por correo. Intenta más tarde." };
  try {
    const municipio = municipioActivo();
    const persona = await personaDelCorreo(r.data.correo);
    // Misma respuesta exista o no el correo, para no revelar quién tiene trámites.
    if (!persona?.correo) return { ok: true, mensaje: MENSAJE_ENVIADO };
    const recientes = await db.codigoAcceso.count({ where: { personaId: persona.id, creadoEn: { gte: new Date(Date.now() - 15 * 60_000) } } });
    if (recientes >= MAXIMO_PEDIDOS) return { ok: true, mensaje: `${MENSAJE_ENVIADO} Si no te llega, espera unos minutos antes de pedir otro.` };
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await db.codigoAcceso.create({ data: { personaId: persona.id, huella: huellaCodigo(persona.id, codigo), venceEn: new Date(Date.now() + MINUTOS_CODIGO * 60_000) } });
    if (prueba) return { ok: true, mensaje: "Modo de prueba: el envío de correos no está configurado, así que te mostramos el código aquí.", codigoPrueba: codigo };
    const envio = await enviarCorreo(
      {
        para: persona.correo,
        asunto: `Tu código para Mis solicitudes: ${codigo}`,
        texto: `Tu código para entrar a Mis solicitudes es ${codigo}.\n\nVence en ${MINUTOS_CODIGO} minutos y sirve una sola vez. Si no lo pediste, ignora este correo.`,
      },
      municipio.nombreOficial,
    );
    if (!envio.ok) {
      console.error("No se pudo enviar el código de acceso", envio.error);
      return { ok: false, mensaje: "No pudimos enviar el correo. Intenta en unos minutos." };
    }
    return { ok: true, mensaje: MENSAJE_ENVIADO };
  } catch (e) {
    console.error(e);
    return { ok: false, mensaje: ERROR_GENERAL };
  }
}

/** Paso 2: con el correo y el código recibido, abre la sesión y muestra sus trámites. El código sirve una vez. */
export async function entrarConCodigoAcceso(valores: unknown): Promise<ResultadoConsulta> {
  const r = esquemaCorreoAcceso.extend({ codigo: z.string().trim().regex(/^\d{6}$/) }).safeParse(valores);
  if (!r.success) return fallo(REVISE, { codigoCorreo: "Escribe los 6 dígitos del código." });
  const invalido = "El código no es válido o ya venció. Pide uno nuevo.";
  try {
    const persona = await personaDelCorreo(r.data.correo);
    if (!persona) return fallo(invalido);
    const vigente = await db.codigoAcceso.findFirst({ where: { personaId: persona.id, usadoEn: null, venceEn: { gt: new Date() }, intentos: { lt: INTENTOS_CODIGO } }, orderBy: { creadoEn: "desc" } });
    if (!vigente) return fallo(invalido);
    const esperado = Buffer.from(vigente.huella, "hex");
    const recibido = Buffer.from(huellaCodigo(persona.id, r.data.codigo), "hex");
    if (!timingSafeEqual(esperado, recibido)) {
      await db.codigoAcceso.update({ where: { id: vigente.id }, data: { intentos: { increment: 1 } } });
      return fallo(vigente.intentos + 1 >= INTENTOS_CODIGO ? invalido : "El código no coincide. Revísalo e intenta de nuevo.");
    }
    // Un solo uso: si dos pestañas lo intentan a la vez, solo una entra.
    const usado = await db.codigoAcceso.updateMany({ where: { id: vigente.id, usadoEn: null }, data: { usadoEn: new Date() } });
    if (!usado.count) return fallo(invalido);
    await abrirSesionVecino(r.data.correo);
    return tramitesDe(await db.persona.findMany({ where: { municipioId: municipioActivo().id, correo: normalizarCorreo(r.data.correo) }, select: { id: true, correo: true, telefono: true } }));
  } catch (e) {
    console.error(e);
    return fallo(ERROR_GENERAL);
  }
}
