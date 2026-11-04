import { Esqueleto } from "@/componentes/Esqueleto";
import estilos from "@/componentes/portal/operativos.module.css";
import paginas from "@/estilos/paginas.module.css";

// Mientras carga el formulario de inscripción: un bloque de esqueleto.
export default function CargandoOperativo() {
  return (
    <div className={`contenedor ${paginas.pagina}`} role="status" aria-live="polite">
      <span className="visualmente-oculto">Cargando el operativo…</span>
      <div className={estilos.zonaFormulario}>
        <Esqueleto alto="tarjeta" />
      </div>
    </div>
  );
}
