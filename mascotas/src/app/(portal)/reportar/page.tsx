import type { Metadata } from "next";
import { territorio, tiposReporte } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { FormularioReporte } from "./FormularioReporte";

export const metadata: Metadata = { title: "SOS Mascotas" };

export default async function PaginaReportar({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const [{ tipo }, lista, tipos] = await Promise.all([searchParams, territorio(), tiposReporte()]);
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>SOS Mascotas</h1>
        <p>Cuéntenos qué le pasa al animal.</p>
      </div>
      <FormularioReporte sectores={lista} tipos={tipos} tipoInicial={tipos.some((t) => t.clave === tipo) ? tipo : undefined} />
    </div>
  );
}
