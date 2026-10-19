"use client";
// Conversaciones sobre los avisos y fichas de adopción propios: cada una
// plegada con el nombre de la persona y su último mensaje; al abrirla, la
// conversación completa para responder o compartir el contacto.
import { useState } from "react";
import { Conversacion } from "@/componentes/portal/Conversacion";
import { compartirContactoDueno, escribirComoDueno, type ConversacionVista } from "@/servidor/portal/conversaciones";
import estilos from "./mis-solicitudes.module.css";

type Props = { conversaciones: ConversacionVista[]; alTerminar: (mensaje: string) => void };

export function Conversaciones({ conversaciones, alTerminar }: Props) {
  const [abierta, setAbierta] = useState<string | null>(null);
  return (
    <section aria-labelledby="conversaciones" className={estilos.conversaciones}>
      <h2 id="conversaciones">{conversaciones.length === 1 ? "1 conversación" : `${conversaciones.length} conversaciones`}</h2>
      <p className="nota">Personas que te escribieron sobre tus avisos o adopciones. Ninguno ve el contacto del otro, salvo que lo compartan.</p>
      <ul>
        {conversaciones.map((c) => {
          const ultimo = c.mensajes[c.mensajes.length - 1];
          const pendiente = ultimo && !ultimo.mio;
          return (
            <li key={c.id} className={estilos.tramite}>
              <button type="button" className={estilos.plegable} aria-expanded={abierta === c.id} onClick={() => setAbierta(abierta === c.id ? null : c.id)}>
                <span>
                  <b>{c.con}</b> · {c.sobre}
                </span>
                <span className={estilos.ultimo}>
                  {pendiente ? "Te escribió: " : "Tú: "}«{ultimo?.texto.slice(0, 80)}
                  {ultimo && ultimo.texto.length > 80 ? "…" : ""}»
                </span>
              </button>
              {abierta === c.id && (
                <Conversacion
                  conversacion={c}
                  responder={(texto) => escribirComoDueno({ id: c.id, texto })}
                  compartir={() => compartirContactoDueno({ id: c.id })}
                  alTerminar={alTerminar}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
