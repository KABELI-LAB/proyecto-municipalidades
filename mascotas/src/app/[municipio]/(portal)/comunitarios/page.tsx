import type { Metadata } from "next";
import { Boton, EnlaceBoton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import { TarjetaComunitario } from "@/componentes/portal/TarjetaComunitario";
import { fotoDeComunitario } from "@/componentes/portal/fotoComunitario";
import { perrosComunitarios, sectores } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Perros comunitarios" };

export default async function PaginaComunitarios({ searchParams }: { searchParams: Promise<{ sector?: string }> }) {
  const f = await searchParams;
  const lista = await sectores();
  const sector = lista.find((s) => s.clave === f.sector);
  const perros = await perrosComunitarios({ sectorId: sector?.id });

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      {/* Una fila: título; a la derecha, el filtro y registrar un perro que cuida la comunidad. */}
      <div className={estilos.barraTitulo}>
        <div className={estilos.cabecera}>
          <h1>Perros comunitarios</h1>
          <p>Los registra y los cuida la comunidad, en lugares públicos.</p>
        </div>
        <div className={estilos.accionesCabecera}>
          <details className={estilos.plegable}>
            <summary>
              <span>
                Filtrar
                <span className={estilos.filtroActivo}>: {sector?.nombre ?? "Todos los sectores"}</span>
              </span>
            </summary>
            <form className={estilos.filtros} method="get" aria-label="Filtrar por sector">
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
          <EnlaceBoton href="/comunitarios/registrar">
            <Icono nombre="huella" tamano={20} />
            Registrar un perro
          </EnlaceBoton>
        </div>
      </div>

      <section className={estilos.seccion} aria-label="Perros comunitarios">
        {perros.length > 0 ? (
          <div className={estilos.grilla}>
            {perros.map((c) => (
              <TarjetaComunitario key={c.id} perro={{ ...c, foto: fotoDeComunitario(c) }} />
            ))}
          </div>
        ) : (
          <div className={estilos.vacio}>
            <p>No hay perros comunitarios registrados en este sector.</p>
            <EnlaceBoton href="/comunitarios/registrar">Registrar un perro</EnlaceBoton>
          </div>
        )}
      </section>
    </div>
  );
}
