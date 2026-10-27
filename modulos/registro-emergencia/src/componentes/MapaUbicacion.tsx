/**
 * Mapa Leaflet + OpenStreetMap (sin claves de API). Se carga bajo demanda
 * (React.lazy) para que el cuestionario abra rápido con mala conexión.
 * leaflet.css es global pero todas sus clases llevan el prefijo `leaflet-`.
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import s from '../styles/cuestionario.module.css'

/** Centro aproximado de Hualañé. */
const CENTRO_HUALANE: [number, number] = [-34.9766, -71.8044]

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  menosMovimiento: boolean
}

export default function MapaUbicacion({ lat, lng, onChange, menosMovimiento }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const pin = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!contenedor.current || mapa.current) return
    const m = L.map(contenedor.current, { zoomControl: true, attributionControl: true }).setView(CENTRO_HUALANE, 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    // Clic o toque en el mapa mueve el pin.
    m.on('click', (e: L.LeafletMouseEvent) => onChangeRef.current(redondear(e.latlng.lat), redondear(e.latlng.lng)))
    mapa.current = m
    return () => {
      m.remove()
      mapa.current = null
      pin.current = null
    }
  }, [])

  useEffect(() => {
    const m = mapa.current
    if (!m || lat === null || lng === null) return
    if (!pin.current) {
      const icono = L.divIcon({ className: s.pinMapa ?? '', html: '<span></span>', iconSize: [32, 40], iconAnchor: [16, 40] })
      pin.current = L.marker([lat, lng], { draggable: true, icon: icono, keyboard: true, title: 'Ubicación de tu casa. Arrastra para ajustar.' }).addTo(m)
      pin.current.on('dragend', () => {
        const p = pin.current?.getLatLng()
        if (p) onChangeRef.current(redondear(p.lat), redondear(p.lng))
      })
      m.setView([lat, lng], 17, { animate: !menosMovimiento })
    } else {
      pin.current.setLatLng([lat, lng])
    }
  }, [lat, lng, menosMovimiento])

  return <div ref={contenedor} className={s.mapa} role="application" aria-label="Mapa. Toca tu casa o arrastra el pin para ajustar la ubicación." />
}

/** 6 decimales (~10 cm), como la columna numeric(9,6). */
function redondear(v: number): number {
  return Math.round(v * 1e6) / 1e6
}
