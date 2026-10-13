import estilos from "./EtiquetaSeccion.module.css";

type Props = {
  numero: number;
  /** En tipo oración; el CSS lo pasa a mayúsculas. */
  nombre: string;
  sobreAzul?: boolean;
};

/** Antetítulo «NN · Nombre». Siempre va seguido de un título. */
export function EtiquetaSeccion({ numero, nombre, sobreAzul = false }: Props) {
  const clase = sobreAzul ? `${estilos.etiqueta} ${estilos.sobreAzul}` : estilos.etiqueta;
  return (
    <p className={clase}>
      {String(numero).padStart(2, "0")} · {nombre}
    </p>
  );
}
