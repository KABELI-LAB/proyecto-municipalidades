// Bloques de esqueleto mientras carga una página: nunca pantallas vacías ni
// íconos girando (CLAUDE.md, principios de interfaz).
import estilos from "./Esqueleto.module.css";

export function Esqueleto({ alto = "linea", ancho }: { alto?: "linea" | "titulo" | "bloque" | "tarjeta"; ancho?: string }) {
  return <span className={`${estilos.esqueleto} ${estilos[alto]}`} style={ancho ? { width: ancho } : undefined} aria-hidden="true" />;
}

/** Página en carga: título, una línea y bloques. */
export function PaginaEsqueleto({ bloques = 3 }: { bloques?: number }) {
  return (
    <div className={`contenedor ${estilos.pagina}`} role="status" aria-live="polite">
      <span className="visualmente-oculto">Cargando…</span>
      <Esqueleto alto="titulo" ancho="60%" />
      <Esqueleto ancho="80%" />
      <div className={estilos.grilla}>
        {Array.from({ length: bloques }, (_, i) => (
          <Esqueleto key={i} alto="tarjeta" />
        ))}
      </div>
    </div>
  );
}
