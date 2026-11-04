import { Icono, type NombreIcono } from "@/componentes/Icono";
import { TIPO_AVISO } from "@/dominio/etiquetas";
import { fechaLarga } from "@/servidor/formato";
import estilos from "./tarjetas.module.css";

type Props = {
  aviso: {
    id: string;
    tipo: string;
    titulo: string;
    texto: string;
    vigenteHasta: Date;
    sectores: { sector: { nombre: string } }[];
  };
};

const ICONO: Record<string, NombreIcono> = {
  OPERATIVO: "calendario",
  CAMBIO: "info",
  CAMPANA: "megafono",
  ALERTA: "alerta",
  INFORMACION: "info",
};

export function TarjetaAviso({ aviso: a }: Props) {
  const alerta = a.tipo === "ALERTA";
  const destino = a.sectores.length > 0 ? a.sectores.map((s) => s.sector.nombre).join(", ") : "Toda la comuna";
  return (
    <article className={`${estilos.tarjeta} ${alerta ? estilos.alerta : ""}`}>
      <p className={estilos.antetitulo}>
        <Icono nombre={ICONO[a.tipo] ?? "info"} tamano={20} />
        {TIPO_AVISO[a.tipo]} · {destino}
      </p>
      <h3>{a.titulo}</h3>
      <p>{a.texto}</p>
      <p className="nota">Vigente hasta el {fechaLarga(a.vigenteHasta)}.</p>
    </article>
  );
}
