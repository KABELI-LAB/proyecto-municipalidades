"use client";
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import estilos from "./acciones.module.css";
import { useMensaje } from "./Mensajes";

type Respuesta = { ok: boolean; mensaje: string };

type Props = {
  /** Acción de servidor ya enlazada a sus argumentos (accion.bind(null, id)). */
  accion: () => Promise<Respuesta>;
  texto: string;
  variante?: "primario" | "secundario";
  /** Si se indica, pide confirmación con este texto antes de ejecutar. */
  confirmar?: string;
  textoConfirmar?: string;
};

export function BotonAccion({ accion, texto, variante = "secundario", confirmar, textoConfirmar = "Sí, continuar" }: Props) {
  const [preguntando, setPreguntando] = useState(false);
  const [enviando, iniciar] = useTransition();
  const mostrar = useMensaje();

  const ejecutar = () =>
    iniciar(async () => {
      setPreguntando(false);
      const r = await accion();
      mostrar({ ok: r.ok, texto: r.mensaje });
    });

  return (
    <div className={estilos.accion}>
      {preguntando ? (
        <div className={estilos.confirmacion} role="group" aria-label={`Confirmar: ${texto}`}>
          <p>{confirmar}</p>
          <div className={estilos.botones}>
            <Boton variante="primario" onClick={ejecutar} disabled={enviando}>
              {textoConfirmar}
            </Boton>
            <Boton variante="secundario" onClick={() => setPreguntando(false)}>
              Volver
            </Boton>
          </div>
        </div>
      ) : (
        <Boton variante={variante} disabled={enviando} onClick={() => (confirmar ? setPreguntando(true) : ejecutar())}>
          {enviando ? "Procesando…" : texto}
        </Boton>
      )}
    </div>
  );
}
