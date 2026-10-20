"use client";
// Conversaciones sobre los avisos y fichas de adopción propios. Cada una es una
// tarjeta con quién escribió, sobre qué, su último mensaje, una marca de
// «Mensaje nuevo» si espera respuesta y un botón para abrirla; abierta, se
// responde o se comparte el contacto ahí mismo.
import { useState } from "react";
import { Boton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import { Conversacion } from "@/componentes/portal/Conversacion";
import { compartirContactoDueno, escribirComoDueno, type ConversacionVista } from "@/servidor/portal/conversaciones";
import estilos from "./mis-solicitudes.module.css";

type Props = { conversaciones: ConversacionVista[]; alTerminar: (mensaje: string) => void };

/** Si el último mensaje es de la otra persona: espera tu respuesta. */
export const esperaRespuesta = (c: ConversacionVista) => {
  const ultimo = c.mensajes[c.mensajes.length - 1];
  return Boolean(ultimo && !ultimo.mio);
};

export function Conversaciones({ conversaciones, alTerminar }: Props) {
  const [abierta, setAbierta] = useState<string | null>(null);
  return (
    <section aria-labelledby="conversaciones" className={estilos.conversaciones}>
      <h2 id="conversaciones" className={estilos.tituloIcono}>
        <Icono nombre="mensaje" tamano={28} />
        {conversaciones.length === 1 ? "Tu conversación" : `Tus ${conversaciones.length} conversaciones`}
      </h2>
      <p className="nota">Personas que te escribieron sobre tus avisos o adopciones. Ninguno ve el contacto del otro, salvo que lo compartan.</p>
      <ul>
        {conversaciones.map((c) => {
          const ultimo = c.mensajes[c.mensajes.length - 1];
          const pendiente = esperaRespuesta(c);
          const abiertaAhora = abierta === c.id;
          return (
            <li key={c.id} className={pendiente ? `${estilos.tramite} ${estilos.conversacionNueva}` : estilos.tramite}>
              <div className={estilos.encabezado}>
                <span className={estilos.tipo}>{c.con}</span>
                {pendiente && (
                  <span className={estilos.nuevo}>
                    <Icono nombre="mensaje" tamano={16} />
                    Mensaje nuevo
                  </span>
                )}
              </div>
              <p className={estilos.detalle}>{c.sobre}</p>
              {!abiertaAhora && ultimo && (
                <p className={estilos.ultimo}>
                  {pendiente ? `${c.con}: ` : "Tú: "}«{ultimo.texto.length > 120 ? `${ultimo.texto.slice(0, 117)}…` : ultimo.texto}»
                </p>
              )}
              <div>
                <Boton variante={pendiente && !abiertaAhora ? "primario" : "secundario"} onClick={() => setAbierta(abiertaAhora ? null : c.id)} aria-expanded={abiertaAhora}>
                  <Icono nombre="mensaje" tamano={20} />
                  {abiertaAhora ? "Cerrar conversación" : pendiente ? "Leer y responder" : "Abrir conversación"}
                </Boton>
              </div>
              {abiertaAhora && (
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
