"use client";
// Cancelar un cupo propio desde Mis solicitudes: el lugar se libera y, si hay
// lista de espera, pasa a la primera persona. Pide confirmación antes.
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { cancelarMiCupo } from "@/servidor/portal/acciones";
import estilos from "./mis-solicitudes.module.css";

type Props = { codigo: string; enEspera: boolean; alTerminar: (mensaje: string) => void };

export function GestionCupo({ codigo, enEspera, alTerminar }: Props) {
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const cancelar = () =>
    iniciar(async () => {
      const r = await cancelarMiCupo({ codigo });
      if (r.ok) alTerminar(r.mensaje);
      else setError(r.mensaje);
    });

  if (confirmar) {
    return (
      <div className={estilos.gestion} role="group" aria-label={enEspera ? "Salir de la lista de espera" : "Cancelar mi cupo"}>
        <p>{enEspera ? "Saldrás de la lista de espera de este operativo. ¿Quieres continuar?" : "Liberaremos tu cupo para otra persona. ¿Quieres cancelarlo?"}</p>
        {error && <p role="alert">{error}</p>}
        <div className={estilos.botones}>
          <Boton onClick={cancelar} disabled={enviando}>
            {enviando ? "Cancelando…" : enEspera ? "Sí, salir de la lista" : "Sí, cancelar mi cupo"}
          </Boton>
          <Boton variante="secundario" onClick={() => setConfirmar(false)} disabled={enviando}>
            Volver
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.gestion}>
      <div className={estilos.botones}>
        <Boton variante="secundario" onClick={() => setConfirmar(true)}>
          {enEspera ? "Salir de la lista de espera" : "Cancelar mi cupo"}
        </Boton>
      </div>
    </div>
  );
}
