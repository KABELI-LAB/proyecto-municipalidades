// Resumen para el equipo escrito por la IA: titular, lo que destaca (cada punto
// con su cifra) y las recomendaciones con el porqué. Lo que pide mirarse con
// prioridad va en amarillo, siempre con ícono y texto.
import { Icono } from "@/componentes/Icono";
import { numero } from "@/dominio/formato";
import type { ResumenEquipo as Resumen } from "@/dominio/resumen";
import estilos from "./ResumenEquipo.module.css";

export function ResumenEquipo({ resumen }: { resumen: Resumen }) {
  return (
    <div className={estilos.resumen}>
      <p className={estilos.titular}>{resumen.titular}</p>

      <ul className={estilos.destacados} aria-label="Lo que destaca">
        {resumen.destacados.map((d) => (
          <li key={d.titulo} className={d.tono === "atencion" ? `${estilos.destacado} ${estilos.atencion}` : estilos.destacado}>
            <span className={estilos.etiqueta}>
              {d.tono === "atencion" && <Icono nombre="alerta" tamano={16} />}
              {d.titulo}
              {d.tono === "atencion" && <span className="visualmente-oculto"> (prioridad)</span>}
            </span>
            {d.cifra !== null && <span className={estilos.cifra}>{numero(d.cifra)}</span>}
            <span className={estilos.detalle}>{d.detalle}</span>
          </li>
        ))}
      </ul>

      <div className={estilos.recomendaciones}>
        <h3>
          <Icono nombre="idea" tamano={20} />
          Para evaluar
        </h3>
        <ol>
          {resumen.recomendaciones.map((r) => (
            <li key={r.texto}>
              <b>{r.texto}</b>
              <span className={estilos.porque}>Por qué: {r.porque}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
