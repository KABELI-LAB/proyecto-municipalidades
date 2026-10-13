"use client";
// Mapa base real (OpenStreetMap con Leaflet) para el portal y el panel.
// Leaflet usa `window`: se carga solo en el navegador, dentro de un efecto.
// El acercamiento máximo se limita para que se vean calles y localidades,
// pero no casas una por una (CLAUDE.md: el mapa no muestra direcciones).
import type * as Leaflet from "leaflet";
import { useEffect, useState, type RefObject } from "react";
import type { Punto } from "@/dominio/geo";
import { ubicarEtiquetas, type Lado } from "@/dominio/mapa";
import "leaflet/dist/leaflet.css";
import "./mapa-base.css";

export type L = typeof Leaflet;
export type MapaListo = { L: L; mapa: Leaflet.Map };

/** Acercamiento máximo: barrio y calles, nunca el detalle de una vivienda. */
export const ZOOM_MAXIMO = 14;

const TESELAS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

type Opciones = {
  /** Puntos que deben quedar a la vista al abrir el mapa (la comuna). */
  encuadre: Punto[];
  interactivo?: boolean;
};

export function useMapa(ref: RefObject<HTMLDivElement | null>, { encuadre, interactivo = true }: Opciones): MapaListo | null {
  const [listo, setListo] = useState<MapaListo | null>(null);

  useEffect(() => {
    let vivo = true;
    let mapa: Leaflet.Map | null = null;
    import("leaflet").then(({ default: L }) => {
      if (!vivo || !ref.current) return;
      const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      mapa = L.map(ref.current, {
        zoomControl: interactivo,
        dragging: interactivo,
        touchZoom: interactivo,
        doubleClickZoom: interactivo,
        boxZoom: interactivo,
        keyboard: interactivo,
        // La rueda del mouse no se roba el desplazamiento de la página: se acerca con los botones o con doble clic.
        scrollWheelZoom: false,
        maxZoom: ZOOM_MAXIMO,
        attributionControl: true,
        // Sin fundidos ni zoom animado si la persona prefiere reducir el movimiento.
        fadeAnimation: !reducirMovimiento,
        zoomAnimation: !reducirMovimiento,
        markerZoomAnimation: !reducirMovimiento,
      });
      L.tileLayer(TESELAS, { maxZoom: ZOOM_MAXIMO, attribution: ATRIBUCION }).addTo(mapa);
      const limites = L.latLngBounds(encuadre.map((p) => [p.lat, p.lng] as [number, number]));
      mapa.fitBounds(limites, { padding: [24, 24] });
      mapa.setMinZoom(Math.max(0, mapa.getZoom() - 2));
      mapa.setMaxBounds(limites.pad(1.5));
      setListo({ L, mapa });
    });
    return () => {
      vivo = false;
      mapa?.remove();
    };
    // El mapa se crea una sola vez; el encuadre inicial no cambia después.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return listo;
}

/** Color de un token del sistema de diseño (por ejemplo, «azul-institucional»). */
export function token(nombre: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim();
}

/** Opacidad del relleno según la intensidad (0 = sin registros), igual en todos los mapas. */
export const RELLENO_POR_NIVEL = [0, 0.3, 0.6, 0.9] as const;

const DIRECCION: Record<Lado, Leaflet.Direction> = { derecha: "right", izquierda: "left", abajo: "bottom", arriba: "top" };
const PIXELES_POR_LETRA = 7.5;
const ALTO_ETIQUETA = 40;

/**
 * Etiquetas permanentes junto a cada círculo, del lado donde no tapen otros
 * círculos ni etiquetas. Se recalcula al acercar o alejar el mapa.
 */
export function ubicarTooltips(mapa: Leaflet.Map, marcas: { marca: Leaflet.CircleMarker; radio: number; texto: string[] }[]) {
  const tamano = mapa.getSize();
  const lados = ubicarEtiquetas(
    marcas.map((m) => {
      const p = mapa.latLngToContainerPoint(m.marca.getLatLng());
      return { x: p.x, y: p.y, r: m.radio, ancho: Math.max(...m.texto.map((t) => t.length)) * PIXELES_POR_LETRA + 16, alto: ALTO_ETIQUETA };
    }),
    tamano.x,
    tamano.y,
  );
  marcas.forEach((m, i) => {
    const lado = lados[i];
    const d = m.radio + 2;
    const offset: [number, number] = lado === "derecha" ? [d, 0] : lado === "izquierda" ? [-d, 0] : lado === "abajo" ? [0, d] : [0, -d];
    m.marca.unbindTooltip();
    m.marca.bindTooltip(m.texto.map((t, j) => (j === 0 ? `<b>${escapar(t)}</b>` : `<span>${escapar(t)}</span>`)).join("<br>"), {
      permanent: true,
      direction: DIRECCION[lado],
      offset,
      className: "etiqueta-mapa",
    });
  });
}

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
