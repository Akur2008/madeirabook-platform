'use client'

import { useEffect, useRef } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const MADEIRA_CENTER: [number, number] = [32.75, -16.95]
const MADEIRA_ZOOM = 10

interface PinLocationPickerProps {
  value: { lat: number; lng: number } | null
  onChange: (coords: { lat: number; lng: number }) => void
}

export default function PinLocationPicker({
  value,
  onChange,
}: PinLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markerRef = useRef<Leaflet.Marker | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    const init = async () => {
      const L = await import('leaflet')
      const { setWorkerUrl } = await import('maplibre-gl')
      const { maplibreGL } = await import('@maplibre/maplibre-gl-leaflet')
      if (cancelled || !containerRef.current || mapRef.current) return

      setWorkerUrl('/vendor/maplibre-gl-worker.mjs')

      const map = L.map(containerRef.current, {
        center: MADEIRA_CENTER,
        zoom: MADEIRA_ZOOM,
      })
      maplibreGL({ style: OPENFREEMAP_STYLE }).addTo(map)

      map.on('click', (e: Leaflet.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        const icon = L.divIcon({
          className: 'pin-picker-marker',
          html: '<div style="width:26px;height:26px;border-radius:9999px;background:#d4af37;border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">⭐</div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map)
        }
        onChangeRef.current({ lat, lng })
      })

      leafletRef.current = L
      mapRef.current = map
    }

    init()

    return () => {
      cancelled = true
      markerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      leafletRef.current = null
    }
  }, [])

  // External value reset (e.g. after submit) — drop the marker.
  useEffect(() => {
    if (value === null && markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="h-56 w-full overflow-hidden rounded-lg border border-white/15"
    />
  )
}
