'use client'

import { useEffect, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const MADEIRA_CENTER: [number, number] = [32.75, -16.95]
const MADEIRA_ZOOM = 10

type MapFilter = 'all' | 'stays' | 'beaches' | 'food'

const FILTERS: Array<{ key: MapFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'stays', label: 'Stays' },
  { key: 'beaches', label: 'Beaches' },
  { key: 'food', label: 'Food' },
]

interface MapStay {
  id: string | number
  slug: string
  title: string
  lat: number
  lng: number
  pricePerNight?: number | null
  coverImage?: string | null
}

interface MapBeach {
  id: string | number
  slug: string
  name: string
  lat: number
  lng: number
  heroImage?: string | null
}

interface MapRestaurant {
  id: string | number
  slug: string
  name: string
  lat: number
  lng: number
  cuisine?: string | null
  averagePrice?: number | null
  heroImage?: string | null
}

interface ExploreMapProps {
  properties: MapStay[]
  beaches: MapBeach[]
  restaurants: MapRestaurant[]
  activeFilter?: MapFilter
}

export default function ExploreMap({
  properties,
  beaches,
  restaurants,
  activeFilter = 'all',
}: ExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const layerRef = useRef<Leaflet.LayerGroup | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const [filter, setFilter] = useState<MapFilter>(activeFilter)
  const [ready, setReady] = useState(false)

  // Map init — leaflet/maplibre are imported lazily so SSR never touches `window`
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    const init = async () => {
      const L = await import('leaflet')
      const { setWorkerUrl } = await import('maplibre-gl')
      const { maplibreGL } = await import('@maplibre/maplibre-gl-leaflet')
      if (cancelled || !containerRef.current || mapRef.current) return

      // Next.js webpack breaks maplibre's import.meta.url worker resolution;
      // serve the worker from public/ instead.
      setWorkerUrl('/vendor/maplibre-gl-worker.mjs')

      const map = L.map(containerRef.current, {
        center: MADEIRA_CENTER,
        zoom: MADEIRA_ZOOM,
        scrollWheelZoom: false,
      })
      maplibreGL({ style: OPENFREEMAP_STYLE }).addTo(map)

      leafletRef.current = L
      mapRef.current = map
      layerRef.current = L.layerGroup().addTo(map)
      setReady(true)
    }

    init()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
      leafletRef.current = null
    }
  }, [])

  // Rebuild markers whenever the layer filter or the data changes
  useEffect(() => {
    const L = leafletRef.current
    const layer = layerRef.current
    if (!ready || !L || !layer) return

    layer.clearLayers()

    const pin = (bg: string, emoji: string) =>
      L.divIcon({
        className: 'explore-pin',
        html: `<div style="width:34px;height:34px;border-radius:9999px;background:${bg};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;cursor:pointer;">${emoji}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })

    const addPin = (lat: number, lng: number, icon: Leaflet.DivIcon, title: string, href: string) => {
      const marker = L.marker([lat, lng], { icon, title })
      marker.on('click', () => {
        window.location.href = href
      })
      marker.addTo(layer)
    }

    if (filter === 'all' || filter === 'stays') {
      const icon = pin('#10b981', '🏠')
      properties.forEach((p) => addPin(p.lat, p.lng, icon, p.title, `/p/${p.slug}`))
    }
    if (filter === 'all' || filter === 'beaches') {
      const icon = pin('#3b82f6', '🏖️')
      beaches.forEach((b) => addPin(b.lat, b.lng, icon, b.name, `/beaches/${b.slug}`))
    }
    if (filter === 'all' || filter === 'food') {
      const icon = pin('#d4af37', '🍽️')
      restaurants.forEach((r) =>
        addPin(r.lat, r.lng, icon, r.name, `/restaurants/${r.slug}`),
      )
    }
  }, [ready, filter, properties, beaches, restaurants])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-1/2 top-3 z-[1001] flex -translate-x-1/2 gap-1 rounded-full border border-white/15 bg-[#0a1420]/90 p-1 backdrop-blur">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
              filter === f.key
                ? 'bg-[#d4af37] text-[#0a1420]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
