'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

import BookingDrawer from './BookingDrawer'

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const MADEIRA_CENTER: [number, number] = [32.75, -16.95]
const MADEIRA_ZOOM = 10
const ESCAPE_CARD_URL = '/api/escape-card'
const FALLBACK_CITY = 'Lisbon'

type MapFilter = 'all' | 'stays' | 'beaches' | 'food' | 'trails' | 'views'

const FILTERS: Array<{ key: MapFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'stays', label: 'Stays' },
  { key: 'beaches', label: 'Beaches' },
  { key: 'food', label: 'Food' },
  { key: 'trails', label: 'Trails' },
  { key: 'views', label: 'Views' },
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

interface MapTrail {
  id: string | number
  slug: string
  name: string
  lat: number
  lng: number
  distanceKm?: number | null
  difficulty?: string | null
}

interface MapViewpoint {
  id: string | number
  slug: string
  name: string
  lat: number
  lng: number
  elevationM?: number | null
  type?: string | null
}

interface AmbassadorBranding {
  displayName: string
  avatarUrl?: string | null
  accentColor?: string | null
  selectedBeachesSlugs?: string[]
  selectedRestaurantsSlugs?: string[]
}

interface ExploreMapProps {
  properties: MapStay[]
  beaches: MapBeach[]
  restaurants: MapRestaurant[]
  trails?: MapTrail[]
  viewpoints?: MapViewpoint[]
  activeFilter?: MapFilter
  ambassador?: AmbassadorBranding | null
}

export default function ExploreMap({
  properties,
  beaches,
  restaurants,
  trails = [],
  viewpoints = [],
  activeFilter = 'all',
  ambassador = null,
}: ExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const layerRef = useRef<Leaflet.LayerGroup | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const router = useRouter()
  const [filter, setFilter] = useState<MapFilter>(activeFilter)
  const [ready, setReady] = useState(false)
  const [escapeCity, setEscapeCity] = useState(FALLBACK_CITY)
  const [escapeOpen, setEscapeOpen] = useState(false)

  // Same geo-city lookup as the hero EscapeCard (/api/escape-card reads
  // Vercel IP headers; falls back to Lisbon when unknown).
  useEffect(() => {
    fetch(ESCAPE_CARD_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.city === 'string' && d.city) setEscapeCity(d.city)
      })
      .catch(() => undefined)
  }, [])

  // Ambassador curation: empty/missing lists mean "show everything"
  const visibleBeaches = useMemo(() => {
    const slugs = ambassador?.selectedBeachesSlugs
    if (!slugs?.length) return beaches
    const set = new Set(slugs)
    return beaches.filter((b) => set.has(b.slug))
  }, [beaches, ambassador])

  const visibleRestaurants = useMemo(() => {
    const slugs = ambassador?.selectedRestaurantsSlugs
    if (!slugs?.length) return restaurants
    const set = new Set(slugs)
    return restaurants.filter((r) => set.has(r.slug))
  }, [restaurants, ambassador])

  const resetBranding = () => {
    document.cookie = 'madeirabook_ref=; path=/; max-age=0'
    router.push('/')
  }

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
      const icon = pin(ambassador?.accentColor || '#3b82f6', '🏖️')
      visibleBeaches.forEach((b) => addPin(b.lat, b.lng, icon, b.name, `/beaches/${b.slug}`))
    }
    if (filter === 'all' || filter === 'food') {
      const icon = pin('#d4af37', '🍽️')
      visibleRestaurants.forEach((r) =>
        addPin(r.lat, r.lng, icon, r.name, `/restaurants/${r.slug}`),
      )
    }
    if (filter === 'all' || filter === 'trails') {
      const icon = pin('#f97316', '🥾')
      trails.forEach((t) => addPin(t.lat, t.lng, icon, t.name, `/trails/${t.slug}`))
    }
    if (filter === 'all' || filter === 'views') {
      const icon = pin('#a855f7', '👁️')
      viewpoints.forEach((v) =>
        addPin(v.lat, v.lng, icon, v.name, `/viewpoints/${v.slug}`),
      )
    }
  }, [ready, filter, properties, visibleBeaches, visibleRestaurants, trails, viewpoints, ambassador])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {ambassador && (
        <div className="absolute left-3 top-14 z-[1001] flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0a1420]/90 px-3 py-2 backdrop-blur sm:top-3">
          {ambassador.avatarUrl ? (
            // avatarUrl comes from CMS — arbitrary host, plain <img>
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ambassador.avatarUrl}
              alt={ambassador.displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg">
              🧭
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-white">
              {ambassador.displayName}
            </span>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] leading-tight">
              <a
                href="https://www.madeirabook.com"
                className="text-white/45 transition-colors hover:text-white/70"
              >
                Powered by Madeirabook
              </a>
              <button
                type="button"
                onClick={resetBranding}
                className="font-semibold text-[#d4af37] transition-colors hover:text-white"
              >
                See all Madeira →
              </button>
            </div>
          </div>
        </div>
      )}
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
      {/* Bottom-center keeps clear of the fixed WhatsApp/Sound buttons on the
          right edge and Leaflet's attribution corner */}
      <button
        type="button"
        onClick={() => setEscapeOpen(true)}
        className="absolute bottom-4 left-1/2 z-[1001] -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-500/60 bg-[#0a1420]/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur transition-colors hover:border-emerald-400 hover:bg-emerald-600"
      >
        Escape from {escapeCity} →
      </button>
      <BookingDrawer open={escapeOpen} onOpenChange={setEscapeOpen} />
    </div>
  )
}
