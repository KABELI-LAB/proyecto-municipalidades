// Barras por mes con el valor escrito sobre cada barra (sin depender del
// color ni del cursor). Los valores también están en una tabla accesible.
import estilos from "./grafico.module.css";

type Barra = { etiqueta: string; valor: number; nota?: string };

const ANCHO = 720;
const ALTO = 220;
const M = { arriba: 24, abajo: 28, lados: 8 };

export function GraficoBarras({ datos, descripcion, unidad }: { datos: Barra[]; descripcion: string; unidad: [string, string] }) {
  const tope = Math.max(1, ...datos.map((d) => d.valor));
  const paso = (ANCHO - 2 * M.lados) / datos.length;
  const ancho = paso * 0.6;
  const alto = ALTO - M.arriba - M.abajo;
  const texto = (n: number) => `${n} ${n === 1 ? unidad[0] : unidad[1]}`;

  return (
    <figure className={estilos.figura}>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className={estilos.svg} role="img" aria-label={`${descripcion}. Los valores están en la tabla.`}>
        <line x1={M.lados} x2={ANCHO - M.lados} y1={ALTO - M.abajo} y2={ALTO - M.abajo} className={estilos.base} />
        {datos.map((d, i) => {
          const h = (d.valor / tope) * alto;
          const x = M.lados + i * paso + (paso - ancho) / 2;
          const y = ALTO - M.abajo - h;
          return (
            <g key={d.etiqueta}>
              <rect x={x} y={y} width={ancho} height={h} className={estilos.barra} />
              <text x={x + ancho / 2} y={y - 6} textAnchor="middle" className={estilos.valorBarra}>
                {d.valor}
              </text>
              <text x={x + ancho / 2} y={ALTO - 8} textAnchor="middle" className={estilos.ejeBarra}>
                {d.etiqueta}
                {d.nota ? "*" : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="visualmente-oculto">
        <caption>{descripcion}</caption>
        <tbody>
          {datos.map((d) => (
            <tr key={d.etiqueta}>
              <th scope="row">
                {d.etiqueta}
                {d.nota ? ` (${d.nota})` : ""}
              </th>
              <td>{texto(d.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
