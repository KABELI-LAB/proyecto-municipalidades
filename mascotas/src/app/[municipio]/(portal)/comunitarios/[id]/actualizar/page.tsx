import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { perroComunitario } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { EntradaCuidador } from "./EntradaCuidador";

export const metadata: Metadata = { title: "Actualizar ficha" };

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Responde: soy su cuidador, ¿cómo actualizo su ficha?
export default async function PaginaActualizar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await perroComunitario(id);
  if (!c) notFound();
  const nombre = c.animal.nombre ?? capitalizar(c.apodo);
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <h1>Actualizar la ficha de {nombre}</h1>
      <EntradaCuidador perroId={c.id} />
    </div>
  );
}
