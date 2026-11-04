import type { Metadata } from "next";
import { Boton } from "@/componentes/Boton";
import { TarjetaAviso } from "@/componentes/portal/TarjetaAviso";
import { avisosVigentes, sectores } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Avisos" };

export default async function PaginaAvisos({ searchParams }: { searchParams: Promise<{ sector?: string }> }) {
  const { sector: clave } = await searchParams;
  const lista = await sectores();
  const sector = lista.find((s) => s.clave === clave);
  const avisos = await avisosVigentes({ sectorId: sector?.id });

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Avisos</h1>
        <p>Comunicados vigentes del programa de tenencia responsable. Un aviso vencido deja de mostrarse.</p>
      </div>

      <details className={estilos.plegable}>
        <summary>Filtrar: {sector?.nombre ?? "Todos los sectores"}</summary>
        <form className={estilos.filtros} method="get" aria-label="Filtrar avisos por sector">
          <label>
            Sector
            <select name="sector" defaultValue={sector?.clave ?? ""}>
              <option value="">Todos los sectores</option>
              {lista.map((s) => (
                <option key={s.id} value={s.clave}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <Boton type="submit" variante="secundario">
            Filtrar
          </Boton>
        </form>
      </details>

      <section className={estilos.seccion} aria-labelledby="lista">
        <h2 id="lista">
          {sector ? `Avisos para ${sector.nombre} y toda la comuna` : "Todos los avisos vigentes"}
        </h2>
        {avisos.length > 0 ? (
          <div className={estilos.grilla}>
            {avisos.map((a) => (
              <TarjetaAviso key={a.id} aviso={a} />
            ))}
          </div>
        ) : (
          <div className={estilos.vacio}>
            <p>No hay avisos vigentes{sector ? ` para ${sector.nombre}` : ""}.</p>
          </div>
        )}
      </section>
    </div>
  );
}
