import type { Municipio } from "@/lib/municipio";
import estilos from "./FirmaInstitucional.module.css";

type Props = {
  municipio: Municipio;
  /** Sobre `azul-institucional` usa el escudo negativo y texto marfil. */
  sobreAzul?: boolean;
};

export function FirmaInstitucional({ municipio, sobreAzul = false }: Props) {
  const escudo = sobreAzul ? municipio.identidad.escudoNegativo : municipio.identidad.escudoColor;
  const [linea1, linea2] = municipio.firma;
  return (
    <div className={sobreAzul ? `${estilos.firma} ${estilos.sobreAzul}` : estilos.firma}>
      <img src={escudo} alt={`Escudo de ${municipio.nombre}`} />
      <span className={estilos.texto}>
        {linea1}
        <br />
        {linea2}
      </span>
    </div>
  );
}
