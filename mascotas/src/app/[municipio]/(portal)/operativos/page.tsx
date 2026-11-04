import type { Metadata } from "next";
import Link from "next/link";
import { Boton, EnlaceBoton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import { TarjetaOperativo } from "@/componentes/portal/TarjetaOperativo";
import { operativosProximos, sectores } from "@/servidor/portal/consultas";
import paginas from "@/estilos/paginas.module.css";
import estilos from "@/componentes/portal/operativos.module.css";

export const metadata: Metadata = { title: "Operativos de tenencia responsable" };

// Responde: ¿qué operativos vienen, dónde y cuándo, y cómo me inscribo?
export default async function PaginaOperativos({ searchParams }: { searchParams: Promise<{ sector?: string }> }) {
  const { sector: claveSector } = await searchParams;
  const lista = await sectores();
  const sector = lista.find((s) => s.clave === claveSector);
  const operativos = await operativosProximos({ sectorId: sector?.id });

  return (
    <div className={`contenedor ${paginas.pagina} ${estilos.paginaCompacta}`}>
      {/* Encabezado en una línea: título y filtro; los operativos se ven de inmediato. */}
      <header className={estilos.barra}>
        <h1 className={estilos.titulo}>
          <Icono nombre="calendario" tamano={28} />
          Operativos de tenencia responsable
        </h1>
        <form className={estilos.filtro} method="get" aria-label="Filtrar operativos por sector">
          <label htmlFor="sector">Sector</label>
          <select id="sector" name="sector" defaultValue={sector?.clave ?? ""}>
            <option value="">Todos los sectores</option>
            {lista.map((s) => (
              <option key={s.id} value={s.clave}>
                {s.nombre}
              </option>
            ))}
          </select>
          <Boton type="submit" variante="secundario">
            Ver
          </Boton>
        </form>
      </header>

      {operativos.length > 0 ? (
        <ul className={estilos.grilla} aria-label="Operativos">
          {operativos.map((o) => (
            <li key={o.id}>
              <TarjetaOperativo operativo={o} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={estilos.vacio}>
          <span className={estilos.vacioIcono} aria-hidden="true">
            <Icono nombre="calendario" tamano={40} />
          </span>
          <h2>{sector ? `Por ahora no hay operativos en ${sector.nombre}` : "Por ahora no hay operativos publicados"}</h2>
          <p>Cuéntanos qué servicio necesitas: nos ayuda a decidir dónde hacer los próximos operativos.</p>
          <EnlaceBoton href="/servicio">Solicitar un servicio</EnlaceBoton>
          {sector && <Link href="/operativos">Ver todos los sectores</Link>}
        </div>
      )}
    </div>
  );
}
