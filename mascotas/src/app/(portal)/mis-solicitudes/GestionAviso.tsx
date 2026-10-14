"use client";
// Acciones sobre un aviso propio en Mis solicitudes: confirmar que sigue
// vigente, marcarlo reencontrado o indicar que ya no aplica. Si hay
// coincidencias abiertas, la persona puede elegir la que la ayudó y así
// también se cierra el aviso de la otra persona.
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoOpciones } from "@/componentes/formulario/Campos";
import { gestionarAviso, type CoincidenciaAviso } from "@/servidor/portal/acciones";
import estilos from "./mis-solicitudes.module.css";

type Props = { rut: string; codigo: string; tipo: "PERDIDA" | "ENCONTRADA"; coincidencias: CoincidenciaAviso[]; alTerminar: (mensaje: string) => void };

// Valor de la opción que elige una coincidencia concreta.
const PREFIJO = "coincidencia:";

export function GestionAviso({ rut, codigo, tipo, coincidencias, alTerminar }: Props) {
  const [paso, setPaso] = useState<"inicio" | "reencuentro" | "no_aplica">("inicio");
  const [porCoincidencia, setPorCoincidencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const enviar = (accion: "confirmar" | "reencontrada" | "no_aplica") =>
    iniciar(async () => {
      const coincidenciaId = porCoincidencia.startsWith(PREFIJO) ? porCoincidencia.slice(PREFIJO.length) : "";
      const r = await gestionarAviso({ rut, codigo, accion, porCoincidencia: coincidenciaId ? "SI" : porCoincidencia, coincidenciaId });
      if (r.ok) alTerminar(r.mensaje);
      else setError(r.mensaje);
    });

  if (paso === "reencuentro") {
    return (
      <div className={estilos.gestion} role="group" aria-label="Registrar reencuentro">
        <CampoOpciones
          id={`coincidencia-${codigo}`}
          etiqueta={coincidencias.length ? "¿Volvió gracias a alguno de estos avisos?" : "¿Te ayudó una posible coincidencia de la plataforma?"}
          valor={porCoincidencia}
          alCambiar={setPorCoincidencia}
          error={error ?? undefined}
          opciones={
            coincidencias.length
              ? [
                  ...coincidencias.map((c) => ({ valor: PREFIJO + c.id, texto: c.detalle })),
                  { valor: "SI", texto: "Sí, por otro aviso de la plataforma" },
                  { valor: "NO", texto: "No, volvió por otra vía" },
                ]
              : [
                  { valor: "SI", texto: "Sí" },
                  { valor: "NO", texto: "No" },
                ]
          }
        />
        {porCoincidencia.startsWith(PREFIJO) && <p className="nota">También retiraremos el aviso de la otra persona y le avisaremos.</p>}
        <div className={estilos.botones}>
          <Boton onClick={() => enviar("reencontrada")} disabled={enviando || !porCoincidencia}>
            Retirar el aviso
          </Boton>
          <Boton variante="secundario" onClick={() => setPaso("inicio")}>
            Volver
          </Boton>
        </div>
      </div>
    );
  }

  if (paso === "no_aplica") {
    return (
      <div className={estilos.gestion} role="group" aria-label="Retirar el aviso">
        <p>Tu aviso dejará de mostrarse en el portal. ¿Quieres retirarlo?</p>
        {error && <p role="alert">{error}</p>}
        <div className={estilos.botones}>
          <Boton onClick={() => enviar("no_aplica")} disabled={enviando}>
            Sí, retirar
          </Boton>
          <Boton variante="secundario" onClick={() => setPaso("inicio")}>
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
        <Boton onClick={() => setPaso("reencuentro")}>{tipo === "PERDIDA" ? "Mi mascota volvió" : "Ya volvió con su familia"}</Boton>
        <Boton variante="secundario" onClick={() => enviar("confirmar")} disabled={enviando}>
          Sigue vigente
        </Boton>
        <Boton variante="secundario" onClick={() => setPaso("no_aplica")}>
          Ya no aplica
        </Boton>
      </div>
    </div>
  );
}
