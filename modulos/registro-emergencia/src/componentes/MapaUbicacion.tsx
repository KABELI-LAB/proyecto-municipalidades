/**
 * Mapa Leaflet + OpenStreetMap (sin claves de API). Se carga bajo demanda
 * (React.lazy) para que el cuestionario abra rápido con mala conexión.
 * leaflet.css es global pero todas sus clases llevan el prefijo `leaflet-`.
 *
 * El mapa no se mueve cuando tocas: el pin cae donde tocaste. Solo se centra
 * cuando la ubicación llega del GPS (`enfocar` cambia).
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { CENTRO_HUALANE, dentroDeHualane, LIMITES_HUALANE } from '../../shared/ubicacion.ts'
import s from '../styles/cuestionario.module.css'

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  /** Se tocó o arrastró fuera de la comuna. */
  onFuera: () => void
  /** Cambia cada vez que el GPS entrega una ubicación: el mapa se centra en ella. */
  enfocar: number
  menosMovimiento: boolean
}

export default function MapaUbicacion({ lat, lng, onChange, onFuera, enfocar, menosMovimiento }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const pin = useRef<L.Marker | null>(null)
  const callbacks = useRef({ onChange, onFuera })
  useEffect(() => {
    callbacks.current = { onChange, onFuera }
  })

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!contenedor.current || mapa.current) return
    const l = LIMITES_HUALANE
    const limites = L.latLngBounds([l.sur, l.oeste], [l.norte, l.este])
    const m = L.map(contenedor.current, { maxBounds: limites.pad(0.1), maxBoundsViscosity: 1, minZoom: 11 }).setView(
      lat !== null && lng !== null ? [lat, lng] : CENTRO_HUALANE,
      lat !== null ? 17 : 14,
    )
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => elegir(e.latlng))
    mapa.current = m
    // El paso entra con una animación y en celular el mapa toma el alto libre:
    // cuando cambia su tamaño, Leaflet recalcula los mosaicos.
    const t = setTimeout(() => m.invalidateSize(), 350)
    const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => m.invalidateSize()) : null
    observador?.observe(contenedor.current)
    return () => {
      clearTimeout(t)
      observador?.disconnect()
      m.remove()
      mapa.current = null
      pin.current = null
    }
    // lat/lng solo importan para la vista inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function elegir(p: L.LatLng) {
    if (!dentroDeHualane(p.lat, p.lng)) {
      callbacks.current.onFuera()
      return
    }
    callbacks.current.onChange(redondear(p.lat), redondear(p.lng))
  }

  // Mostrar o mover el pin. Nunca mueve la vista.
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    if (lat === null || lng === null) {
      pin.current?.remove()
      pin.current = null
      return
    }
    if (!pin.current) {
      const icono = L.divIcon({ className: s.pinMapa ?? '', html: '<span></span>', iconSize: [32, 40], iconAnchor: [16, 40] })
      pin.current = L.marker([lat, lng], { draggable: true, icon: icono, keyboard: true, title: 'Ubicación de tu casa. Arrastra para ajustar.' }).addTo(m)
      pin.current.on('dragend', () => {
        const p = pin.current?.getLatLng()
        if (p) elegir(p)
      })
    } else {
      pin.current.setLatLng([lat, lng])
    }
  }, [lat, lng])

  // GPS: centrar en la ubicación recibida.
  useEffect(() => {
    if (!enfocar || lat === null || lng === null) return
    mapa.current?.setView([lat, lng], 17, { animate: !menosMovimiento })
    // Solo reacciona a una nueva lectura del GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enfocar])

  return <div ref={contenedor} className={s.mapa} role="application" aria-label="Mapa de Hualañé. Toca tu casa o arrastra el pin para ajustar la ubicación." />
}

/** 6 decimales (~10 cm), como la columna numeric(9,6). */
function redondear(v: number): number {
  return Math.round(v * 1e6) / 1e6
}
