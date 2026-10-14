'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { setWorkerUrl } from 'maplibre-gl'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'

// Next.js webpack breaks maplibre's import.meta.url worker resolution;
// serve the worker from public/ instead.
setWorkerUrl('/vendor/maplibre-gl-worker.mjs')

const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/dark'

interface PropertyMapProps {
  latitude: number
  longitude: number
  title: string
  imageUrl?: string
}

export default function PropertyMap({ latitude, longitude, title, imageUrl }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      scrollWheelZoom: false,
    })

    // OpenFreeMap via MapLibre GL (vector tiles)
    maplibreGL({ style: OPENFREEMAP_STYLE }).addTo(map)

    const popupHtml = imageUrl
      ? `<div style="font-family: 'Cormorant Garamond', serif; font-size: 15px; text-align: center;">
           <img src="${imageUrl}" alt="${title}" style="width: 180px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; display: block;" />
           <div style="color: #111827; font-weight: 500;">${title}</div>
         </div>`
      : `<div style="font-family: 'Cormorant Garamond', serif; font-size: 15px; color: #111827;">${title}</div>`

    L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(popupHtml, { maxWidth: 220 })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [latitude, longitude, title])

  return <div ref={containerRef} className="w-full h-[400px] rounded-xl overflow-hidden border border-white/10" />
}
