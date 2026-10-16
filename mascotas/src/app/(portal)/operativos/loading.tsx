import { Esqueleto } from "@/componentes/Esqueleto";
import estilos from "@/componentes/portal/operativos.module.css";
import paginas from "@/estilos/paginas.module.css";

// Mientras cargan los operativos: el encabezado y tres tarjetas en bloques de esqueleto.
export default function CargandoOperativos() {
  return (
    <div className={`contenedor ${paginas.pagina}`} role="status" aria-live="polite">
      <span className="visualmente-oculto">Cargando operativos…</span>
      <Esqueleto alto="titulo" ancho="50%" />
      <div className={estilos.grilla}>
        {[0, 1, 2].map((i) => (
          <Esqueleto key={i} alto="tarjeta" />
        ))}
      </div>
    </div>
  );
}
