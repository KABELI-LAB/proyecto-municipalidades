"use server";
// Instagram desde el panel, sin bandeja propia: la publicación sale sola al
// aceptar o publicar el contenido; aquí solo se reintenta si falló (y, en
// pruebas, se activa la opción de publicar datos de demostración).
import { revalidatePath } from "next/cache";
import type { Permiso } from "@/dominio/permisos";
import type { TipoRed } from "@/dominio/redes";
import { municipioActivo } from "@/lib/municipio";
import { autorizar } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { difundirEnInstagram } from "@/servidor/redes/servicio";

type Respuesta = { ok: boolean; mensaje: string };

const SIN_PERMISO: Respuesta = { ok: false, mensaje: "Su cuenta no tiene permiso para esta acción." };

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
  return { ok: r.estado === "publicado" || r.estado === "ya-publicado", mensaje: r.mensaje };
}

/** Solo para pruebas: permite publicar en Instagram el contenido de demostración (lleva la marca). */
export async function guardarDemoInstagram(incluir: boolean): Promise<Respuesta> {
  if (!(await autorizar("configurarRedes"))) return SIN_PERMISO;
  await db.municipio.update({ where: { id: municipioActivo().id }, data: { redesIncluirDemo: incluir } });
  revalidatePath("/panel/configuracion");
  return { ok: true, mensaje: incluir ? "El contenido de demostración también se publicará en Instagram, con su marca." : "El contenido de demostración ya no se publicará en Instagram." };
}
