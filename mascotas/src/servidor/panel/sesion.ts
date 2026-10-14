"use server";
import { redirect } from "next/navigation";
import { inicioDe, type Rol } from "@/dominio/permisos";
import { municipioActivo } from "@/lib/municipio";
import { abrirSesion, terminarSesion, verificarContrasena } from "@/servidor/auth";
import { db } from "@/servidor/db";

export type EstadoIngreso = { error: string | null; correo: string };

// Un solo mensaje para correo o contraseña incorrectos: no revela qué cuentas existen.
const INCORRECTO = "El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.";

export async function ingresar(_: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const clave = String(datos.get("contrasena") ?? "");
  if (!correo || !clave) return { error: "Escribe tu correo y tu contraseña.", correo };

  const usuario = await db.usuarioMunicipal.findFirst({ where: { correo, activo: true, municipioId: municipioActivo().id } });
  if (!usuario || !(await verificarContrasena(clave, usuario.hashContrasena))) return { error: INCORRECTO, correo };

  await abrirSesion(usuario.id);
  redirect(inicioDe(usuario.rol as Rol));
}

export async function salir() {
  await terminarSesion();
  redirect("/panel/ingresar");
}
