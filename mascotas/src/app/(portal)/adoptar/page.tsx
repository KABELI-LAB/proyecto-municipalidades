import type { Metadata } from "next";
import { EnlaceBoton } from "@/componentes/Boton";
import { TarjetaAdopcion } from "@/componentes/portal/TarjetaAdopcion";
import { fichasAdopcion } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Adopción" };

export default async function PaginaAdoptar() {
  const fichas = await fichasAdopcion();
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      {/* Una fila: título y, a la derecha, la otra cara del trámite (dar en adopción). */}
      <div className={estilos.barraTitulo}>
        <div className={estilos.cabecera}>
          <h1>Quiero adoptar</h1>
          <p>Fichas revisadas por el municipio. Conversamos con usted antes de la adopción.</p>
        </div>
        <EnlaceBoton href="/adoptar/dar" variante="secundario">
          Dar en adopción
        </EnlaceBoton>
      </div>
      {fichas.length > 0 ? (
        <section className={estilos.grilla} aria-label="Animales en adopción">
          {fichas.map((f) => (
            <TarjetaAdopcion key={f.id} ficha={f} />
          ))}
        </section>
      ) : (
        <div className={estilos.vacio}>
          <p>Por ahora no hay animales disponibles para adopción. Revise los avisos para conocer las próximas campañas.</p>
        </div>
      )}
    </div>
  );
}
