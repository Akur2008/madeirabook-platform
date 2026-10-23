'use client'

import { useEffect, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

import FloatingPointCards, { pickTeasers, type MapTeaser } from './FloatingPointCards'
import PointPreviewSheet, { type PointPreview, type PointType } from './PointPreviewSheet'

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'
const MADEIRA_CENTER: [number, number] = [32.75, -16.95]
const MADEIRA_ZOOM = 10
// At this zoom pins switch from emoji icons to photo circles
const PHOTO_ZOOM = 12

type MapFilter = 'all' | 'stays' | 'beaches' | 'food' | 'trails' | 'views'

const FILTERS: Array<{ key: MapFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'stays', label: 'Stays' },
  { key: 'beaches', label: 'Beaches' },
  { key: 'food', label: 'Food' },
  { key: 'trails', label: 'Trails' },
  { key: 'views', label: 'Views' },
]

const TYPE_STYLE: Record<PointType, { color: string; emoji: string }> = {
  property: { color: '#10b981', emoji: '🏠' },
  beach: { color: '#3b82f6', emoji: '🏖️' },
  restaurant: { color: '#d4af37', emoji: '🍽️' },
  trail: { color: '#f97316', emoji: '🥾' },
  viewpoint: { color: '#a855f7', emoji: '👁️' },
  community: { color: '#d4af37', emoji: '⭐' },
}

interface MapStay {
  id: string | number
  slug: string
  title: string
  lat: number
  lng: number
  pricePerNight?: number | null
  coverImage?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  shortDescription?: string | null
  meta?: string | null
  address?: string | null
  featured?: boolean | null
  // Per the pricingScenario manifest — false hides the price/book block on
  // the pin card (display_only stays like Orquídea).
  bookable?: boolean | null
}

interface MapBeach {
  id: string | number
  slug: string
  name: string
  lat: number
  lng: number
  heroImage?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  shortDescription?: string | null
  meta?: string | null
  featured?: boolean | null
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
  photoUrl?: string | null
  videoUrl?: string | null
  shortDescription?: string | null
  meta?: string | null
  featured?: boolean | null
}

interface MapTrail {
  id: string | number
  slug: string
  name: string
  lat: number
  lng: number
  distanceKm?: number | null
  difficulty?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  shortDescription?: string | null
  meta?: string | null
  featured?: boolean | null
}

interface MapViewpoint {
  id: string | number
  slug: string
  name: string
  lat: number
  lng: number
  elevationM?: number | null
  type?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  shortDescription?: string | null
  meta?: string | null
  featured?: boolean | null
}

interface MapCommunityPin {
  id: string | number
  title: string
  lat: number
  lng: number
  photoUrl?: string | null
  videoUrl?: string | null
  shortDescription?: string | null
  addedBy?: string | null
  refCode?: string | null
}

interface ExploreMapInteractiveProps {
  properties: MapStay[]
  beaches: MapBeach[]
  restaurants: MapRestaurant[]
  trails?: MapTrail[]
  viewpoints?: MapViewpoint[]
  communityPins?: MapCommunityPin[]
  activeFilter?: MapFilter
  initialLat?: number
  initialLng?: number
  initialZoom?: number
}

interface MapPoint extends PointPreview {
  key: string
  featured?: boolean | null
}

// "Featured only" mode: keep just the flagged pins, but never empty a
// category whose editors haven't marked anything yet.
const pickFeatured = <T extends { featured?: boolean | null }>(items: T[]) =>
  items.some((i) => i.featured) ? items.filter((i) => i.featured) : items

interface MarkerEntry {
  marker: Leaflet.Marker
  point: MapPoint
  mode: 'icon' | 'photo'
  iconIcon: Leaflet.DivIcon
  photoIcon: Leaflet.DivIcon | null
}

export default function ExploreMapInteractive({
  properties,
  beaches,
  restaurants,
  trails = [],
  viewpoints = [],
  communityPins = [],
  activeFilter = 'all',
  initialLat,
  initialLng,
  initialZoom,
}: ExploreMapInteractiveProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const layerRef = useRef<Leaflet.LayerGroup | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map())
  // Holds the latest icon-sync closure so map event handlers stay stable
  const syncRef = useRef<() => void>(() => {})
  // Fires once: auto-open the corner teaser cards on the initial load
  const autoOpenedRef = useRef(false)
  const [filter, setFilter] = useState<MapFilter>(activeFilter)
  // Default decluttered map — "All points" opt-in brings back everything.
  const [showAll, setShowAll] = useState(false)
  const [ready, setReady] = useState(false)
  const [preview, setPreview] = useState<PointPreview | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [teasers, setTeasers] = useState<MapTeaser[]>([])

  // Map init — leaflet/maplibre are imported lazily so SSR never touches `window`
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const markers = markersRef.current
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
        center:
          initialLat != null && initialLng != null
            ? [initialLat, initialLng]
            : MADEIRA_CENTER,
        zoom: initialZoom ?? MADEIRA_ZOOM,
        scrollWheelZoom: false,
      })
      maplibreGL({ style: OPENFREEMAP_STYLE }).addTo(map)

      const onViewChange = () => syncRef.current()
      map.on('zoomend', onViewChange)
      map.on('moveend', onViewChange)

      // Teaser cards hide the moment the visitor takes over the map.
      map.on('movestart', () =>
        setTeasers((ts) => (ts.length ? [] : ts)),
      )

      // Debug hook so E2E/screenshot scripts can drive the map
      ;(window as unknown as { __exploreMap?: Leaflet.Map }).__exploreMap = map

      leafletRef.current = L
      mapRef.current = map
      layerRef.current = L.layerGroup().addTo(map)
      setReady(true)
    }

    init()

    return () => {
      cancelled = true
      markers.clear()
      delete (window as unknown as { __exploreMap?: Leaflet.Map }).__exploreMap
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
      leafletRef.current = null
    }
  }, [initialLat, initialLng, initialZoom])

  // Rebuild markers whenever the layer filter or the data changes
  useEffect(() => {
    const L = leafletRef.current
    const layer = layerRef.current
    if (!ready || !L || !layer) return

    layer.clearLayers()
    markersRef.current.clear()

    const emojiIcon = (color: string, emoji: string) =>
      L.divIcon({
        className: 'explore-pin',
        html: `<div style="width:32px;height:32px;border-radius:9999px;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;cursor:pointer;">${emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

    const photoIcon = (color: string, emoji: string, url: string) =>
      L.divIcon({
        className: 'explore-pin explore-pin-photo',
        html: `<div style="position:relative;width:48px;height:48px;"><div style="width:48px;height:48px;border-radius:9999px;background:#0a1420 url(&quot;${url}&quot;) center/cover no-repeat;border:2px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div><div style="position:absolute;right:-3px;bottom:-3px;width:18px;height:18px;border-radius:9999px;background:${color};border:1.5px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:10px;line-height:1;">${emoji}</div></div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })

    const points: MapPoint[] = []
    const push = (
      type: PointType,
      item: {
        id: string | number
        slug: string
        lat: number
        lng: number
        photoUrl?: string | null
        videoUrl?: string | null
        shortDescription?: string | null
        meta?: string | null
        addedBy?: string | null
        href?: string | null
        address?: string | null
        featured?: boolean | null
        bookable?: boolean | null
      },
      name: string,
    ) =>
      points.push({
        key: `${type}:${item.id}`,
        type,
        slug: item.slug,
        name,
        lat: item.lat,
        lng: item.lng,
        featured: item.featured,
        photoUrl: item.photoUrl ?? null,
        videoUrl: item.videoUrl ?? null,
        shortDescription: item.shortDescription ?? null,
        meta: item.meta ?? null,
        addedBy: item.addedBy ?? null,
        href: item.href,
        address: item.address ?? null,
        bookable: item.bookable ?? null,
      })

    const shownStays = showAll ? properties : pickFeatured(properties)
    const shownBeaches = showAll ? beaches : pickFeatured(beaches)
    const shownRestaurants = showAll ? restaurants : pickFeatured(restaurants)
    const shownTrails = showAll ? trails : pickFeatured(trails)
    const shownViewpoints = showAll ? viewpoints : pickFeatured(viewpoints)

    if (filter === 'all' || filter === 'stays') {
      shownStays.forEach((p) =>
        push(
          'property',
          { ...p, photoUrl: p.photoUrl ?? p.coverImage, bookable: p.bookable ?? null },
          p.title,
        ),
      )
    }
    if (filter === 'all' || filter === 'beaches') {
      shownBeaches.forEach((b) =>
        push('beach', { ...b, photoUrl: b.photoUrl ?? b.heroImage }, b.name),
      )
    }
    if (filter === 'all' || filter === 'food') {
      shownRestaurants.forEach((r) =>
        push('restaurant', { ...r, photoUrl: r.photoUrl ?? r.heroImage }, r.name),
      )
    }
    if (filter === 'all' || filter === 'trails') {
      shownTrails.forEach((t) => push('trail', t, t.name))
    }
    if (filter === 'all' || filter === 'views') {
      shownViewpoints.forEach((v) => push('viewpoint', v, v.name))
    }
    if (filter === 'all') {
      communityPins.forEach((p) =>
        push(
          'community',
          {
            id: p.id,
            slug: '',
            lat: p.lat,
            lng: p.lng,
            photoUrl: p.photoUrl,
            videoUrl: p.videoUrl,
            shortDescription: p.shortDescription,
            addedBy: p.addedBy,
            href: p.refCode ? `/m/${p.refCode}` : null,
          },
          p.title,
        ),
      )
    }

    points.forEach((point) => {
      const { color, emoji } = TYPE_STYLE[point.type]
      const iconIcon = emojiIcon(color, emoji)
      const marker = L.marker([point.lat, point.lng], { icon: iconIcon, title: point.name })
      marker.on('click', () => {
        setPreview({
          type: point.type,
          slug: point.slug,
          name: point.name,
          lat: point.lat,
          lng: point.lng,
          photoUrl: point.photoUrl,
          videoUrl: point.videoUrl,
          shortDescription: point.shortDescription,
          meta: point.meta,
          addedBy: point.addedBy,
          href: point.href,
          address: point.address,
          bookable: point.bookable,
        })
        setSheetOpen(true)
      })
      marker.addTo(layer)
      markersRef.current.set(point.key, {
        marker,
        point,
        mode: 'icon',
        iconIcon,
        photoIcon: null,
      })
    })

    // Swap icon ↔ photo on existing markers only; photos load solely for
    // pins inside the current viewport so mobile never fetches all 92.
    const syncIcons = () => {
      const map = mapRef.current
      if (!map) return
      const photoMode = map.getZoom() >= PHOTO_ZOOM
      const bounds = map.getBounds().pad(0.15)
      markersRef.current.forEach((entry) => {
        const wantPhoto =
          photoMode &&
          Boolean(entry.point.photoUrl) &&
          bounds.contains(entry.marker.getLatLng())
        const mode = wantPhoto ? 'photo' : 'icon'
        if (entry.mode === mode) return
        entry.mode = mode
        if (mode === 'photo') {
          if (!entry.photoIcon) {
            const { color, emoji } = TYPE_STYLE[entry.point.type]
            entry.photoIcon = photoIcon(
              color,
              emoji,
              String(entry.point.photoUrl).replace(/["'()\\]/g, ''),
            )
          }
          entry.marker.setIcon(entry.photoIcon)
        } else {
          entry.marker.setIcon(entry.iconIcon)
        }
      })
    }

    syncRef.current = syncIcons
    syncIcons()

    // Auto-open a few corner teaser cards once the initial map settles so
    // the map reads as alive, not just pins. Skipped on lat/lng deep
    // links — the visitor came for a specific spot, don't cover it with
    // cards. The ref flips when the timer fires, not on schedule, so a
    // StrictMode remount or an early filter change just re-arms the open.
    let autoOpenTimer: ReturnType<typeof setTimeout> | undefined
    if (
      !autoOpenedRef.current &&
      initialLat == null &&
      initialLng == null &&
      points.length
    ) {
      autoOpenTimer = setTimeout(() => {
        autoOpenedRef.current = true
        setTeasers(pickTeasers(points))
      }, 600)
    }

    return () => {
      if (autoOpenTimer) clearTimeout(autoOpenTimer)
    }
  }, [ready, filter, showAll, properties, beaches, restaurants, trails, viewpoints, communityPins, initialLat, initialLng])

  const openTeaser = (t: MapTeaser) => {
    setTeasers((ts) => ts.filter((x) => x.key !== t.key))
    setPreview(t)
    setSheetOpen(true)
  }

  const dismissTeaser = (key: string) =>
    setTeasers((ts) => ts.filter((x) => x.key !== key))

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {/* Scrollable strip: the pill stays centered while it fits; on
          narrow phones it scrolls instead of clipping off-screen left. */}
      <div className="absolute inset-x-0 top-3 z-[1001] overflow-x-auto px-4">
        <div className="flex w-max min-w-full justify-center">
          <div className="flex gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                  filter === f.key
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Density toggle — featured curation by default, all points on tap */}
      <div className="absolute left-1/2 top-14 z-[1001] flex -translate-x-1/2 gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur">
        <button
          type="button"
          aria-pressed={!showAll}
          onClick={() => setShowAll(false)}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            !showAll ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Featured only
        </button>
        <button
          type="button"
          aria-pressed={showAll}
          onClick={() => setShowAll(true)}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            showAll ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Show all points
        </button>
      </div>
      <FloatingPointCards
        teasers={teasers}
        onSelect={openTeaser}
        onDismiss={dismissTeaser}
      />
      <PointPreviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        point={preview}
      />
    </div>
  )
}
