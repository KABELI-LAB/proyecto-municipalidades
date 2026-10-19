"use client";
// Mensajes que recibió un aviso propio: quién escribió (solo su nombre), qué
// dijo y, si aún no se respondió, un campo para responder. La respuesta le
// llega por correo a quien escribió; ninguno ve el contacto del otro.
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoArea } from "@/componentes/formulario/Campos";
import type { MensajeRecibido } from "@/servidor/portal/acciones";
import { responderMensaje } from "@/servidor/portal/acciones";
import estilos from "./mis-solicitudes.module.css";

type Props = { mensajes: MensajeRecibido[]; alTerminar: (mensaje: string) => void };

export function GestionMensajes({ mensajes, alTerminar }: Props) {
  return (
    <div className={estilos.gestion}>
      <h3 className={estilos.subtitulo}>{mensajes.length === 1 ? "1 mensaje para ti" : `${mensajes.length} mensajes para ti`}</h3>
      <ul className={estilos.mensajes}>
        {mensajes.map((m) => (
          <Mensaje key={m.id} mensaje={m} alTerminar={alTerminar} />
        ))}
      </ul>
    </div>
  );
}

function Mensaje({ mensaje: m, alTerminar }: { mensaje: MensajeRecibido; alTerminar: (mensaje: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [enviando, iniciar] = useTransition();

  const enviar = () =>
    iniciar(async () => {
      const r = await responderMensaje({ mensajeId: m.id, texto });
      if (r.ok) alTerminar(r.mensaje);
      else setError(r.errores?.texto ?? r.mensaje);
    });

  return (
    <li className={estilos.mensaje}>
      <p>
        <b>{m.nombre}</b> · {m.fecha}
      </p>
      <p>«{m.texto}»</p>
      {m.respuesta ? (
        <p className={estilos.respuesta}>
          <b>Respondiste:</b> «{m.respuesta}»
        </p>
      ) : abierto ? (
        <div className={estilos.gestion}>
          <CampoArea
            id={`respuesta-${m.id}`}
            etiqueta="Tu respuesta"
            valor={texto}
            alCambiar={setTexto}
            error={error}
            maxLength={500}
            ayuda="Le llegará por correo, sin mostrar tu correo ni tu teléfono. No incluyas tu dirección."
          />
          <div className={estilos.botones}>
            <Boton onClick={enviar} disabled={enviando || texto.trim().length < 5}>
              {enviando ? "Enviando…" : "Enviar respuesta"}
            </Boton>
            <Boton variante="secundario" onClick={() => setAbierto(false)} disabled={enviando}>
              Volver
            </Boton>
          </div>
        </div>
      ) : (
        <div className={estilos.botones}>
          <Boton variante="secundario" onClick={() => setAbierto(true)}>
            Responder
          </Boton>
        </div>
      )}
    </li>
  );
}
