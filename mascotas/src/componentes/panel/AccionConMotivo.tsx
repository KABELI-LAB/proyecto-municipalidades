"use client";
// Acción que exige un motivo escrito (pedir correcciones, rechazar, ocultar):
// el motivo se le muestra a la persona afectada, así que se pide en frases completas.
import { useId, useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import estilos from "./acciones.module.css";
import { useMensaje } from "./Mensajes";

type Respuesta = { ok: boolean; mensaje: string };

type Props = {
  /** Acción de servidor enlazada a su id: recibe el motivo. */
  accion: (motivo: string) => Promise<Respuesta>;
  texto: string;
  /** Qué se le pregunta al funcionario sobre el motivo. */
  pregunta: string;
  textoConfirmar: string;
  /** A quién se le muestra el motivo. */
  nota?: string;
};

export function AccionConMotivo({ accion, texto, pregunta, textoConfirmar, nota = "Se lo mostraremos a quien propuso, tal como lo escriba." }: Props) {
  const id = useId();
  const [abierta, setAbierta] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, iniciar] = useTransition();
  const mostrar = useMensaje();

  const ejecutar = () =>
    iniciar(async () => {
      const r = await accion(motivo);
      mostrar({ ok: r.ok, texto: r.mensaje });
      if (r.ok) setAbierta(false);
    });

  if (!abierta) {
    return (
      <div className={estilos.accion}>
        <Boton variante="secundario" onClick={() => setAbierta(true)}>
          {texto}
        </Boton>
      </div>
    );
  }
  return (
    <div className={estilos.confirmacion} role="group" aria-label={texto}>
      <label htmlFor={id}>{pregunta}</label>
      <textarea id={id} rows={3} maxLength={400} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={estilos.motivo} />
      <p className="nota">{nota}</p>
      <div className={estilos.botones}>
        <Boton variante="primario" onClick={ejecutar} disabled={enviando || motivo.trim().length < 10}>
          {enviando ? "Procesando…" : textoConfirmar}
        </Boton>
        <Boton variante="secundario" onClick={() => setAbierta(false)}>
          Volver
        </Boton>
      </div>
    </div>
  );
}
