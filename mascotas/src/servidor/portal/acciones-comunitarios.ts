"use server";
// Perros comunitarios a cargo de vecinos (docs/concepto.md): un vecino registra
// al perro, o se hace cargo de uno sin cuidador, y queda como su cuidador; con
// su RUT y su código lo gestiona desde Mis solicitudes. El municipio no
// interviene: la ficha se publica de inmediato.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PREFIJO_SUBIDA } from "@/componentes/portal/fotoComunitario";
import { FORMATO_CODIGO } from "@/dominio/codigo";
import { TIPO_NOVEDAD } from "@/dominio/comunitarios";
import { siNoNoSe, aSiNoNoSe } from "@/dominio/propuestas";
import { normalizarRut } from "@/dominio/rut";
import { esquemaCuidarComunitario, esquemaDatosComunitario, esquemaRegistroComunitario, validarCampos, type Errores } from "@/lib/esquemas";
import { municipioActivo } from "@/lib/municipio";
import { borrarFoto, guardarFoto } from "@/servidor/archivos";
import { nuevoCodigo } from "@/servidor/codigos";
import { db } from "@/servidor/db";
import { fechaCorta } from "@/servidor/formato";
import { notificar } from "@/servidor/notificaciones";
import { obtenerPersona } from "@/servidor/personas";

type Respuesta = { ok: true; mensaje: string; codigo?: string; id?: string } | { ok: false; mensaje: string; errores?: Errores };
const REVISE = "Revisa los datos marcados.";
const ERROR = "No pudimos guardar el cambio. Intenta nuevamente en unos minutos.";
const NO_CUIDADOR = "No encontramos a un cuidador de este perro con ese RUT y código.";

function revalidar() {
  revalidatePath("/", "layout");
}

/** Lee «datos» (JSON) y la foto opcional «foto» de un FormData. */
function leer(entrada: FormData): { valores: Record<string, unknown>; foto: Blob | null } | null {
  try {
    const valores = JSON.parse(String(entrada.get("datos") ?? "{}"));
    const f = entrada.get("foto");
    return { valores, foto: f instanceof Blob && f.size > 0 ? f : null };
  } catch {
    return null;
  }
}

const datosAnimal = (d: z.infer<typeof esquemaDatosComunitario>) => ({
  sexo: d.sexo,
  tamano: d.tamano === "NO_SE" ? null : d.tamano,
  colorPrincipal: d.colorPrincipal || null,
  rasgos: d.rasgos || null,
  esterilizado: siNoNoSe(d.esterilizado),
  vacunasAlDia: siNoNoSe(d.vacunas),
  microchip: siNoNoSe(d.microchip),
});

const lugarDelMunicipio = (id: string) => db.lugar.findFirst({ where: { id, sector: { municipioId: municipioActivo().id } } });

// ───────────── Registrar ─────────────

/**
 * Un vecino registra a un perro comunitario (FormData: «datos» y «foto»
 * obligatoria). Se publica de inmediato y quien lo registra queda como su
 * cuidador, con un código para gestionarlo.
 */
export async function registrarComunitario(entrada: FormData): Promise<Respuesta> {
  const e = leer(entrada);
  if (!e) return { ok: false, mensaje: REVISE };
  const r = esquemaRegistroComunitario.safeParse(e.valores);
  if (!r.success) return { ok: false, mensaje: REVISE, errores: validarCampos(esquemaRegistroComunitario, e.valores) };
  if (!e.foto) return { ok: false, mensaje: REVISE, errores: { foto: "Agrega una foto: en el portal solo se muestran perros con foto." } };
  const d = r.data;
  const lugar = await lugarDelMunicipio(d.lugarId);
  if (!lugar) return { ok: false, mensaje: REVISE, errores: { lugarId: "Elige un lugar de la lista." } };
  const g = await guardarFoto(e.foto, "comunitarios");
  if (!g.ok) return { ok: false, mensaje: REVISE, errores: { foto: g.mensaje } };
  try {
    const municipio = municipioActivo();
    const { id, codigo } = await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, d, { sectorId: lugar.sectorId, localidadId: lugar.localidadId });
      const animal = await tx.animal.create({ data: { ...datosAnimal(d), especie: "PERRO" } });
      const perro = await tx.perroComunitario.create({
        data: {
          animalId: animal.id,
          apodo: d.apodo,
          lugarId: lugar.id,
          sectorId: lugar.sectorId,
          cuidadores: "",
          fotos: `${PREFIJO_SUBIDA}${g.nombre}`,
          lat: lugar.lat,
          lng: lugar.lng,
          ultimoControl: new Date(),
          fichaRevisadaEn: new Date(),
        },
      });
      const codigo = await nuevoCodigo(tx);
      await tx.cuidadorAutorizado.create({ data: { perroId: perro.id, personaId: persona.id, codigo } });
      await tx.historialComunitario.create({ data: { perroId: perro.id, accion: "Registrado por un vecino", detalle: codigo } });
      await notificar(
        tx,
        persona,
        `Publicamos a ${d.apodo}`,
        `Gracias por registrar a ${d.apodo}. Ya está en el portal. Para actualizar su ficha o ver las novedades que te envíen, entra a Mis solicitudes con tu RUT y el código ${codigo}.`,
      );
      return { id: perro.id, codigo };
    });
    revalidar();
    return { ok: true, mensaje: `Publicamos a ${d.apodo}.`, codigo, id };
  } catch (err) {
    console.error(err);
    await borrarFoto("comunitarios", g.nombre);
    return { ok: false, mensaje: ERROR };
  }
}

/**
 * Un vecino se hace cargo de un perro que no tiene cuidador (por ejemplo, uno
 * cargado antes de que los gestionaran los vecinos). Si ya tiene, no se puede.
 */
export async function hacermeCargo(valores: unknown): Promise<Respuesta> {
  const r = esquemaCuidarComunitario.safeParse(valores);
  if (!r.success) return { ok: false, mensaje: REVISE, errores: validarCampos(esquemaCuidarComunitario, valores) };
  const d = r.data;
  const municipio = municipioActivo();
  const perro = await db.perroComunitario.findFirst({
    where: { id: d.perroId, oculto: false, sector: { municipioId: municipio.id } },
    include: { lugar: true, _count: { select: { cuidadoresAutorizados: { where: { activo: true } } } } },
  });
  if (!perro) return { ok: false, mensaje: "No encontramos a este perro comunitario." };
  if (perro._count.cuidadoresAutorizados) return { ok: false, mensaje: `${perro.apodo} ya tiene un vecino a cargo.` };
  try {
    const codigo = await db.$transaction(async (tx) => {
      const persona = await obtenerPersona(tx, municipio.id, d, { sectorId: perro.sectorId, localidadId: perro.lugar.localidadId });
      const existente = await tx.cuidadorAutorizado.findUnique({ where: { perroId_personaId: { perroId: perro.id, personaId: persona.id } } });
      const c = existente
        ? await tx.cuidadorAutorizado.update({ where: { id: existente.id }, data: { activo: true, revocadoEn: null } })
        : await tx.cuidadorAutorizado.create({ data: { perroId: perro.id, personaId: persona.id, codigo: await nuevoCodigo(tx) } });
      await tx.historialComunitario.create({ data: { perroId: perro.id, accion: "Un vecino se hizo cargo", detalle: c.codigo } });
      await notificar(
        tx,
        persona,
        `Quedó a cargo de ${perro.apodo}`,
        `Gracias por hacerte cargo de ${perro.apodo}. Para actualizar su ficha o ver las novedades que te envíen, entra a Mis solicitudes con tu RUT y el código ${c.codigo}.`,
        perro.loteDemoId,
      );
      return c.codigo;
    });
    revalidar();
    return { ok: true, mensaje: `Quedó a cargo de ${perro.apodo}.`, codigo, id: perro.id };
  } catch (err) {
    console.error(err);
    return { ok: false, mensaje: ERROR };
  }
}

// ───────────── Gestión por su cuidador ─────────────

const esquemaCuidador = z.object({ rut: z.string().trim(), codigo: z.string().trim().toUpperCase().regex(FORMATO_CODIGO) });

/** Cuidador vigente identificado por su RUT y su código; null si no corresponde. */
async function cuidadorPropio(valores: unknown) {
  const r = esquemaCuidador.safeParse(valores);
  const rut = r.success ? normalizarRut(r.data.rut) : null;
  if (!r.success || !rut) return null;
  return db.cuidadorAutorizado.findFirst({
    where: { codigo: r.data.codigo, activo: true, persona: { municipioId: municipioActivo().id, rut }, perro: { oculto: false } },
    include: { perro: { include: { animal: true, lugar: true } }, persona: true },
  });
}

export type PerroACargo = { id: string; apodo: string; novedades: { codigo: string; tipo: string; texto: string; fecha: string }[] };

/**
 * Entrada del cuidador desde la ficha del perro: con su RUT y su código de
 * cuidador, devuelve el perro y sus novedades por leer para gestionarlo ahí mismo.
 */
export async function entrarComoCuidador(valores: unknown): Promise<{ ok: true; perro: PerroACargo } | { ok: false; mensaje: string }> {
  const perroId = z.object({ perroId: z.string().min(1) }).safeParse(valores);
  const c = await cuidadorPropio(valores);
  if (!c || !perroId.success || c.perroId !== perroId.data.perroId) return { ok: false, mensaje: NO_CUIDADOR };
  const novedades = await db.novedadComunitario.findMany({ where: { perroId: c.perroId, estado: "PENDIENTE", cuidadorId: null }, orderBy: { creadaEn: "desc" } });
  return {
    ok: true,
    perro: {
      id: c.perroId,
      apodo: c.perro.animal.nombre ?? c.perro.apodo,
      novedades: novedades.map((n) => ({ codigo: n.codigo, tipo: TIPO_NOVEDAD[n.tipo], texto: n.texto, fecha: fechaCorta(n.creadaEn) })),
    },
  };
}

/** Lo vio hoy: queda como la última revisión, visible en la ficha pública. */
export async function registrarVistoHoy(valores: unknown): Promise<Respuesta> {
  const c = await cuidadorPropio(valores);
  if (!c) return { ok: false, mensaje: NO_CUIDADOR };
  await db.$transaction([
    db.perroComunitario.update({ where: { id: c.perroId }, data: { ultimoControl: new Date(), necesitaAtencion: false } }),
    db.historialComunitario.create({ data: { perroId: c.perroId, accion: "Revisado por su cuidador", publico: true, detalle: c.codigo } }),
  ]);
  revalidar();
  return { ok: true, mensaje: `Anotamos que viste a ${c.perro.apodo} hoy.` };
}

export type FichaParaEditar = { valores: Record<string, string>; lugares: { valor: string; texto: string; grupo: string }[] };

/** Datos actuales de la ficha y la lista de lugares, para editarla. */
export async function fichaParaEditar(valores: unknown): Promise<({ ok: true } & FichaParaEditar) | { ok: false; mensaje: string }> {
  const c = await cuidadorPropio(valores);
  if (!c) return { ok: false, mensaje: NO_CUIDADOR };
  const a = c.perro.animal;
  const lugares = await db.lugar.findMany({
    where: { sector: { municipioId: municipioActivo().id } },
    select: { id: true, nombre: true, sector: { select: { nombre: true } } },
    orderBy: [{ sector: { orden: "asc" } }, { nombre: "asc" }],
  });
  return {
    ok: true,
    valores: {
      apodo: c.perro.apodo,
      lugarId: c.perro.lugarId,
      sexo: a.sexo,
      tamano: a.tamano ?? "NO_SE",
      colorPrincipal: a.colorPrincipal ?? "",
      rasgos: a.rasgos ?? "",
      esterilizado: aSiNoNoSe(a.esterilizado),
      vacunas: aSiNoNoSe(a.vacunasAlDia),
      microchip: aSiNoNoSe(a.microchip),
    },
    lugares: lugares.map((l) => ({ valor: l.id, texto: l.nombre, grupo: `Sector ${l.sector.nombre}` })),
  };
}

/** Su cuidador actualiza la ficha (FormData: «rut», «codigo», «datos» y una foto nueva opcional). */
export async function actualizarFichaComunitario(entrada: FormData): Promise<Respuesta> {
  const c = await cuidadorPropio({ rut: entrada.get("rut"), codigo: entrada.get("codigo") });
  if (!c) return { ok: false, mensaje: NO_CUIDADOR };
  const e = leer(entrada);
  if (!e) return { ok: false, mensaje: REVISE };
  const r = esquemaDatosComunitario.safeParse(e.valores);
  if (!r.success) return { ok: false, mensaje: REVISE, errores: validarCampos(esquemaDatosComunitario, e.valores) };
  const lugar = await lugarDelMunicipio(r.data.lugarId);
  if (!lugar) return { ok: false, mensaje: REVISE, errores: { lugarId: "Elige un lugar de la lista." } };
  let nueva: string | null = null;
  if (e.foto) {
    const g = await guardarFoto(e.foto, "comunitarios");
    if (!g.ok) return { ok: false, mensaje: REVISE, errores: { foto: g.mensaje } };
    nueva = g.nombre;
  }
  try {
    await db.$transaction([
      db.animal.update({ where: { id: c.perro.animalId }, data: datosAnimal(r.data) }),
      db.perroComunitario.update({
        where: { id: c.perroId },
        data: {
          apodo: r.data.apodo,
          lugarId: lugar.id,
          sectorId: lugar.sectorId,
          lat: lugar.lat,
          lng: lugar.lng,
          fichaRevisadaEn: new Date(),
          fichaRevisadaPorId: null,
          ...(nueva ? { fotos: `${PREFIJO_SUBIDA}${nueva}` } : {}),
        },
      }),
      db.historialComunitario.create({ data: { perroId: c.perroId, accion: "Ficha actualizada por su cuidador", detalle: c.codigo } }),
    ]);
  } catch (err) {
    console.error(err);
    if (nueva) await borrarFoto("comunitarios", nueva);
    return { ok: false, mensaje: ERROR };
  }
  // La foto reemplazada ya no se usa.
  const vieja = c.perro.fotos.split(",").find((x) => x.startsWith(PREFIJO_SUBIDA));
  if (nueva && vieja) await borrarFoto("comunitarios", vieja.slice(PREFIJO_SUBIDA.length));
  revalidar();
  return { ok: true, mensaje: "Guardamos los cambios de la ficha." };
}

/** Ya no está en su lugar (se fue, murió o fue adoptado): la ficha deja de mostrarse. */
export async function darDeBajaComunitario(valores: unknown): Promise<Respuesta> {
  const c = await cuidadorPropio(valores);
  if (!c) return { ok: false, mensaje: NO_CUIDADOR };
  await db.$transaction([
    db.perroComunitario.update({ where: { id: c.perroId }, data: { oculto: true } }),
    db.historialComunitario.create({ data: { perroId: c.perroId, accion: "Dado de baja por su cuidador", detalle: c.codigo } }),
  ]);
  revalidar();
  return { ok: true, mensaje: `${c.perro.apodo} ya no se muestra en el portal.` };
}

/** El cuidador marca como vista una novedad que le envió un vecino; se le avisa a quien la envió. */
export async function marcarNovedadVista(valores: unknown): Promise<Respuesta> {
  const c = await cuidadorPropio(valores);
  if (!c) return { ok: false, mensaje: NO_CUIDADOR };
  const novedad = z.object({ novedad: z.string().trim().toUpperCase().regex(FORMATO_CODIGO) }).safeParse(valores);
  if (!novedad.success) return { ok: false, mensaje: "No encontramos esa novedad." };
  const n = await db.novedadComunitario.findFirst({ where: { codigo: novedad.data.novedad, perroId: c.perroId, estado: "PENDIENTE" }, include: { persona: true } });
  if (!n) return { ok: false, mensaje: "Esta novedad ya estaba marcada como vista." };
  await db.$transaction(async (tx) => {
    await tx.novedadComunitario.update({ where: { id: n.id }, data: { estado: "ACEPTADA", revisadaEn: new Date() } });
    await tx.historialComunitario.create({ data: { perroId: c.perroId, accion: "Novedad vista por su cuidador", detalle: `${n.codigo} · ${TIPO_NOVEDAD[n.tipo]}` } });
    await notificar(tx, n.persona, "Tu novedad llegó", `Quien cuida a ${c.perro.apodo} vio tu novedad ${n.codigo}. Gracias por avisar.`, n.loteDemoId);
  });
  revalidar();
  return { ok: true, mensaje: "Marcamos la novedad como vista y avisamos a quien la envió." };
}
