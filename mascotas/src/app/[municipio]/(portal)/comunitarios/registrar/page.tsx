import type { Metadata } from "next";
import { lugaresPublicos } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { FormularioComunitario } from "./FormularioComunitario";

export const metadata: Metadata = { title: "Registrar un perro comunitario" };

// Responde: ¿cómo publico a un perro que cuidamos en el barrio?
export default async function PaginaRegistrarComunitario() {
  const lugares = await lugaresPublicos();
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <h1>Registrar un perro comunitario</h1>
      <FormularioComunitario lugares={lugares.map((l) => ({ valor: l.id, texto: l.nombre, grupo: `Sector ${l.sector.nombre}` }))} />
    </div>
  );
}
