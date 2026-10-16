import { Icono } from "./Icono";
import estilos from "./FranjaDemo.module.css";

/** Visible en toda vista mientras existan datos simulados (docs/concepto.md, sección 17). */
export function FranjaDemo() {
  return (
    <div className={estilos.franja} role="note">
      <Icono nombre="info" tamano={20} />
      <p>
        <b>Datos de demostración.</b> Los registros y cifras de este sitio son simulados y no describen la
        situación real de la comuna.
      </p>
    </div>
  );
}
