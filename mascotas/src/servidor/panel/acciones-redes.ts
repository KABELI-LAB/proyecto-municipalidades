"use server";
// Instagram desde el panel, sin bandeja propia: la publicación sale sola al
// aceptar o publicar el contenido (si la publicación automática está
// encendida); aquí se publica a mano o se reintenta si falló, y se guarda la
// configuración (publicación automática y, en pruebas, datos de demostración).
import { revalidatePath } from "next/cache";
import type { Permiso } from "@/dominio/permisos";
import type { TipoRed } from "@/dominio/redes";
import { municipioActivo } from "@/lib/municipio";
import { autorizar } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { difundirEnInstagram } from "@/servidor/redes/servicio";

type Respuesta = { ok: boolean; mensaje: string };

const SIN_PERMISO: Respuesta = { ok: false, mensaje: "Tu cuenta no tiene permiso para esta acción." };

/** Quién puede publicar cada tipo: el mismo rol que publica o acepta el contenido. */
const PERMISO: Record<TipoRed, Permiso> = {
  OPERATIVO: "gestionarOperativos",
  ADOPCION: "gestionarAdopciones",
  PERDIDA: "moderarPublicaciones",
  AVISTADA: "moderarPublicaciones",
};
const RUTA: Record<TipoRed, string> = { OPERATIVO: "/panel/operativos", ADOPCION: "/panel/propuestas", PERDIDA: "/panel/publicaciones", AVISTADA: "/panel/publicaciones" };

/** Publicar (o reintentar) en Instagram un contenido ya publicado en la web. */
export async function publicarEnInstagram(tipo: string, origenId: string): Promise<Respuesta> {
  if (!(tipo in PERMISO)) return { ok: false, mensaje: "Tipo de contenido no válido." };
  const u = await autorizar(PERMISO[tipo as TipoRed]);
  if (!u) return SIN_PERMISO;
  const r = await difundirEnInstagram(tipo as TipoRed, origenId, u.id);
  revalidatePath(RUTA[tipo as TipoRed]);
  revalidatePath("/panel/configuracion");
  return { ok: r.estado === "publicado" || r.estado === "ya-publicado", mensaje: r.mensaje };
}

/** Enciende o apaga la publicación automática en Instagram al aprobar o publicar contenido. */
export async function guardarPublicacionAutomatica(encendida: boolean): Promise<Respuesta> {
  if (!(await autorizar("configurarRedes"))) return SIN_PERMISO;
  await db.municipio.update({ where: { id: municipioActivo().id }, data: { redesPublicarAuto: encendida } });
  revalidatePath("/panel/configuracion");
  return {
    ok: true,
    mensaje: encendida
      ? "Listo: lo que apruebes o publiques también saldrá en Instagram."
      : "Listo: lo que apruebes o publiques saldrá solo en el portal. Puedes publicarlo en Instagram desde aquí.",
  };
}

/** Solo para pruebas: permite publicar en Instagram el contenido de demostración (lleva la marca). */
export async function guardarDemoInstagram(incluir: boolean): Promise<Respuesta> {
  if (!(await autorizar("configurarRedes"))) return SIN_PERMISO;
  await db.municipio.update({ where: { id: municipioActivo().id }, data: { redesIncluirDemo: incluir } });
  revalidatePath("/panel/configuracion");
  return { ok: true, mensaje: incluir ? "El contenido de demostración también se publicará en Instagram, con su marca." : "El contenido de demostración ya no se publicará en Instagram." };
}
