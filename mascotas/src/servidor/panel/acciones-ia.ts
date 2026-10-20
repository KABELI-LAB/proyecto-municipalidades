"use server";
// Inteligencia artificial desde el panel: administración la enciende o apaga,
// y quien ve los indicadores pide el resumen para el equipo.
import { revalidatePath } from "next/cache";
import { municipioActivo } from "@/lib/municipio";
import { autorizar } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { resumenConIA } from "@/servidor/ia/funciones";
import { iaActiva, iaConfigurada, modeloIA } from "@/servidor/ia/openai";
import { loQuePidenLosVecinos } from "./vecinos";

type Respuesta = { ok: boolean; mensaje: string };

const SIN_PERMISO: Respuesta = { ok: false, mensaje: "Tu cuenta no tiene permiso para esta acción." };

/** Enciende o apaga el uso de inteligencia artificial. */
export async function guardarIaActiva(encendida: boolean): Promise<Respuesta> {
  if (!(await autorizar("configurarRedes"))) return SIN_PERMISO;
  if (encendida && !iaConfigurada()) return { ok: false, mensaje: "Falta configurar OPENAI_API_KEY en el servidor. Pídela a quien administra la plataforma." };
  await db.municipio.update({ where: { id: municipioActivo().id }, data: { iaActiva: encendida } });
  revalidatePath("/panel/configuracion");
  revalidatePath("/panel/vecinos");
  return {
    ok: true,
    mensaje: encendida
      ? "Listo: la inteligencia artificial ya ayuda a Pawni, a las respuestas de Instagram y al resumen del equipo."
      : "Listo: la plataforma ya no usa inteligencia artificial.",
  };
}

/** Escribe un resumen nuevo con las cifras de hoy (solo cifras agrupadas). */
export async function generarResumen(): Promise<Respuesta> {
  if (!(await autorizar("verIndicadores"))) return SIN_PERMISO;
  if (!(await iaActiva())) return { ok: false, mensaje: "La inteligencia artificial está apagada. La enciende administración en Panel › Configuración." };
  const datos = await loQuePidenLosVecinos();
  const resumen = await resumenConIA(datos);
  if (!resumen) return { ok: false, mensaje: "No pudimos escribir el resumen ahora. Inténtalo en unos minutos." };
  // Se guarda la estructura (titular, destacados y recomendaciones) en JSON.
  await db.resumenIA.create({ data: { municipioId: municipioActivo().id, texto: JSON.stringify(resumen), cifras: JSON.stringify(datos.cifras), modelo: modeloIA() } });
  revalidatePath("/panel/vecinos");
  return { ok: true, mensaje: "Listo: resumen actualizado." };
}
