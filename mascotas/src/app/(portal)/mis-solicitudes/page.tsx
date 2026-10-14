import type { Metadata } from "next";
import estilos from "@/estilos/paginas.module.css";
import { ConsultaSolicitudes } from "./ConsultaSolicitudes";

export const metadata: Metadata = { title: "Mis solicitudes" };

export default function PaginaMisSolicitudes() {
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Mis solicitudes</h1>
        <p>Mira y gestiona tus trámites sin registrarte.</p>
      </div>
      <ConsultaSolicitudes />
    </div>
  );
}
