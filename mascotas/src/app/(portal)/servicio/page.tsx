import type { Metadata } from "next";
import { servicios, territorio } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { FormularioServicio } from "./FormularioServicio";

export const metadata: Metadata = { title: "Solicitar un servicio" };

export default async function PaginaServicio() {
  const [listaSectores, listaServicios] = await Promise.all([territorio(), servicios()]);
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Solicitar un servicio</h1>
        <p>
          Cuéntenos qué servicio necesita su animal. Con estas solicitudes decidimos dónde hacer los próximos
          operativos.
        </p>
      </div>
      <FormularioServicio sectores={listaSectores} servicios={listaServicios} />
    </div>
  );
}
