"use client";
import type { FormEvent, ReactNode, RefObject } from "react";
import { Boton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import estilos from "./formulario.module.css";

type Props = {
  titulos: readonly string[];
  paso: number;
  tituloRef: RefObject<HTMLHeadingElement | null>;
  mensaje: string | null;
  enviando: boolean;
  alAvanzar: () => void;
  alVolver: () => void;
  alConfirmar: () => void;
  textoConfirmar?: string;
  children: ReactNode;
};

/** Marco común de los trámites: indicador de pasos, contenido y navegación. */
export function MarcoPasos({ titulos, paso, tituloRef, mensaje, enviando, alAvanzar, alVolver, alConfirmar, textoConfirmar = "Confirmar y enviar", children }: Props) {
  const ultimo = paso === titulos.length - 1;

  function alEnviar(e: FormEvent) {
    e.preventDefault();
    if (ultimo) alConfirmar();
    else alAvanzar();
  }

  return (
    <form className={estilos.formulario} onSubmit={alEnviar} noValidate>
      <ol className={estilos.pasos}>
        {titulos.map((t, i) => (
          <li key={t} aria-current={i === paso ? "step" : undefined} data-hecho={i < paso || undefined}>
            <span className={estilos.numeroPaso}>{i < paso ? <Icono nombre="check" tamano={16} /> : i + 1}</span>
            <span className={estilos.tituloPaso}>{t}</span>
          </li>
        ))}
      </ol>

      <h2 ref={tituloRef} tabIndex={-1} className={estilos.encabezadoPaso}>
        <span className={estilos.contadorPaso}>
          Paso {paso + 1} de {titulos.length}
        </span>
        {titulos[paso]}
      </h2>

      <div className={estilos.cuerpo}>{children}</div>

      {mensaje && (
        <p className={estilos.mensaje} role="alert">
          <Icono nombre="alerta" tamano={20} />
          {mensaje}
        </p>
      )}

      <div className={estilos.navegacion}>
        {paso > 0 && (
          <Boton variante="secundario" onClick={alVolver} disabled={enviando}>
            Volver
          </Boton>
        )}
        <Boton type="submit" disabled={enviando}>
          {ultimo ? (enviando ? "Enviando…" : textoConfirmar) : "Continuar"}
        </Boton>
      </div>
    </form>
  );
}

/** Resumen del último paso para que la persona revise antes de confirmar. */
export function Resumen({ filas }: { filas: [string, ReactNode][] }) {
  return (
    <dl className={estilos.resumen}>
      {filas.map(([t, v]) => (
        <div key={t}>
          <dt>{t}</dt>
          <dd>{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
