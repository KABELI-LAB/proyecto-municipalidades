import type { Estado, Tono } from "@/dominio/etiquetas";
import { Icono, type NombreIcono } from "./Icono";
import estilos from "./EtiquetaEstado.module.css";

// Siempre color + texto + ícono: el estado nunca se comunica solo con color.
const ICONO: Record<Tono, NombreIcono> = {
  recibido: "reloj",
  informacion: "info",
  espera: "reloj",
  confirmado: "check",
  finalizado: "check",
  cerrado: "cerrar",
};

export function EtiquetaEstado({ estado }: { estado: Estado }) {
  return (
    <span className={`${estilos.etiqueta} ${estilos[estado.tono]}`}>
      <Icono nombre={ICONO[estado.tono]} tamano={16} />
      {estado.texto}
    </span>
  );
}
