"use client";
// Tendencia de 12 meses: solicitudes recibidas y atenciones realizadas.
// Un solo eje (ambas son conteos). Colores de los tokens: azul-institucional y
// verde-territorio; separación validada para daltonismo (ΔE 19). Como el azul
// es sobrio, la identidad no depende solo del color: leyenda, etiqueta al final
// de cada línea, lectura al pasar el cursor o con flechas, y vista en tabla.
import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import estilos from "./grafico.module.css";

type Punto = { mes: string; etiqueta: string; solicitudes: number; atenciones: number };

const SERIES = [
  { clave: "solicitudes", nombre: "Solicitudes recibidas", uno: "solicitud", varios: "solicitudes", color: "var(--azul-institucional)" },
  { clave: "atenciones", nombre: "Atenciones realizadas", uno: "atención", varios: "atenciones", color: "var(--verde-territorio)" },
] as const;

const ANCHO = 720;
const ALTO = 260;
const M = { arriba: 16, derecha: 120, abajo: 32, izquierda: 40 };

/** Máximo «redondo» para el eje y sus marcas (0, 20, 40…). */
function escala(maximo: number) {
  const paso = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find((p) => maximo / p <= 5) ?? 1000;
  const tope = Math.max(paso, Math.ceil(maximo / paso) * paso);
  return { tope, marcas: Array.from({ length: tope / paso + 1 }, (_, i) => i * paso) };
}

/** `mesEnCurso`: el último mes aún no termina; se indica para no leerlo como una caída. */
export function GraficoTendencia({ datos, mesEnCurso = true }: { datos: Punto[]; mesEnCurso?: boolean }) {
  const [activo, setActivo] = useState<number | null>(null);
  const idTabla = useId();
  const { tope, marcas } = escala(Math.max(1, ...datos.flatMap((d) => [d.solicitudes, d.atenciones])));
  const ancho = ANCHO - M.izquierda - M.derecha;
  const alto = ALTO - M.arriba - M.abajo;
  const x = (i: number) => M.izquierda + (datos.length === 1 ? ancho / 2 : (i * ancho) / (datos.length - 1));
  const y = (v: number) => M.arriba + alto - (v / tope) * alto;
  const linea = (clave: "solicitudes" | "atenciones") => datos.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[clave])}`).join(" ");
  const ultimo = datos.length - 1;

  function alMover(e: PointerEvent<SVGRectElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const relativo = ((e.clientX - caja.left) / caja.width) * ancho;
    setActivo(Math.max(0, Math.min(ultimo, Math.round((relativo / ancho) * ultimo))));
  }
  function alTeclear(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setActivo((a) => Math.max(0, Math.min(ultimo, (a ?? ultimo) + (e.key === "ArrowRight" ? 1 : -1))));
  }

  // Si las etiquetas finales quedan muy juntas, se separan verticalmente.
  const yFinal = SERIES.map((s) => y(datos[ultimo]?.[s.clave] ?? 0));
  if (Math.abs(yFinal[0] - yFinal[1]) < 18) {
    const medio = (yFinal[0] + yFinal[1]) / 2;
    const arriba = yFinal[0] <= yFinal[1] ? 0 : 1;
    yFinal[arriba] = medio - 9;
    yFinal[1 - arriba] = medio + 9;
  }

  const d = activo !== null ? datos[activo] : null;

  return (
    <figure className={estilos.figura}>
      <ul className={estilos.leyenda} aria-label="Series">
        {SERIES.map((s) => (
          <li key={s.clave}>
            <span className={estilos.clave} style={{ background: s.color }} aria-hidden="true" />
            {s.nombre}
          </li>
        ))}
      </ul>

      <div className={estilos.lienzo}>
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          role="img"
          aria-label="Solicitudes recibidas y atenciones realizadas por mes, últimos 12 meses. Use las flechas para recorrer los meses; los valores también están en la tabla."
          tabIndex={0}
          onKeyDown={alTeclear}
          onBlur={() => setActivo(null)}
          className={estilos.svg}
        >
          {marcas.map((m) => (
            <g key={m}>
              <line x1={M.izquierda} x2={M.izquierda + ancho} y1={y(m)} y2={y(m)} className={estilos.grilla} />
              <text x={M.izquierda - 8} y={y(m)} className={estilos.eje} textAnchor="end" dominantBaseline="middle">
                {m.toLocaleString("es-CL")}
              </text>
            </g>
          ))}
          {datos.map((p, i) => (
            <text key={p.mes} x={x(i)} y={ALTO - 10} className={estilos.eje} textAnchor="middle">
              {p.etiqueta}
              {mesEnCurso && i === datos.length - 1 ? "*" : ""}
            </text>
          ))}

          {d && activo !== null && <line x1={x(activo)} x2={x(activo)} y1={M.arriba} y2={M.arriba + alto} className={estilos.cruz} />}

          {SERIES.map((s, n) => (
            <g key={s.clave}>
              <path d={linea(s.clave)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={x(ultimo)} cy={y(datos[ultimo][s.clave])} r={4} fill={s.color} stroke="var(--blanco)" strokeWidth={2} />
              {d && activo !== null && <circle cx={x(activo)} cy={y(d[s.clave])} r={4} fill={s.color} stroke="var(--blanco)" strokeWidth={2} />}
              <text x={x(ultimo) + 10} y={yFinal[n]} className={estilos.etiquetaFinal} dominantBaseline="middle">
                {datos[ultimo][s.clave].toLocaleString("es-CL")} {datos[ultimo][s.clave] === 1 ? s.uno : s.varios}
              </text>
            </g>
          ))}

          <rect
            x={M.izquierda}
            y={M.arriba}
            width={ancho}
            height={alto}
            fill="transparent"
            onPointerMove={alMover}
            onPointerLeave={() => setActivo(null)}
          />
        </svg>

        {d && activo !== null && (
          <div
            className={estilos.lectura}
            style={{ left: `${(x(activo) / ANCHO) * 100}%`, transform: activo > ultimo / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
            role="status"
          >
            <span className={estilos.mesLectura}>
              {d.etiqueta} {d.mes.slice(0, 4)}
              {mesEnCurso && activo === ultimo ? " (en curso)" : ""}
            </span>
            {SERIES.map((s) => (
              <span key={s.clave} className={estilos.filaLectura}>
                <span className={estilos.claveLinea} style={{ background: s.color }} aria-hidden="true" />
                <b>{d[s.clave].toLocaleString("es-CL")}</b> {s.nombre.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {mesEnCurso && <p className="nota">* Mes en curso: sus cifras aún no están completas.</p>}
      <details className={estilos.tabla}>
        <summary>Ver como tabla</summary>
        <table id={idTabla}>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              {SERIES.map((s) => (
                <th key={s.clave} scope="col" className={estilos.numero}>
                  {s.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.map((p) => (
              <tr key={p.mes}>
                <th scope="row">
                  {p.etiqueta} {p.mes.slice(0, 4)}
                </th>
                <td className={estilos.numero}>{p.solicitudes.toLocaleString("es-CL")}</td>
                <td className={estilos.numero}>{p.atenciones.toLocaleString("es-CL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
