'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

import { oasisBase } from '@/lib/oasis-domain'
import GetDirectionsSheet from '@/components/GetDirectionsSheet'
import PointPreviewSheet, {
  type PointPreview,
} from './PointPreviewSheet'

// CartoDB Positron as a vector GL style (same Positron design as the raster
// tiles, but served without the API-key watermark).
const CARTO_POSITRON_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const MADEIRA_CENTER: [number, number] = [32.72, -17.0]
const MADEIRA_ZOOM = 10

export interface OasisHotelPin {
  id: string | number
  slug: string
  title: string
  lat: number
  lng: number
  category?: string | null
  locationName?: string | null
  shortDescription?: string | null
  coverImage?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  address?: string | null
  // Bookable stays (per the pricingScenario manifest) are bookable through
  // the PMS-backed search — the pin card shows a live price for the
  // selected dates. display_only stays show no price and no booking UI.
  bookable?: boolean | null
}

export interface OasisPoiPin {
  id: string | number
  slug: string
  name: string
  kind: 'beach' | 'restaurant'
  lat: number
  lng: number
  subtitle?: string | null
}

interface OasisMapProps {
  hotels: OasisHotelPin[]
  beaches?: OasisPoiPin[]
  restaurants?: OasisPoiPin[]
  initialLat?: number
  initialLng?: number
  initialZoom?: number
}

type LayerKey = 'hotels' | 'beaches' | 'restaurants'

const LAYER_DEFS: Array<{
  key: LayerKey
  label: string
  color: string
  emoji: string
}> = [
  { key: 'hotels', label: 'Hotels', color: '#10b981', emoji: '' },
  { key: 'beaches', label: 'Beaches', color: '#3b82f6', emoji: '🏖' },
  { key: 'restaurants', label: 'Restaurants', color: '#b0562f', emoji: '🍽' },
]

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export default function OasisMap({
  hotels,
  beaches = [],
  restaurants = [],
  initialLat,
  initialLng,
  initialZoom,
}: OasisMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const layerRef = useRef<Leaflet.LayerGroup | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('all')
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    hotels: true,
    beaches: true,
    restaurants: true,
  })
  const [dirTarget, setDirTarget] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(null)
  const [dirOpen, setDirOpen] = useState(false)
  const [preview, setPreview] = useState<PointPreview | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Fires once: auto-open the first pin's card on the initial load
  const autoOpenedRef = useRef(false)

  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          hotels
            .map((h) => h.locationName)
            .filter((l): l is string => Boolean(l)),
        ),
      ).sort(),
    [hotels],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return hotels.filter((h) => {
      if (location !== 'all' && h.locationName !== location) return false
      if (!q) return true
      return (
        h.title.toLowerCase().includes(q) ||
        (h.category ?? '').toLowerCase().includes(q) ||
        (h.locationName ?? '').toLowerCase().includes(q)
      )
    })
  }, [hotels, query, location])

  // Map init — leaflet is imported lazily so SSR never touches `window`
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
        center:
          initialLat != null && initialLng != null
            ? [initialLat, initialLng]
            : MADEIRA_CENTER,
        zoom: initialZoom ?? MADEIRA_ZOOM,
        scrollWheelZoom: false,
      })

      maplibreGL({ style: CARTO_POSITRON_STYLE }).addTo(map)

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
  }, [initialLat, initialLng, initialZoom])

  // Rebuild markers whenever the search filter or the data changes
  useEffect(() => {
    const L = leafletRef.current
    const layer = layerRef.current
    if (!ready || !L || !layer) return

    layer.clearLayers()

    const base = oasisBase(window.location.hostname)

    const icon = L.divIcon({
      className: 'oasis-pin',
      html: `<div style="width:26px;height:26px;border-radius:9999px;background:#10b981;border:2px solid #1c1a16;box-shadow:0 2px 10px rgba(28,26,22,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;"><div style="width:8px;height:8px;border-radius:9999px;background:#1c1a16;"></div></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })

    const poiIcon = (color: string, emoji: string) =>
      L.divIcon({
        className: 'oasis-pin oasis-pin-poi',
        html: `<div style="width:26px;height:26px;border-radius:9999px;background:${color};border:2px solid #1c1a16;box-shadow:0 2px 10px rgba(28,26,22,0.35);display:flex;align-items:center;justify-content:center;font-size:12px;line-height:1;cursor:pointer;">${emoji}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

    // Hotel pins open the shared preview card — the same BottomSheet
    // madeirabook shows on its own map (photo, copy, offline nav, hotel page).
    const openHotelSheet = (h: OasisHotelPin) => {
      setPreview({
        type: 'property',
        slug: h.slug,
        name: h.title,
        lat: h.lat,
        lng: h.lng,
        photoUrl: h.photoUrl ?? h.coverImage ?? null,
        videoUrl: h.videoUrl ?? null,
        shortDescription: h.shortDescription ?? null,
        meta:
          [h.category, h.locationName].filter(Boolean).join(' · ') || null,
        address: h.address ?? null,
        href: `${base}/hotels/${h.slug}`,
        bookable: h.bookable ?? null,
      })
      setSheetOpen(true)
    }

    if (layers.hotels) {
      visible.forEach((h) => {
        const marker = L.marker([h.lat, h.lng], { icon, title: h.title })
        marker.on('click', () => openHotelSheet(h))
        marker.addTo(layer)
      })
    }

    const poiLayers: Array<{ on: boolean; pins: OasisPoiPin[]; color: string; emoji: string }> = [
      { on: layers.beaches, pins: beaches, color: '#3b82f6', emoji: '🏖' },
      { on: layers.restaurants, pins: restaurants, color: '#b0562f', emoji: '🍽' },
    ]
    poiLayers.forEach(({ on, pins, color, emoji }) => {
      if (!on) return
      const icon = poiIcon(color, emoji)
      pins.forEach((poi) => {
        const marker = L.marker([poi.lat, poi.lng], {
          icon,
          title: poi.name,
        })
        const href = `/${poi.kind === 'beach' ? 'beaches' : 'restaurants'}/${escapeHtml(poi.slug)}`
        const popupHtml = `
        <div style="font-family:'Inter',system-ui,sans-serif;min-width:180px;max-width:220px;">
          <div style="font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:#1c1a16;line-height:1.3;">${escapeHtml(poi.name)}</div>
          ${
            poi.subtitle
              ? `<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#059669;margin-top:3px;">${escapeHtml(poi.subtitle)}</div>`
              : ''
          }
          <a href="${href}" style="display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#1c1a16;text-decoration:none;border-bottom:1px solid #10b981;padding-bottom:1px;">View details →</a>
          <button type="button" class="js-get-directions" data-lat="${poi.lat}" data-lng="${poi.lng}" data-name="${escapeHtml(poi.name)}" style="display:inline-block;margin-top:10px;margin-left:10px;font-size:12px;font-weight:600;color:#047857;background:none;border:none;border-bottom:1px solid #10b981;padding:0 0 1px;cursor:pointer;">Get Directions →</button>
        </div>`
        marker.bindPopup(popupHtml, { maxWidth: 240, closeButton: false })
        marker.addTo(layer)
      })
    })

    // Auto-open the first pin's card once the initial map settles — a map
    // with one or two pins looks empty otherwise. Only a card with a real
    // photo opens — placeholder icons never pop on their own. Deep links
    // (?lat&lng) skip it. The ref flips when the timer fires, so a
    // StrictMode remount or an early layer toggle just re-arms the open.
    let autoOpenTimer: ReturnType<typeof setTimeout> | undefined
    if (!autoOpenedRef.current && initialLat == null && initialLng == null) {
      const firstHotel = layers.hotels
        ? visible.find((h) => Boolean(h.photoUrl ?? h.coverImage))
        : undefined
      if (firstHotel) {
        autoOpenTimer = setTimeout(() => {
          autoOpenedRef.current = true
          openHotelSheet(firstHotel)
        }, 600)
      }
    }

    return () => {
      if (autoOpenTimer) clearTimeout(autoOpenTimer)
    }
  }, [ready, visible, layers, beaches, restaurants, initialLat, initialLng])

  const onMapClick = (e: React.MouseEvent) => {
    // Delegated bridge: Leaflet popups are plain HTML inside the map
    // container — read the pin data off the button's data attributes.
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.js-get-directions')
    if (!btn?.dataset.lat || !btn.dataset.lng) return
    setDirTarget({
      lat: Number(btn.dataset.lat),
      lng: Number(btn.dataset.lng),
      name: btn.dataset.name ?? '',
    })
    setDirOpen(true)
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" onClick={onMapClick} />

      {/* Floating search / filter bar */}
      <div className="absolute left-1/2 top-20 z-[1001] flex w-[min(92vw,640px)] -translate-x-1/2 items-center gap-2 rounded-full border border-[#1c1a16]/10 bg-[#fdfbf7]/95 px-4 py-2 shadow-lg shadow-[#1c1a16]/5 backdrop-blur">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hotels, suites, resorts…"
          className="w-full bg-transparent text-sm text-[#1c1a16] outline-none placeholder:text-[#1c1a16]/40"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="shrink-0 rounded-full border border-[#1c1a16]/10 bg-transparent px-2 py-1 text-xs text-[#1c1a16]/70 outline-none"
        >
          <option value="all">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Layer toggles — hotels / curated beaches / curated restaurants */}
      <div className="absolute left-1/2 top-[7.75rem] z-[1001] flex -translate-x-1/2 gap-1 rounded-full border border-[#1c1a16]/10 bg-[#fdfbf7]/95 p-1 shadow-lg shadow-[#1c1a16]/5 backdrop-blur">
        {LAYER_DEFS.map((l) => (
          <button
            key={l.key}
            type="button"
            aria-pressed={layers[l.key]}
            onClick={() =>
              setLayers((prev) => ({ ...prev, [l.key]: !prev[l.key] }))
            }
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              layers[l.key]
                ? 'bg-[#10b981] text-[#1c1a16]'
                : 'text-[#1c1a16]/45 hover:text-[#1c1a16]/80'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 z-[1001] -translate-x-1/2 rounded-full border border-[#1c1a16]/10 bg-[#fdfbf7]/95 px-4 py-1.5 text-xs text-[#1c1a16]/60 backdrop-blur">
        {layers.hotels &&
          `${visible.length} ${visible.length === 1 ? 'residence' : 'residences'}`}
        {layers.beaches &&
          `${layers.hotels ? ' · ' : ''}${beaches.length} ${beaches.length === 1 ? 'beach' : 'beaches'}`}
        {layers.restaurants &&
          `${layers.hotels || layers.beaches ? ' · ' : ''}${restaurants.length} ${restaurants.length === 1 ? 'restaurant' : 'restaurants'}`}
      </div>
      {/* z-[1350]: the map renders inside MapModal (z-1300) — the card must
          stack above it; the offline fallback modal stays on top (z-1400). */}
      <PointPreviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        point={preview}
        zIndex="z-[1350]"
      />
      {dirTarget && (
        <GetDirectionsSheet
          hideTrigger
          open={dirOpen}
          onOpenChange={setDirOpen}
          lat={dirTarget.lat}
          lng={dirTarget.lng}
          name={dirTarget.name}
          theme="gold"
        />
      )}
    </div>
  )
}
