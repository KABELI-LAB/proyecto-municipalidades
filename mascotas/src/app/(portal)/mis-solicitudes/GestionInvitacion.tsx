"use client";
// Responder una invitación prioritaria: «Me interesa» (el sistema asigna el
// cupo si hay disponibilidad) o «No podré asistir» (se invita a otra persona).
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { responderInvitacion } from "@/servidor/portal/acciones";
import estilos from "./mis-solicitudes.module.css";

type Props = { rut: string; codigo: string; alTerminar: (mensaje: string) => void };

export function GestionInvitacion({ rut, codigo, alTerminar }: Props) {
  const [confirmarRechazo, setConfirmarRechazo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const responder = (accion: "interes" | "rechazo") =>
    iniciar(async () => {
      const r = await responderInvitacion({ rut, codigo, accion });
      if (r.ok) alTerminar(r.mensaje);
      else setError(r.mensaje);
    });

  if (confirmarRechazo) {
    return (
      <div className={estilos.gestion} role="group" aria-label="No podré asistir">
        <p>Liberaremos el cupo para otra persona. Su solicitud seguirá registrada para un próximo operativo. ¿Confirma que no podrá asistir?</p>
        {error && <p role="alert">{error}</p>}
        <div className={estilos.botones}>
          <Boton onClick={() => responder("rechazo")} disabled={enviando}>
            Sí, no podré asistir
          </Boton>
          <Boton variante="secundario" onClick={() => setConfirmarRechazo(false)}>
            Volver
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.gestion}>
      {error && <p role="alert">{error}</p>}
      <div className={estilos.botones}>
        <Boton onClick={() => responder("interes")} disabled={enviando}>
          {enviando ? "Enviando…" : "Me interesa"}
        </Boton>
        <Boton variante="secundario" onClick={() => setConfirmarRechazo(true)} disabled={enviando}>
          No podré asistir
        </Boton>
      </div>
    </div>
  );
}
