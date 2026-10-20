"use client";
// Una conversación protegida, igual para las dos partes: los mensajes como
// burbujas (los tuyos a la derecha), un campo para responder y «Compartir mi
// contacto», que muestra tu correo y teléfono a la otra persona solo si lo
// confirmas. El contacto del otro aparece únicamente si él lo compartió.
import Link from "next/link";
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoArea } from "@/componentes/formulario/Campos";
import { Icono } from "@/componentes/Icono";
import type { ConversacionVista } from "@/servidor/portal/conversaciones";
import estilos from "./conversacion.module.css";

type Accion = (texto?: string) => Promise<{ ok: boolean; mensaje: string; errores?: Record<string, string> }>;

type Props = {
  conversacion: ConversacionVista;
  responder: Accion;
  compartir: Accion;
  /** Tras enviar o compartir: vuelve a leer la conversación. */
  alTerminar: (mensaje: string) => void;
};

export function Conversacion({ conversacion: c, responder, compartir, alTerminar }: Props) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, iniciar] = useTransition();

  const enviar = () =>
    iniciar(async () => {
      const r = await responder(texto);
      if (r.ok) {
        setTexto("");
        setError(undefined);
        alTerminar(r.mensaje);
      } else setError(r.errores?.texto ?? r.mensaje);
    });

  const mostrarContacto = () =>
    iniciar(async () => {
      const r = await compartir();
      setConfirmar(false);
      if (r.ok) alTerminar(r.mensaje);
      else setError(r.mensaje);
    });

  return (
    <div className={estilos.conversacion}>
      <p className={estilos.sobre}>
        Sobre <Link href={c.enlaceSobre}>{c.sobre}</Link>
      </p>

      <ol className={estilos.mensajes} aria-label={`Conversación con ${c.con}`} aria-live="polite">
        {c.mensajes.map((m, i) => (
          <li key={i} className={m.mio ? estilos.mio : estilos.otro}>
            <span className={estilos.autor}>
              {m.mio ? "Tú" : c.con} · <span className="dato">{m.fecha}</span>
            </span>
            <p>{m.texto}</p>
          </li>
        ))}
      </ol>

      {c.contactoDelOtro && (
        <p className={estilos.contacto}>
          <Icono nombre="check" tamano={20} />
          <span>
            <b>{c.con} compartió su contacto:</b> {c.contactoDelOtro}
          </span>
        </p>
      )}

      <CampoArea id={`respuesta-${c.id}`} etiqueta="Tu mensaje" valor={texto} alCambiar={setTexto} error={error} maxLength={500} filas={3} ayuda="No incluyas tu dirección." />
      <div className={estilos.botones}>
        <Boton onClick={enviar} disabled={enviando || texto.trim().length < 2}>
          {enviando ? "Enviando…" : "Enviar"}
        </Boton>
        {!c.compartiMiContacto && !confirmar && (
          <Boton variante="secundario" onClick={() => setConfirmar(true)} disabled={enviando}>
            Compartir mi contacto
          </Boton>
        )}
      </div>
      {c.compartiMiContacto && <p className="nota">Compartiste tu contacto en esta conversación.</p>}
      {confirmar && (
        <div className={estilos.confirmar} role="group" aria-label="Compartir mi contacto">
          <p>Le mostraremos tu correo y tu teléfono a {c.con === "Quien publicó" ? "quien publicó" : c.con}. Hazlo solo si confías en esta persona. ¿Continuar?</p>
          <div className={estilos.botones}>
            <Boton onClick={mostrarContacto} disabled={enviando}>
              Sí, compartir
            </Boton>
            <Boton variante="secundario" onClick={() => setConfirmar(false)} disabled={enviando}>
              Volver
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
