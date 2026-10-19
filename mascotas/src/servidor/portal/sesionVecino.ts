// Sesión de una vecina o vecino en Mis solicitudes. No hay cuentas ni
// contraseñas: se entra con un código de un solo uso enviado al correo, y la
// sesión queda en una cookie firmada (HMAC) que guarda solo ese correo y el
// vencimiento. Sus trámites son los de todas las personas registradas con ese
// correo en el municipio.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { municipioActivo } from "@/lib/municipio";

const COOKIE = "sesion_vecino";
const DURACION_S = 2 * 60 * 60; // dos horas

/** Correo en minúsculas y sin espacios: así se guarda y así se compara. */
export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();

function secreto(): string {
  const s = process.env.SESION_SECRETO;
  if (!s || s.length < 32) throw new Error("Falta SESION_SECRETO en .env (vea .env.example).");
  return s;
}

const firmar = (datos: string) => createHmac("sha256", secreto()).update(`vecino:${datos}`).digest("base64url");

export async function abrirSesionVecino(correo: string) {
  const datos = Buffer.from(JSON.stringify({ c: normalizarCorreo(correo), exp: Date.now() + DURACION_S * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${datos}.${firmar(datos)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_S,
  });
}

export async function cerrarSesionVecino() {
  (await cookies()).delete(COOKIE);
}

/** El correo de la sesión vigente, o null. */
export async function correoDeSesion(): Promise<string | null> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return null;
  const [datos, firma] = valor.split(".");
  if (!datos || !firma) return null;
  const esperada = Buffer.from(firmar(datos));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  try {
    const { c, exp } = JSON.parse(Buffer.from(datos, "base64url").toString()) as { c: string; exp: number };
    return exp > Date.now() ? c : null;
  } catch {
    return null;
  }
}

/**
 * Filtro de Prisma para «una persona de esta sesión» (por ejemplo,
 * `persona: filtro`), o null si no hay sesión.
 */
export async function filtroVecino(): Promise<{ municipioId: string; correo: string } | null> {
  const correo = await correoDeSesion();
  return correo ? { municipioId: municipioActivo().id, correo } : null;
}

export const SESION_VENCIDA = "Tu sesión venció. Entra de nuevo a Mis solicitudes con tu correo.";
