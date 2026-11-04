import type { Metadata } from "next";
import { Boton, EnlaceBoton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import { TarjetaMascota } from "@/componentes/portal/TarjetaMascota";
import { ESPECIE, TIPO_PUBLICACION } from "@/dominio/etiquetas";
import { idsConCoincidencia, publicaciones, sectores } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Mascotas perdidas y avistadas" };

type Filtros = { tipo?: string; especie?: string; sector?: string };

export default async function PaginaMascotas({ searchParams }: { searchParams: Promise<Filtros> }) {
  const f = await searchParams;
  const lista = await sectores();
  const sector = lista.find((s) => s.clave === f.sector);
  const tipo = f.tipo === "PERDIDA" || f.tipo === "ENCONTRADA" ? f.tipo : undefined;
  const especie = f.especie === "PERRO" || f.especie === "GATO" || f.especie === "OTRA" ? f.especie : undefined;
  const [resultados, conCoincidencia] = await Promise.all([publicaciones({ tipo, especie, sectorId: sector?.id }), idsConCoincidencia()]);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      {/* Una sola fila: título a la izquierda; a la derecha, el filtro y un solo
          botón (el mismo formulario sirve para perdidas y avistadas). */}
      <div className={estilos.barraTitulo}>
        <h1>Mascotas perdidas y avistadas</h1>
        <div className={estilos.accionesCabecera}>
          <details className={estilos.plegable}>
            <summary>
              <span>
                Filtrar
                <span className={estilos.filtroActivo}>: {[tipo ? TIPO_PUBLICACION[tipo] + "s" : "Perdidas y avistadas", especie ? ESPECIE[especie] : null, sector?.nombre].filter(Boolean).join(" · ")}</span>
              </span>
            </summary>
            <form className={estilos.filtros} method="get" aria-label="Buscar publicaciones">
              <label>
                Tipo
                <select name="tipo" defaultValue={tipo ?? ""}>
                  <option value="">Perdidas y avistadas</option>
                  <option value="PERDIDA">Perdidas</option>
                  <option value="ENCONTRADA">Avistadas</option>
                </select>
              </label>
              <label>
                Especie
                <select name="especie" defaultValue={especie ?? ""}>
                  <option value="">Todas</option>
                  {Object.entries(ESPECIE).map(([valor, texto]) => (
                    <option key={valor} value={valor}>
                      {texto}
                    </option>
                  ))}
                </select>
              </label>
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
                Buscar
              </Boton>
            </form>
          </details>
          <EnlaceBoton href="/mascotas/publicar">
            <Icono nombre="megafono" tamano={20} />
            Publicar un aviso
          </EnlaceBoton>
        </div>
      </div>

      <section className={estilos.seccion} aria-label="Avisos vigentes">
        {resultados.length > 0 ? (
          <div className={estilos.grilla}>
            {resultados.map((p) => (
              <TarjetaMascota key={p.id} publicacion={p} coincidencia={conCoincidencia.has(p.id)} />
            ))}
          </div>
        ) : (
          <div className={estilos.vacio}>
            <p>No hay avisos vigentes con estos filtros.</p>
            <EnlaceBoton href="/mascotas/publicar">Publicar un aviso</EnlaceBoton>
          </div>
        )}
      </section>
    </div>
  );
}
