import { idsMunicipios, municipioPorId, type Municipio } from "@/lib/municipio";
import { COOKIE_MUNICIPIO } from "@/lib/municipio-claves";
import { Icono } from "./Icono";
import { SelectorMunicipio } from "./SelectorMunicipio";
import estilos from "./FranjaDemo.module.css";

/** Visible en toda vista mientras existan datos simulados (docs/concepto.md, sección 17). */
export function FranjaDemo({ municipio }: { municipio: Municipio }) {
  const opciones = idsMunicipios().map((id) => ({ id, nombre: municipioPorId(id).nombre }));
  return (
    <div className={estilos.franja} role="note">
      <div className={estilos.texto}>
        <Icono nombre="info" tamano={20} />
        <p>
          <b>Datos de demostración.</b> Los registros y cifras de este sitio son simulados y no describen la
          situación real de la comuna.
        </p>
      </div>
      {opciones.length > 1 && <SelectorMunicipio opciones={opciones} actual={municipio.id} cookie={COOKIE_MUNICIPIO} />}
    </div>
  );
}
