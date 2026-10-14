"use client";
// Corrección de una propuesta devuelta por el municipio: primero el RUT (que
// nunca viaja en la dirección) y luego el mismo formulario con sus datos.
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import type { SectorOpcion } from "@/componentes/formulario/Bloques";
import { CampoTexto } from "@/componentes/formulario/Campos";
import { propuestaParaCorregir } from "@/servidor/portal/acciones";
import formulario from "@/componentes/formulario/formulario.module.css";
import { FormularioPropuesta, PROPUESTA_VACIA } from "./FormularioPropuesta";

export function CorregirPropuesta({ codigo, sectores }: { codigo: string; sectores: SectorOpcion[] }) {
  const [rut, setRut] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargada, setCargada] = useState<{ valores: typeof PROPUESTA_VACIA; fotos: number; motivo: string } | null>(null);
  const [cargando, iniciar] = useTransition();

  if (cargada) return <FormularioPropuesta sectores={sectores} inicial={cargada.valores} correccion={{ fotos: cargada.fotos, motivo: cargada.motivo }} />;

  return (
    <form
      className={formulario.formulario}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await propuestaParaCorregir({ rut, codigo });
          if (r.ok) setCargada({ valores: { ...PROPUESTA_VACIA, ...r.valores }, fotos: r.fotos, motivo: r.motivo });
          else setError(r.mensaje);
        });
      }}
    >
      <p>
        Para corregir la propuesta <b>{codigo}</b>, escribe el RUT con que la enviaste.
      </p>
      <CampoTexto id="rut" etiqueta="RUT" valor={rut} alCambiar={setRut} error={error ?? undefined} autoComplete="off" />
      <div className={formulario.navegacion}>
        <Boton type="submit" disabled={cargando || !rut}>
          Continuar
        </Boton>
      </div>
    </form>
  );
}
