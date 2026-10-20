'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

import { oasisBase } from '@/lib/oasis-domain'
import GetDirectionsSheet from '@/components/GetDirectionsSheet'

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
}

interface OasisMapProps {
  hotels: OasisHotelPin[]
  initialLat?: number
  initialLng?: number
  initialZoom?: number
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export default function OasisMap({
  hotels,
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
  const [dirTarget, setDirTarget] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(null)
  const [dirOpen, setDirOpen] = useState(false)

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
      html: `<div style="width:26px;height:26px;border-radius:9999px;background:#d4af37;border:2px solid #1c1a16;box-shadow:0 2px 10px rgba(28,26,22,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;"><div style="width:8px;height:8px;border-radius:9999px;background:#1c1a16;"></div></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })

    visible.forEach((h) => {
      const marker = L.marker([h.lat, h.lng], { icon, title: h.title })
      const popupHtml = `
        <div style="font-family:'Inter',system-ui,sans-serif;min-width:200px;max-width:240px;">
          ${
            h.coverImage
              ? `<img src="${escapeHtml(h.coverImage)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;display:block;" />`
              : ''
          }
          <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:#1c1a16;line-height:1.3;">${escapeHtml(h.title)}</div>
          ${
            h.category
              ? `<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#b8952e;margin-top:3px;">${escapeHtml(h.category)}</div>`
              : ''
          }
          <a href="${base}/hotels/${escapeHtml(h.slug)}" style="display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#1c1a16;text-decoration:none;border-bottom:1px solid #d4af37;padding-bottom:1px;">View residence →</a>
          <button type="button" class="js-get-directions" data-lat="${h.lat}" data-lng="${h.lng}" data-name="${escapeHtml(h.title)}" style="display:inline-block;margin-top:10px;margin-left:10px;font-size:12px;font-weight:600;color:#8a7020;background:none;border:none;border-bottom:1px solid #d4af37;padding:0 0 1px;cursor:pointer;">Get Directions →</button>
        </div>`
      marker.bindPopup(popupHtml, { maxWidth: 260, closeButton: false })
      marker.addTo(layer)
    })
  }, [ready, visible])

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
          stroke="#b8952e"
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

      <div className="absolute bottom-4 left-1/2 z-[1001] -translate-x-1/2 rounded-full border border-[#1c1a16]/10 bg-[#fdfbf7]/95 px-4 py-1.5 text-xs text-[#1c1a16]/60 backdrop-blur">
        {visible.length} {visible.length === 1 ? 'residence' : 'residences'}
      </div>
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
