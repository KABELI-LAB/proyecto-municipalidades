// Sesión del panel municipal: contraseñas con scrypt y una cookie firmada
// (HMAC) que guarda solo el id del usuario y el vencimiento. El rol se lee
// siempre desde la base de datos, para que un cambio de rol rija de inmediato.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { inicioDe, puede, type Permiso, type Rol } from "@/dominio/permisos";
import { db } from "@/servidor/db";

const COOKIE = "sesion_panel";
const DURACION_S = 8 * 60 * 60; // una jornada

export { cifrarContrasena, verificarContrasena } from "@/servidor/contrasenas";

// ───────────── Cookie firmada ─────────────

function secreto(): string {
  const s = process.env.SESION_SECRETO;
  if (!s || s.length < 32) throw new Error("Falta SESION_SECRETO en .env (vea .env.example).");
  return s;
}

const firmar = (datos: string) => createHmac("sha256", secreto()).update(datos).digest("base64url");

export async function abrirSesion(usuarioId: string) {
  const datos = Buffer.from(JSON.stringify({ u: usuarioId, exp: Date.now() + DURACION_S * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${datos}.${firmar(datos)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_S,
  });
}

export async function terminarSesion() {
  (await cookies()).delete(COOKIE);
}

function leerCookie(valor: string | undefined): string | null {
  if (!valor) return null;
  const [datos, firma] = valor.split(".");
  if (!datos || !firma) return null;
  const esperada = Buffer.from(firmar(datos));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  try {
    const { u, exp } = JSON.parse(Buffer.from(datos, "base64url").toString()) as { u: string; exp: number };
    return exp > Date.now() ? u : null;
  } catch {
    return null;
  }
}

// ───────────── Usuario actual ─────────────

/** `loteDemoId`: lo que crea una cuenta de demostración pertenece a la demo y se borra con ella. */
export type UsuarioSesion = { id: string; nombre: string; rol: Rol; municipioId: string; loteDemoId: string | null };

export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const id = leerCookie((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const u = await db.usuarioMunicipal.findFirst({ where: { id, activo: true }, select: { id: true, nombre: true, rol: true, municipioId: true, loteDemoId: true } });
  return u ? { ...u, rol: u.rol as Rol } : null;
}

/** Exige sesión y, si se indica, un permiso. Sin sesión lleva a ingresar; sin permiso, a su inicio. */
export async function requerir(permiso?: Permiso): Promise<UsuarioSesion> {
  const u = await usuarioActual();
  if (!u) redirect("/panel/ingresar");
  if (permiso && !puede(u.rol, permiso)) redirect(inicioDe(u.rol));
  return u;
}

/** Para acciones de servidor: devuelve el usuario o null si no tiene el permiso. */
export async function autorizar(permiso: Permiso): Promise<UsuarioSesion | null> {
  const u = await usuarioActual();
  return u && puede(u.rol, permiso) ? u : null;
}
