import type { Metadata } from "next";
import { diaISO } from "@/servidor/formato";
import { ESPECIE } from "@/dominio/etiquetas";
import { coloresPorEspecie, publicacion, territorio } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { FormularioPublicacion } from "./FormularioPublicacion";

export const metadata: Metadata = { title: "Aviso de mascota perdida o avistada" };

// «Reportar mascota perdida» (?tipo=PERDIDA) o «Informar mascota avistada»
// (?tipo=ENCONTRADA); con ?aviso=<id>, el avistamiento se vincula a ese aviso de pérdida.
export default async function PaginaPublicar({ searchParams }: { searchParams: Promise<{ tipo?: string; aviso?: string }> }) {
  const { tipo, aviso } = await searchParams;
  const [lista, colores, perdida] = await Promise.all([territorio(), coloresPorEspecie(), aviso ? publicacion(aviso) : Promise.resolve(null)]);
  const vinculo = perdida?.tipo === "PERDIDA" ? { id: perdida.id, especie: perdida.especie, descripcion: `${ESPECIE[perdida.especie]} ${perdida.colorPrincipal}, perdido en ${perdida.sector.nombre}` } : undefined;
  const tipoInicial = tipo === "PERDIDA" || tipo === "ENCONTRADA" ? tipo : "";
  const ahora = new Date();
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>{vinculo || tipoInicial === "ENCONTRADA" ? "Informar mascota avistada" : tipoInicial === "PERDIDA" ? "Reportar mascota perdida" : "Aviso de mascota perdida o avistada"}</h1>
      </div>
      <FormularioPublicacion sectores={lista} colores={colores} hoy={diaISO(ahora)} minimo={diaISO(new Date(ahora.getTime() - 60 * 86_400_000))} tipoInicial={tipoInicial} vinculo={vinculo} />
    </div>
  );
}
