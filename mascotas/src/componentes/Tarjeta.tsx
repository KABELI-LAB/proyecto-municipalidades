import type { ReactNode } from "react";
import estilos from "./Tarjeta.module.css";

type Props = {
  children: ReactNode;
  /** Úsese cuando la tarjeta queda sobre `blanco` en vez de `marfil-institucional`. */
  sobreBlanco?: boolean;
  como?: "div" | "section" | "article";
};

export function Tarjeta({ children, sobreBlanco = false, como: Etiqueta = "div" }: Props) {
  const clase = sobreBlanco ? `${estilos.tarjeta} ${estilos.sobreBlanco}` : estilos.tarjeta;
  return <Etiqueta className={clase}>{children}</Etiqueta>;
}

/** Una idea dentro de la tarjeta: título y texto. Bloques sucesivos van separados por filete. */
export function BloqueTarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className={estilos.bloque}>
      <h3>{titulo}</h3>
      <div>{children}</div>
    </div>
  );
}
