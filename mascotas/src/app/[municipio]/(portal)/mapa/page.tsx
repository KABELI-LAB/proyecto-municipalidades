import type { Metadata } from "next";
import Link from "next/link";
import { MapaCiudadano } from "@/componentes/portal/MapaCiudadano";
import { CAPAS_CIUDADANAS, CLAVES_CAPA_CIUDADANA, type CapaMapaCiudadano } from "@/componentes/portal/marcasMapa";
import { mapaCiudadano } from "@/servidor/portal/mapaCiudadano";
import estilos from "@/estilos/paginas.module.css";
import mapa from "./mapa.module.css";

export const metadata: Metadata = { title: "Mapa de la comuna" };

// Responde: ¿qué pasa cerca de mí? Una capa a la vez (CLAUDE.md, principios de
// interfaz); la capa queda en la dirección para compartirla o volver a ella.
export default async function PaginaMapa({ searchParams }: { searchParams: Promise<{ capa?: string }> }) {
  const { capa: pedida } = await searchParams;
  const capa: CapaMapaCiudadano = CLAVES_CAPA_CIUDADANA.includes(pedida as CapaMapaCiudadano) ? (pedida as CapaMapaCiudadano) : "mascotas";
  const datos = await mapaCiudadano(capa);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Mapa de la comuna</h1>
        <p>{CAPAS_CIUDADANAS[capa].explica}</p>
      </div>

      <nav aria-label="Capa del mapa" className={mapa.capas}>
        {CLAVES_CAPA_CIUDADANA.map((c) => (
          <Link key={c} href={`/mapa?capa=${c}`} aria-current={c === capa ? "page" : undefined} replace scroll={false}>
            {CAPAS_CIUDADANAS[c].nombre}
          </Link>
        ))}
      </nav>

      <MapaCiudadano capa={capa} nombreCapa={CAPAS_CIUDADANAS[capa].nombre} localidades={datos.localidades} marcas={datos.marcas} vacio={datos.vacio} nota={datos.nota} />
      <p className="nota">
        {datos.nota} Ubicaciones aproximadas; nunca mostramos direcciones, contactos ni reportes. Más oscuro y más grande: más casos.
      </p>
    </div>
  );
}
