import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { perroComunitario, seguimientoComunitario } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { FormularioCuidar } from "./FormularioCuidar";

export const metadata: Metadata = { title: "Hacerme cargo" };

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Responde: ¿cómo quedo a cargo de un perro comunitario que no tiene cuidador?
export default async function PaginaCuidar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, s] = await Promise.all([perroComunitario(id), seguimientoComunitario(id)]);
  if (!c || !s) notFound();
  if (s.conCuidador) redirect(`/comunitarios/${id}`);
  const nombre = c.animal.nombre ?? capitalizar(c.apodo);
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <h1>Hacerme cargo de {nombre}</h1>
      <FormularioCuidar perroId={c.id} nombre={nombre} />
    </div>
  );
}
