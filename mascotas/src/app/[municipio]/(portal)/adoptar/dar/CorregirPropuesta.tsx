"use client";
// Corrección de una propuesta devuelta por el municipio: con la sesión de Mis
// solicitudes (entró con su correo), el mismo formulario con sus datos.
import { useEffect, useState } from "react";
import { EnlaceBoton } from "@/componentes/Boton";
import type { SectorOpcion } from "@/componentes/formulario/Bloques";
import { propuestaParaCorregir } from "@/servidor/portal/acciones";
import formulario from "@/componentes/formulario/formulario.module.css";
import { FormularioPropuesta, PROPUESTA_VACIA } from "./FormularioPropuesta";

export function CorregirPropuesta({ codigo, sectores }: { codigo: string; sectores: SectorOpcion[] }) {
  const [error, setError] = useState<string | null>(null);
  const [cargada, setCargada] = useState<{ valores: typeof PROPUESTA_VACIA; fotos: number; motivo: string } | null>(null);

  useEffect(() => {
    propuestaParaCorregir({ codigo }).then((r) => {
      if (r.ok) setCargada({ valores: { ...PROPUESTA_VACIA, ...r.valores }, fotos: r.fotos, motivo: r.motivo });
      else setError(r.mensaje);
    });
  }, [codigo]);

  if (cargada) return <FormularioPropuesta sectores={sectores} inicial={cargada.valores} correccion={{ fotos: cargada.fotos, motivo: cargada.motivo }} />;
  if (!error) return <p aria-busy="true">Cargando tu propuesta…</p>;

  return (
    <div className={formulario.formulario}>
      <p role="alert">{error}</p>
      <div className={formulario.navegacion}>
        <EnlaceBoton href="/mis-solicitudes">Ir a Mis solicitudes</EnlaceBoton>
      </div>
    </div>
  );
}
