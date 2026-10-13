import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import estilos from "./Boton.module.css";

type Variante = "primario" | "secundario";

const clases = (variante: Variante, className?: string) =>
  [estilos.boton, estilos[variante], className].filter(Boolean).join(" ");

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante };

export function Boton({ variante = "primario", className, type = "button", ...resto }: Props) {
  return <button type={type} className={clases(variante, className)} {...resto} />;
}

/** Enlace con apariencia de botón, para acciones que llevan a otra página. */
export function EnlaceBoton({ variante = "primario", className, ...resto }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={clases(variante, className)} {...resto} />;
}
