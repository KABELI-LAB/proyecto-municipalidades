"use client";
// Hacerse cargo de un perro comunitario sin cuidador: con su RUT queda como su
// cuidador y recibe un código para gestionarlo en Mis solicitudes.
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoTexto } from "@/componentes/formulario/Campos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { Icono } from "@/componentes/Icono";
import { hacermeCargo } from "@/servidor/portal/acciones-comunitarios";
import estilos from "@/componentes/formulario/formulario.module.css";

export function FormularioCuidar({ perroId, nombre }: { perroId: string; nombre: string }) {
  const [v, setV] = useState({ nombre: "", rut: "", telefono: "", correo: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const cambiar = (k: keyof typeof v, x: string) => setV((a) => ({ ...a, [k]: x }));

  if (codigo) {
    return (
      <ResultadoTramite titulo={`Quedaste a cargo de ${nombre}`} codigo={codigo}>
        <p>Este código es tu credencial de cuidador: con tu RUT y este código, en Mis solicitudes, puedes actualizar la ficha, anotar que lo viste y leer las novedades de los vecinos.</p>
      </ResultadoTramite>
    );
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      const r = await hacermeCargo({ perroId, ...v });
      if (r.ok) setCodigo(r.codigo ?? "");
      else {
        setErrores(r.errores ?? {});
        setMensaje(r.mensaje);
      }
    });
  };

  return (
    <form className={`${estilos.formulario} ${estilos.formularioCorto}`} onSubmit={enviar} noValidate aria-label={`Hacerme cargo de ${nombre}`}>
      <p>No tiene un vecino a cargo. Si tú lo cuidas, quedarás como su cuidador: actualizarás su ficha y te llegarán las novedades. Tus datos no se publican.</p>
      <div className={estilos.fila}>
        <CampoTexto id="nombre" etiqueta="Nombre y apellido" valor={v.nombre} alCambiar={(x) => cambiar("nombre", x)} error={errores.nombre} autoComplete="name" maxLength={100} />
        <CampoTexto id="rut" etiqueta="RUT" valor={v.rut} alCambiar={(x) => cambiar("rut", x)} error={errores.rut} ayuda="Por ejemplo, 12.345.678-5." maxLength={12} />
      </div>
      <div className={estilos.fila}>
        <CampoTexto id="telefono" etiqueta="Teléfono" tipo="tel" inputMode="tel" autoComplete="tel" valor={v.telefono} alCambiar={(x) => cambiar("telefono", x)} error={errores.telefono} maxLength={20} />
        <CampoTexto id="correo" etiqueta="Correo" tipo="email" inputMode="email" autoComplete="email" valor={v.correo} alCambiar={(x) => cambiar("correo", x)} error={errores.correo} maxLength={120} />
      </div>
      <p className={estilos.ayuda}>Indica al menos un teléfono o un correo: por ahí te llegarán las novedades.</p>
      {mensaje && (
        <p className={estilos.mensaje} role="alert">
          <Icono nombre="alerta" tamano={20} />
          {mensaje}
        </p>
      )}
      <div className={estilos.navegacion}>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Un momento…" : "Hacerme cargo"}
        </Boton>
      </div>
    </form>
  );
}
