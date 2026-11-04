import type { Metadata } from "next";
import { CLAVES_CAPA, type Capa } from "@/componentes/panel/capasMapa";
import { MapaPanel } from "@/componentes/panel/MapaPanel";
import { puede } from "@/dominio/permisos";
import { requerir } from "@/servidor/auth";
import { datosMapa } from "@/servidor/panel/mapa";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Mapa · Panel municipal" };

// Responde: ¿dónde se concentra la demanda y dónde conviene actuar?
export default async function MapaPanelPagina({ searchParams }: { searchParams: Promise<{ capa?: string }> }) {
  const usuario = await requerir("verInteligencia");
  const { capa } = await searchParams;
  const datos = await datosMapa();
  const inicial: Capa = CLAVES_CAPA.includes(capa as Capa) ? (capa as Capa) : "prioridad";

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Mapa por sectores</h1>
        <p>Dónde se concentra la demanda y dónde conviene actuar.</p>
      </div>
      <MapaPanel datos={datos} capaInicial={inicial} puedeGestionar={puede(usuario.rol, "gestionarOperativos")} />
    </div>
  );
}
