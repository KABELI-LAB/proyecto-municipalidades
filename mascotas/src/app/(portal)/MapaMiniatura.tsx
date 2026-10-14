"use client";
// Mapa en miniatura de la portada, sobre OpenStreetMap: los sectores con sus
// avisos activos, cada uno con su nombre y cifra, sin controles. Un clic lleva
// al mapa completo.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { RELLENO_POR_NIVEL, token, useMapa } from "@/componentes/mapa/useMapa";
import type { Punto } from "@/dominio/geo";
import { nivelIntensidad } from "@/dominio/mapa";
import estilos from "./inicio.module.css";

type Sector = { clave: string; nombre: string; centro: Punto | null; perdidas: number; encontradas: number };

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// Corta para que quepa en celular: el título de la tarjeta dice que son avisos activos por sector.
const etiqueta = (nombre: string, total: number) => `<b>${escapar(nombre)}</b> · ${total}`;

export function MapaMiniatura({ sectores, localidades }: { sectores: Sector[]; localidades: { punto: Punto | null }[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const con = sectores.flatMap((s) => (s.centro ? [{ ...s, centro: s.centro, total: s.perdidas + s.encontradas }] : []));
  const encuadre = [...localidades.flatMap((l) => (l.punto ? [l.punto] : [])), ...con.map((s) => s.centro)];
  const listo = useMapa(contenedor, { encuadre, interactivo: false });

  useEffect(() => {
    if (!listo) return;
    const { L, mapa } = listo;
    const azul = token("color-primary");
    const maximo = Math.max(0, ...con.map((s) => s.total));
    const grupo = L.layerGroup().addTo(mapa);
    // Las etiquetas de los sectores al oeste van a la izquierda y las del este a la derecha, para no taparse.
    const medio = con.reduce((t, s) => t + s.centro.lng, 0) / Math.max(con.length, 1);
    for (const s of con) {
      const nivel = nivelIntensidad(s.total, maximo);
      L.circleMarker([s.centro.lat, s.centro.lng], {
        radius: s.total ? 6 + 10 * Math.sqrt(s.total / Math.max(maximo, 1)) : 4,
        color: azul,
        weight: 2,
        fillColor: nivel === 0 ? token("color-surface") : azul,
        fillOpacity: nivel === 0 ? 1 : RELLENO_POR_NIVEL[nivel],
        interactive: false,
      })
        .bindTooltip(etiqueta(s.nombre, s.total), { permanent: true, ...(s.centro.lng < medio ? { direction: "left", offset: [-8, 0] } : { direction: "right", offset: [8, 0] }), className: "etiqueta-mapa etiqueta-mini" })
        .addTo(grupo);
    }
    const abrir = () => router.push("/mapa");
    mapa.on("click", abrir);
    return () => {
      mapa.off("click", abrir);
      grupo.remove();
    };
    // `con` se deriva de las props; basta con redibujar si cambian los sectores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, sectores, router]);

  return <div ref={contenedor} className={estilos.miniMapa} aria-hidden="true" />;
}
