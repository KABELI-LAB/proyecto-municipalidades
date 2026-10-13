import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { REPORTE_COMUNITARIO } from "@/componentes/portal/TarjetaComunitario";
import { perroComunitario, seguimientoComunitario, territorio } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { FormularioNovedad } from "./FormularioNovedad";

export const metadata: Metadata = { title: "Informar una novedad" };

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Responde: ¿cómo le aviso a quien cuida a este perro algo que vi?
export default async function PaginaNovedad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, s, sectores] = await Promise.all([perroComunitario(id), seguimientoComunitario(id), territorio()]);
  if (!c || !s) notFound();
  // Sin cuidador no hay quien la reciba: se ofrece hacerse cargo.
  if (!s.conCuidador) redirect(`/comunitarios/${id}/cuidar`);
  const nombre = c.animal.nombre ?? capitalizar(c.apodo);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Informar una novedad</h1>
        <p>
          Sobre {nombre}, en {c.lugar.nombre}. Se la enviamos a quien lo cuida. Si está herido y es urgente, use{" "}
          <Link href={REPORTE_COMUNITARIO}>SOS Mascotas</Link>.
        </p>
      </div>
      <FormularioNovedad perroId={c.id} nombre={nombre} sectores={sectores} />
    </div>
  );
}
