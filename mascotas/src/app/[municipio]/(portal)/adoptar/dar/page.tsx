import type { Metadata } from "next";
import { FORMATO_CODIGO } from "@/dominio/codigo";
import { territorio } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { CorregirPropuesta } from "./CorregirPropuesta";
import { FormularioPropuesta } from "./FormularioPropuesta";

export const metadata: Metadata = { title: "Dar en adopción" };

// Responde: ¿cómo propongo a un animal para que encuentre hogar? Distinto de
// «Quiero adoptar» (/adoptar), que es para quienes buscan un animal.
export default async function PaginaDarEnAdopcion({ searchParams }: { searchParams: Promise<{ corregir?: string }> }) {
  const [{ corregir }, sectores] = await Promise.all([searchParams, territorio()]);
  const codigo = corregir?.trim().toUpperCase();
  const corrigiendo = codigo && FORMATO_CODIGO.test(codigo) ? codigo : null;

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <h1>{corrigiendo ? "Corregir propuesta de adopción" : "Dar en adopción"}</h1>
      {corrigiendo ? <CorregirPropuesta codigo={corrigiendo} sectores={sectores} /> : <FormularioPropuesta sectores={sectores} />}
    </div>
  );
}
