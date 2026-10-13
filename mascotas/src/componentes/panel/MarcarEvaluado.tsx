"use client";
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { marcarEvaluado } from "@/servidor/panel/acciones-sectores";

/** Registra que la recomendación se evaluó (queda en el historial del sector). */
export function MarcarEvaluado({ sectorId }: { sectorId: string }) {
  const [hecho, setHecho] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  if (hecho) return <p role="status">{hecho}</p>;
  return (
    <Boton
      variante="secundario"
      disabled={enviando}
      onClick={() =>
        iniciar(async () => {
          const r = await marcarEvaluado(sectorId);
          setHecho(r.ok ? "Registramos que la recomendación fue evaluada." : r.mensaje);
        })
      }
    >
      Marcar como evaluado
    </Boton>
  );
}
