import type { Municipio } from "@/lib/municipio";
import estilos from "./Logo.module.css";

type Props = {
  municipio: Municipio;
  /**
   * Arquitectura de marca del sistema de diseño:
   * - «ciudadano» (nivel B): logotipo con «Somos tod@s», para el portal de vecinos.
   * - «institucional» (nivel A): escudo + nombre oficial, para el panel municipal.
   * - «blanco»: versión vertical en blanco, sobre fondos azules (pie de página).
   */
  variante: "ciudadano" | "institucional" | "blanco";
};

// Los archivos vienen de la configuración del municipio y nunca se redibujan.
export function Logo({ municipio, variante }: Props) {
  const { identidad, nombre, nombreOficial } = municipio;
  if (variante === "institucional") {
    const antes = nombreOficial.replace(nombre, "").trim();
    return (
      <span className={estilos.institucional}>
        <img src={identidad.escudo} alt={`Escudo de ${nombre}`} />
        <span className={estilos.texto}>
          <span className={estilos.antes}>{antes}</span>
          <span className={estilos.nombre}>{nombre}</span>
        </span>
      </span>
    );
  }
  const src = variante === "blanco" ? identidad.logoBlanco : identidad.logoCiudadano;
  return <img className={variante === "blanco" ? estilos.blanco : estilos.ciudadano} src={src} alt={nombreOficial} />;
}
