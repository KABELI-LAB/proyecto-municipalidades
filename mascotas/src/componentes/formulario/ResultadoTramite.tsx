"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { EnlaceBoton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import estilos from "./formulario.module.css";

/**
 * `seguimiento`: false si el trámite se hizo sin correo (por ejemplo, un SOS
 * anónimo): no aparece en Mis solicitudes.
 */
type Props = { titulo: string; seguimiento?: boolean; children?: ReactNode };

/** Cierre de todo trámite: qué sigue y dónde ver su estado. No hay números que guardar. */
export function ResultadoTramite({ titulo, seguimiento = true, children }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <section className={estilos.resultado} aria-labelledby="resultado-titulo">
      <h2 id="resultado-titulo" ref={ref} tabIndex={-1} className={estilos.tituloResultado}>
        <Icono nombre="check" tamano={32} />
        {titulo}
      </h2>
      {children}
      <p>
        {seguimiento
          ? "Te enviamos la confirmación a tu correo. Para ver su estado, entra a Mis solicitudes con tu correo: te enviaremos un código para entrar."
          : "Si necesitamos más información, te escribiremos al contacto que nos dejaste."}
      </p>
      <div className={estilos.navegacion}>
        {seguimiento && <EnlaceBoton href="/mis-solicitudes">Ir a Mis solicitudes</EnlaceBoton>}
        <EnlaceBoton href="/" variante={seguimiento ? "secundario" : "primario"}>
          Volver al inicio
        </EnlaceBoton>
      </div>
    </section>
  );
}
