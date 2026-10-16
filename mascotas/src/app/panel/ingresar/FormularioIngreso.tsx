"use client";
import { useActionState } from "react";
import { Boton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import { ingresar } from "@/servidor/panel/sesion";
import formulario from "@/componentes/formulario/formulario.module.css";

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState(ingresar, { error: null, correo: "" });

  return (
    <form action={accion} className={`${formulario.cuerpo} ${formulario.unaColumna}`} noValidate>
      <div className={formulario.campo}>
        <label htmlFor="correo" className={formulario.etiqueta}>
          Correo institucional
        </label>
        <input id="correo" name="correo" type="email" autoComplete="username" defaultValue={estado.correo} className={formulario.control} required />
      </div>
      <div className={formulario.campo}>
        <label htmlFor="contrasena" className={formulario.etiqueta}>
          Contraseña
        </label>
        <input id="contrasena" name="contrasena" type="password" autoComplete="current-password" className={formulario.control} required />
      </div>
      {estado.error && (
        <p className={formulario.mensaje} role="alert">
          <Icono nombre="alerta" tamano={20} />
          {estado.error}
        </p>
      )}
      <div>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </Boton>
      </div>
    </form>
  );
}
