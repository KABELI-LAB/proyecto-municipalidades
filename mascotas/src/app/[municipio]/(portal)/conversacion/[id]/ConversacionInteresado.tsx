"use client";
// La conversación de la persona interesada, con su enlace privado (sin
// registrarse): responde o comparte su contacto. Se actualiza sola mientras está abierta.
import { useState } from "react";
import { Icono } from "@/componentes/Icono";
import { Conversacion } from "@/componentes/portal/Conversacion";
import { useActualizar } from "@/componentes/portal/useActualizar";
import { compartirContactoInteresado, conversacionDeInteresado, escribirComoInteresado, type ConversacionVista } from "@/servidor/portal/conversaciones";
import formulario from "@/componentes/formulario/formulario.module.css";

export function ConversacionInteresado({ id, t, inicial }: { id: string; t: string; inicial: ConversacionVista }) {
  const [c, setC] = useState(inicial);
  const [aviso, setAviso] = useState<string | null>(null);

  // Mensajes nuevos sin recargar: se vuelve a leer la conversación cada 8 segundos.
  useActualizar(() => {
    conversacionDeInteresado(id, t).then((nueva) => nueva && setC(nueva));
  }, 8_000);

  const alTerminar = async (mensaje: string) => {
    setAviso(mensaje);
    const nueva = await conversacionDeInteresado(id, t);
    if (nueva) setC(nueva);
  };

  return (
    <div className={formulario.formulario}>
      {aviso && (
        <p className={formulario.nota} role="status">
          <Icono nombre="check" tamano={20} />
          <span>{aviso}</span>
        </p>
      )}
      <Conversacion
        conversacion={c}
        responder={(texto) => escribirComoInteresado({ id, t, texto })}
        compartir={() => compartirContactoInteresado({ id, t })}
        alTerminar={alTerminar}
      />
    </div>
  );
}
