"use client";
// Mapa del panel sobre OpenStreetMap: una capa a la vez, línea de tiempo de
// 12 meses y ficha lateral del sector elegido. Sectores coloreados por
// intensidad en sus coordenadas, nunca puntos sobre casas; el calor de
// reportes se dibuja como cuadros de ~1 km y solo donde hay 3 o más registros.
import { useEffect, useMemo, useRef, useState } from "react";
import { EnlaceBoton } from "@/componentes/Boton";
import { RELLENO_POR_NIVEL, token, ubicarTooltips, useMapa } from "@/componentes/mapa/useMapa";
import { distanciaKm } from "@/dominio/geo";
import { celdasCalor, MINIMO_CALOR, nivelIntensidad } from "@/dominio/mapa";
import type { CapaTemporal, DatosMapa } from "@/servidor/panel/mapa";
import { CAPAS, CLAVES_CAPA, type Capa } from "./capasMapa";
import estilos from "./mapa.module.css";

const UNIDAD: Record<Exclude<Capa, "prioridad" | "calor">, [string, string]> = {
  solicitudes: ["pendiente", "pendientes"],
  dias: ["día", "días"],
  reportes: ["reporte", "reportes"],
  perdidas: ["publicación", "publicaciones"],
  atenciones: ["atención", "atenciones"],
  adopciones: ["adopción", "adopciones"],
  operativos: ["operativo", "operativos"],
};
const NIVEL = { ALTA: "Prioridad alta", MEDIA: "Prioridad media", BAJA: "Prioridad baja" } as const;
const INTENSIDAD_NIVEL = { ALTA: 3, MEDIA: 2, BAJA: 1 } as const;

const plural = (n: number, [uno, varios]: [string, string]) => `${n.toLocaleString("es-CL")} ${n === 1 ? uno : varios}`;
const radio = (n: number, max: number) => (n === 0 ? 6 : 9 + 17 * Math.sqrt(n / Math.max(max, 1)));

export function MapaPanel({ datos, capaInicial, puedeGestionar }: { datos: DatosMapa; capaInicial: Capa; puedeGestionar: boolean }) {
  const [capa, setCapa] = useState<Capa>(capaInicial);
  // 0–11: un mes; 12: los 12 meses completos.
  const [mes, setMes] = useState(12);
  const [elegido, setElegido] = useState<string | null>(null);
  const temporal = CAPAS[capa].temporal;

  // La capa queda en la dirección, para volver o compartir el enlace.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("capa", capa);
    window.history.replaceState(null, "", url);
  }, [capa]);

  const enPeriodo = (serie: number[]) => (mes === 12 ? serie.reduce((t, n) => t + n, 0) : serie[mes]);
  const textoPeriodo = mes === 12 ? `${datos.meses[0].nombre} a ${datos.meses[11].nombre}` : datos.meses[mes].nombre;

  const contenedor = useRef<HTMLDivElement>(null);
  const listo = useMapa(contenedor, { encuadre: [...datos.localidades, ...datos.sectores.flatMap((s) => (s.centro ? [s.centro] : []))] });

  // Valor de cada sector en la capa y el período elegidos.
  const valores = datos.sectores.map((s) => {
    switch (capa) {
      case "prioridad":
        return s.puntaje;
      case "solicitudes":
        return s.pendientes;
      case "dias":
        return s.diasSinIntervencion ?? 0;
      case "calor":
        return 0;
      default:
        return enPeriodo(s.porMes[capa as CapaTemporal]);
    }
  });
  const maximo = Math.max(0, ...valores);

  const detalle = (i: number): string => {
    const s = datos.sectores[i];
    if (capa === "prioridad") return NIVEL[s.nivel];
    if (capa === "dias") return s.diasSinIntervencion === null ? "Sin operativos" : plural(s.diasSinIntervencion, UNIDAD.dias);
    if (capa === "calor") return "";
    if (capa === "perdidas") {
      const total = valores[i];
      const resueltas = enPeriodo(s.resueltasPorMes);
      return total ? `${plural(total, UNIDAD.perdidas)} · ${Math.round((resueltas / total) * 100)} % resueltas` : plural(0, UNIDAD.perdidas);
    }
    return plural(valores[i], UNIDAD[capa]);
  };

  const marcas = datos.sectores.flatMap((s, i) => {
    if (!s.centro) return [];
    const nivel = capa === "prioridad" ? INTENSIDAD_NIVEL[s.nivel] : nivelIntensidad(valores[i], maximo);
    const r = capa === "prioridad" ? 9 + 17 * s.puntaje : radio(valores[i], maximo);
    return [{ i, s, centro: s.centro, r, nivel, detalle: detalle(i) }];
  });

  const celdas = useMemo(
    () => (capa === "calor" ? celdasCalor(datos.reportes.filter((r) => mes === 12 || r.m === mes)) : []),
    [capa, mes, datos.reportes],
  );
  const maxCelda = Math.max(0, ...celdas.map((c) => c.cantidad));
  const cercana = (c: { lat: number; lng: number }) =>
    datos.localidades.reduce((a, b) => (distanciaKm(c, a) <= distanciaKm(c, b) ? a : b)).nombre;

  // Dibujo sobre el mapa base: se rehace al cambiar la capa, el mes o el sector elegido.
  const firma = `${capa}|${mes}|${elegido}`;
  useEffect(() => {
    if (!listo) return;
    const { L, mapa } = listo;
    const azul = token("color-primary");
    const grupo = L.layerGroup().addTo(mapa);
    let ubicar: (() => void) | null = null;
    if (capa === "calor") {
      for (const c of celdas) {
        const nivel = nivelIntensidad(c.cantidad, maxCelda);
        L.rectangle(c.limites, { color: azul, weight: 1, fillColor: azul, fillOpacity: RELLENO_POR_NIVEL[nivel] })
          .bindTooltip(`Cerca de ${cercana(c.centro)}: ${plural(c.cantidad, UNIDAD.reportes)}`, { className: "etiqueta-mapa" })
          .addTo(grupo);
      }
    } else {
      const dibujadas = marcas.map((m) => {
        const marca = L.circleMarker([m.centro.lat, m.centro.lng], {
          radius: m.r,
          color: m.s.clave === elegido ? token("color-text") : azul,
          weight: m.s.clave === elegido ? 4 : 2,
          fillColor: m.nivel === 0 ? token("color-surface") : azul,
          fillOpacity: m.nivel === 0 ? 1 : RELLENO_POR_NIVEL[m.nivel],
        }).addTo(grupo);
        marca.on("click", () => setElegido(m.s.clave));
        return { marca, radio: m.r, texto: [m.s.nombre, m.detalle] };
      });
      ubicar = () => ubicarTooltips(mapa, dibujadas);
      ubicar();
      mapa.on("zoomend", ubicar);
    }
    return () => {
      if (ubicar) mapa.off("zoomend", ubicar);
      grupo.remove();
    };
    // `firma` resume capa, mes y sector elegido; marcas y celdas se derivan de ellos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, firma]);

  const sector = datos.sectores.find((s) => s.clave === elegido) ?? null;
  const indiceElegido = datos.sectores.findIndex((s) => s.clave === elegido);

  return (
    <div className={estilos.contenedor}>
      <div className={estilos.controles}>
        <label className={estilos.control}>
          Capa
          <select value={capa} onChange={(e) => setCapa(e.target.value as Capa)}>
            {CLAVES_CAPA.map((c) => (
              <option key={c} value={c}>
                {CAPAS[c].nombre}
              </option>
            ))}
          </select>
        </label>
        <div className={estilos.tiempo} aria-disabled={!temporal}>
          <label htmlFor="linea-tiempo">
            Período: <b>{temporal ? textoPeriodo : "hoy"}</b>
          </label>
          <input
            id="linea-tiempo"
            type="range"
            min={0}
            max={12}
            step={1}
            value={mes}
            disabled={!temporal}
            onChange={(e) => setMes(Number(e.target.value))}
            aria-valuetext={mes === 12 ? `Todo el año, ${textoPeriodo}` : textoPeriodo}
          />
          <div className={estilos.marcasTiempo} aria-hidden="true">
            <span>{datos.meses[0].etiqueta}</span>
            <span>Todo el año</span>
          </div>
        </div>
      </div>
      <p className={estilos.explica}>
        {CAPAS[capa].explica}
        {!temporal && " La línea de tiempo no aplica a esta capa."}
      </p>

      <div className={estilos.cuerpo}>
        <div ref={contenedor} className={estilos.mapa} role="region" aria-label={`Mapa por sector: ${CAPAS[capa].nombre.toLowerCase()}. Elige un sector en el mapa o en la ficha lateral.`} />

        <aside className={estilos.ficha} aria-live="polite">
          {capa === "calor" ? (
            <>
              <h2>Zonas con más reportes</h2>
              {celdas.length === 0 ? (
                <p>Ninguna zona llega a {MINIMO_CALOR} reportes en {mes === 12 ? "el período" : textoPeriodo}.</p>
              ) : (
                <ol className={estilos.zonas}>
                  {celdas.slice(0, 6).map((c) => (
                    <li key={c.clave}>
                      Cerca de {cercana(c.centro)}: <b>{plural(c.cantidad, UNIDAD.reportes)}</b>
                    </li>
                  ))}
                </ol>
              )}
              <p className="nota">Zonas aproximadas de cerca de 1 km. Nunca se muestra la ubicación de un reporte.</p>
            </>
          ) : sector ? (
            <>
              <h2>{sector.nombre}</h2>
              <p>
                {NIVEL[sector.nivel]} · índice {sector.puntaje.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <dl className={estilos.datosFicha}>
                <dt>{CAPAS[capa].nombre}</dt>
                <dd>{detalle(indiceElegido)}</dd>
                <dt>Pendientes por servicio</dt>
                <dd>{sector.pendientesPorServicio.map((x) => `${x.nombre}: ${x.cantidad}`).join(" · ")}</dd>
                <dt>Último operativo</dt>
                <dd>{sector.diasSinIntervencion === null ? "Sin operativos cerrados" : `Hace ${plural(sector.diasSinIntervencion, UNIDAD.dias)}`}</dd>
              </dl>
              <div className={estilos.accionesFicha}>
                {puedeGestionar && <EnlaceBoton href={`/panel/operativos/nuevo?sector=${sector.clave}&origen=FICHA_SECTOR`}>Crear operativo</EnlaceBoton>}
              </div>
            </>
          ) : (
            <>
              <p>Elige un sector en el mapa o aquí para ver su ficha.</p>
              <div className={estilos.elegirSector}>
                {datos.sectores.map((x) => (
                  <button key={x.clave} type="button" onClick={() => setElegido(x.clave)}>
                    {x.nombre}
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>

      <p className="nota">
        {capa === "calor"
          ? `Más oscuro: más reportes en la zona. Máximo: ${maxCelda}.`
          : capa === "prioridad"
            ? "Más oscuro y más grande: mayor prioridad."
            : `Más oscuro y más grande: más ${UNIDAD[capa][1]}. Máximo: ${maximo.toLocaleString("es-CL")}.`}{" "}
        Ubicaciones aproximadas por sector, sin límites oficiales.
      </p>
    </div>
  );
}
