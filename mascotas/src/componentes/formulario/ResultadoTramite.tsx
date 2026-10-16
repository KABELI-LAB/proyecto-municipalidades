"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { EnlaceBoton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import estilos from "./formulario.module.css";

/** `conRut`: false si el trámite se hizo sin RUT (no aparece en Mis solicitudes). */
type Props = { titulo: string; codigo: string; conRut?: boolean; children?: ReactNode };

/** Cierre de todo trámite: código de seguimiento y cómo consultarlo. */
export function ResultadoTramite({ titulo, codigo, conRut = true, children }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <section className={estilos.resultado} aria-labelledby="resultado-titulo">
      <h2 id="resultado-titulo" ref={ref} tabIndex={-1} className={estilos.tituloResultado}>
        <Icono nombre="check" tamano={32} />
        {titulo}
      </h2>
      <div className={estilos.codigo}>
        <span>Tu código de seguimiento</span>
        <strong>{codigo}</strong>
      </div>
      {children}
      <p>
        {conRut
          ? "Guarda este código. Con él y tu RUT puedes revisar el estado en Mis solicitudes. También te lo enviamos por correo o SMS."
          : "Guarda este código. Si necesitamos más información, te escribiremos al contacto que nos dejaste."}
      </p>
      <p className="nota">En este prototipo, el envío por correo o SMS es simulado.</p>
      <div className={estilos.navegacion}>
        {conRut && <EnlaceBoton href="/mis-solicitudes">Ir a Mis solicitudes</EnlaceBoton>}
        <EnlaceBoton href="/" variante={conRut ? "secundario" : "primario"}>
          Volver al inicio
        </EnlaceBoton>
      </div>
    </section>
  );
}
