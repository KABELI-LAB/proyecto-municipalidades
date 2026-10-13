"use client";
// Mapa ciudadano sobre OpenStreetMap: una capa a la vez, una marca por sector
// o lugar de referencia (nunca una por animal, para que no se superpongan) y
// una ficha lateral con lo que hay en el lugar elegido. La ficha lateral,
// sin lugar elegido, lista todos los lugares: la misma información sin mapa.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EnlaceBoton } from "@/componentes/Boton";
import { RELLENO_POR_NIVEL, token, ubicarTooltips, useMapa } from "@/componentes/mapa/useMapa";
import type { Punto } from "@/dominio/geo";
import type { CapaCiudadana, MarcaCiudadana } from "./marcasMapa";
import estilos from "./mapaCiudadano.module.css";

type Props = CapaCiudadana & { capa: string; nombreCapa: string; localidades: Punto[] };

export function MapaCiudadano({ capa, nombreCapa, localidades, marcas, vacio }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const ficha = useRef<HTMLElement>(null);
  // La elección vale solo para la capa en que se hizo.
  const [eleccion, setEleccion] = useState<{ capa: string; clave: string } | null>(null);
  const elegida = eleccion?.capa === capa ? (marcas.find((m) => m.clave === eleccion.clave) ?? null) : null;
  const listo = useMapa(contenedor, { encuadre: [...localidades, ...marcas.map((m) => m.centro)] });

  const elegir = (m: MarcaCiudadana | null, enfocar = false) => {
    setEleccion(m ? { capa, clave: m.clave } : null);
    // En celular la ficha queda bajo el mapa: se lleva a la vista.
    if (enfocar) requestAnimationFrame(() => ficha.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  };

  useEffect(() => {
    if (!listo) return;
    const { L, mapa } = listo;
    const azul = token("azul-institucional");
    const grupo = L.layerGroup().addTo(mapa);
    const dibujadas = marcas.map((m) => {
      const activa = m.clave === elegida?.clave;
      const marca = L.circleMarker([m.centro.lat, m.centro.lng], {
        radius: m.radio,
        color: activa ? token("gris-texto") : azul,
        weight: activa ? 4 : 2,
        fillColor: m.nivel === 0 ? token("blanco") : azul,
        fillOpacity: m.nivel === 0 ? 1 : RELLENO_POR_NIVEL[m.nivel],
      }).addTo(grupo);
      marca.on("click", () => elegir(m, true));
      return { marca, radio: m.radio, texto: [m.titulo, m.detalle] };
    });
    const ubicar = () => ubicarTooltips(mapa, dibujadas);
    ubicar();
    mapa.on("zoomend", ubicar);
    return () => {
      mapa.off("zoomend", ubicar);
      grupo.remove();
    };
    // `elegir` solo cambia con la capa, que ya está en `marcas`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, marcas, elegida?.clave]);

  return (
    <div className={estilos.cuerpo}>
      <div ref={contenedor} className={estilos.mapa} role="region" aria-label={`Mapa: ${nombreCapa.toLowerCase()}. La misma información está en la ficha junto al mapa.`} />

      <aside ref={ficha} className={estilos.ficha} aria-live="polite" aria-label="Detalle del lugar elegido">
        {marcas.length === 0 ? (
          <div className={estilos.vacio}>
            <p>{vacio.texto}</p>
            {vacio.enlace && (
              <EnlaceBoton href={vacio.enlace.href} variante="secundario">
                {vacio.enlace.texto}
              </EnlaceBoton>
            )}
          </div>
        ) : elegida ? (
          <Detalle marca={elegida} alVolver={() => elegir(null)} />
        ) : (
          <>
            <h2>Elija un lugar</h2>
            <p className="nota">Toque una marca en el mapa o un lugar de esta lista.</p>
            <ul className={estilos.lugares}>
              {marcas.map((m) => (
                <li key={m.clave}>
                  <button type="button" onClick={() => elegir(m)}>
                    <b>{m.titulo}</b>
                    <span>{m.detalle}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}

function Detalle({ marca: m, alVolver }: { marca: MarcaCiudadana; alVolver: () => void }) {
  return (
    <>
      <div className={estilos.encabezado}>
        <h2>{m.titulo}</h2>
        <button type="button" className={estilos.volver} onClick={alVolver}>
          Ver todos los lugares
        </button>
      </div>
      {m.cifras && (
        <dl className={estilos.cifras}>
          {m.cifras.map((c) => (
            <div key={c.texto}>
              <dd>{c.valor.toLocaleString("es-CL")}</dd>
              <dt>{c.texto}</dt>
            </div>
          ))}
        </dl>
      )}
      {m.items.length > 0 && (
        <ul className={estilos.items}>
          {m.items.map((i) => (
            <li key={i.clave}>
              <Link href={i.href} className={estilos.item}>
                {i.foto && (
                  <Image src={i.foto.src} alt="" width={112} height={112} sizes="56px" unoptimized={i.foto.subida} />
                )}
                <span>
                  <b>{i.titulo}</b>
                  {i.lineas.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                  {i.etiqueta && <span className={estilos.etiqueta}>{i.etiqueta}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {m.enlaces && (
        <div className={estilos.enlaces}>
          {m.enlaces.map((e) =>
            e.principal ? (
              <EnlaceBoton key={e.href} href={e.href}>
                {e.texto}
              </EnlaceBoton>
            ) : (
              <Link key={e.href} href={e.href}>
                {e.texto}
              </Link>
            ),
          )}
        </div>
      )}
    </>
  );
}
