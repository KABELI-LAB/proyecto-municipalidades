/**
 * Mapa Leaflet + OpenStreetMap (sin claves de API). Se carga bajo demanda
 * (React.lazy) para que el cuestionario abra rápido con mala conexión.
 * leaflet.css es global pero todas sus clases llevan el prefijo `leaflet-`.
 *
 * El mapa no se mueve cuando tocas: el pin cae donde tocaste. Solo se centra
 * cuando el punto llega del GPS o de una sugerencia (`enfocar` cambia).
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { COMUNAS, dentroDeComuna, type ComunaId } from '../../shared/ubicacion.ts'
import s from '../styles/cuestionario.module.css'

interface Props {
  /** Comuna del municipio elegido en el sitio: centro, límites y nombre del mapa. */
  comuna: ComunaId
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  /** Se tocó o arrastró fuera de la comuna. */
  onFuera: () => void
  /** Cambia cada vez que llega un punto del GPS o de una sugerencia: el mapa se centra en él. */
  enfocar: number
  menosMovimiento: boolean
}

export default function MapaUbicacion({ comuna, lat, lng, onChange, onFuera, enfocar, menosMovimiento }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const pin = useRef<L.Marker | null>(null)
  const callbacks = useRef({ onChange, onFuera, comuna })
  useEffect(() => {
    callbacks.current = { onChange, onFuera, comuna }
  })

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!contenedor.current || mapa.current) return
    const { limites: l, centro } = COMUNAS[comuna]
    const limites = L.latLngBounds([l.sur, l.oeste], [l.norte, l.este])
    const m = L.map(contenedor.current, { maxBounds: limites.pad(0.1), maxBoundsViscosity: 1, minZoom: 11 }).setView(
      lat !== null && lng !== null ? [lat, lng] : centro,
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
    // lat/lng solo importan para la vista inicial; la comuna no cambia durante el cuestionario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function elegir(p: L.LatLng) {
    if (!dentroDeComuna(callbacks.current.comuna, p.lat, p.lng)) {
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

  // GPS o sugerencia: centrar en el punto recibido.
  useEffect(() => {
    if (!enfocar || lat === null || lng === null) return
    mapa.current?.setView([lat, lng], 17, { animate: !menosMovimiento })
    // Solo reacciona a una nueva lectura del GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enfocar])

  return <div ref={contenedor} className={s.mapa} role="application" aria-label={`Mapa de ${COMUNAS[comuna].nombre}. Toca tu casa o arrastra el pin para ajustar la ubicación.`} />
}

/** 6 decimales (~10 cm), como la columna numeric(9,6). */
function redondear(v: number): number {
  return Math.round(v * 1e6) / 1e6
}
