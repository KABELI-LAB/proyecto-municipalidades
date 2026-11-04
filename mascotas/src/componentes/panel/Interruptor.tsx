"use client";
// Interruptor del sistema de diseño (forms/Switch): texto a la izquierda,
// control a la derecha, 48 px de área táctil. Guarda al cambiar y muestra el
// resultado en el mensaje del panel; si falla, vuelve a su estado anterior.
import { useState, useTransition } from "react";
import estilos from "./Interruptor.module.css";
import { useMensaje } from "./Mensajes";

type Props = {
  id: string;
  etiqueta: string;
  descripcion: string;
  inicial: boolean;
  /** Acción de servidor que guarda el nuevo valor. */
  guardar: (valor: boolean) => Promise<{ ok: boolean; mensaje: string }>;
};

export function Interruptor({ id, etiqueta, descripcion, inicial, guardar }: Props) {
  const [valor, setValor] = useState(inicial);
  const [guardando, iniciar] = useTransition();
  const mostrar = useMensaje();

  const cambiar = (nuevo: boolean) => {
    setValor(nuevo);
    iniciar(async () => {
      const r = await guardar(nuevo);
      if (!r.ok) setValor(!nuevo);
      mostrar({ ok: r.ok, texto: r.mensaje });
    });
  };

  return (
    <label className={estilos.interruptor} htmlFor={id}>
      <span className={estilos.texto}>
        <b>{etiqueta}</b>
        <span id={`${id}-descripcion`}>{descripcion}</span>
      </span>
      <span className={estilos.control}>
        <span className={estilos.estado} aria-hidden="true">
          {valor ? "Encendido" : "Apagado"}
        </span>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={valor}
          disabled={guardando}
          aria-describedby={`${id}-descripcion`}
          onChange={(e) => cambiar(e.target.checked)}
        />
      </span>
    </label>
  );
}
