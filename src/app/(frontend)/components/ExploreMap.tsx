'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

import { oasisBase } from '@/lib/oasis-domain'
import GetDirectionsSheet from '@/components/GetDirectionsSheet'
import FloatingPointCards, {
  pickTeasers,
  type MapTeaser,
} from './FloatingPointCards'
import PointPreviewSheet, {
  type PointPreview,
} from './PointPreviewSheet'

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
  featured?: boolean | null
}

interface AmbassadorBranding {
  displayName: string
  avatarUrl?: string | null
  accentColor?: string | null
  selectedBeachesSlugs?: string[]
  selectedRestaurantsSlugs?: string[]
}

interface AmbassadorPin {
  id: string | number
  title: string
  lat: number
  lng: number
  description?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
}

interface MapOasisStay {
  id: string | number
  slug: string
  title: string
  lat: number
  lng: number
  shortDescription?: string | null
  coverImage?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  address?: string | null
}

interface ExploreMapProps {
  properties: MapStay[]
  beaches: MapBeach[]
  restaurants: MapRestaurant[]
  trails?: MapTrail[]
  viewpoints?: MapViewpoint[]
  ambassadorPins?: AmbassadorPin[]
  oasisStays?: MapOasisStay[]
  activeFilter?: MapFilter
  ambassador?: AmbassadorBranding | null
  refCode?: string | null
}

const escHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

// "Featured only" mode: keep just the flagged pins, but never empty a
// category whose editors haven't marked anything yet.
const pickFeatured = <T extends { featured?: boolean | null }>(items: T[]) =>
  items.some((i) => i.featured) ? items.filter((i) => i.featured) : items

export default function ExploreMap({
  properties,
  beaches,
  restaurants,
  trails = [],
  viewpoints = [],
  ambassadorPins = [],
  oasisStays = [],
  activeFilter = 'all',
  ambassador = null,
  refCode = null,
}: ExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const layerRef = useRef<Leaflet.LayerGroup | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const router = useRouter()
  const [filter, setFilter] = useState<MapFilter>(activeFilter)
  // Default decluttered map — "Show all points" opt-in brings back everything.
  const [showAll, setShowAll] = useState(false)
  const [ready, setReady] = useState(false)
  const [escapeCity, setEscapeCity] = useState(FALLBACK_CITY)
  const [dirTarget, setDirTarget] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(null)
  const [dirOpen, setDirOpen] = useState(false)
  const [preview, setPreview] = useState<PointPreview | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [teasers, setTeasers] = useState<MapTeaser[]>([])
  // Fires once: auto-open the corner teaser cards on the initial load
  const autoOpenedRef = useRef(false)

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

      // Teaser cards hide the moment the visitor takes over the map.
      map.on('movestart', () =>
        setTeasers((ts) => (ts.length ? [] : ts)),
      )

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

    const shownStays = showAll ? properties : pickFeatured(properties)
    const shownBeaches = showAll ? visibleBeaches : pickFeatured(visibleBeaches)
    const shownRestaurants = showAll
      ? visibleRestaurants
      : pickFeatured(visibleRestaurants)
    const shownTrails = showAll ? trails : pickFeatured(trails)
    const shownViewpoints = showAll ? viewpoints : pickFeatured(viewpoints)

    const pin = (bg: string, emoji: string) =>
      L.divIcon({
        className: 'explore-pin',
        html: `<div style="width:34px;height:34px;border-radius:9999px;background:${bg};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;cursor:pointer;">${emoji}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })

    const withRef = (href: string) =>
      refCode ? `${href}?ref=${encodeURIComponent(refCode)}` : href

    const addPin = (lat: number, lng: number, icon: Leaflet.DivIcon, title: string, href: string) => {
      const marker = L.marker([lat, lng], { icon, title })
      marker.on('click', () => {
        window.location.href = withRef(href)
      })
      marker.addTo(layer)
    }

    // Stay and Oasis pins open the shared preview card (photo, copy,
    // offline navigation) instead of navigating away — one golden card
    // everywhere a hotel pin is tapped.
    const openStaySheet = (p: PointPreview) => {
      setPreview(p)
      setSheetOpen(true)
    }

    // Corner teaser candidates — the same PointPreview shape the full
    // sheet renders when a teaser card is tapped.
    const teaserPoints: MapTeaser[] = []

    if (filter === 'all' || filter === 'stays') {
      const icon = pin('#10b981', '🏠')
      shownStays.forEach((p) => {
        const preview: PointPreview = {
          type: 'property',
          slug: p.slug,
          name: p.title,
          lat: p.lat,
          lng: p.lng,
          photoUrl: p.photoUrl ?? p.coverImage ?? null,
          videoUrl: p.videoUrl ?? null,
          shortDescription: p.shortDescription ?? null,
          meta:
            p.meta ??
            (p.bookable === false
              ? null
              : p.pricePerNight
                ? `€${p.pricePerNight} / night`
                : null),
          address: p.address ?? null,
          href: withRef(`/p/${p.slug}`),
          bookable: p.bookable ?? null,
        }
        const marker = L.marker([p.lat, p.lng], { icon, title: p.title })
        marker.on('click', () => openStaySheet(preview))
        marker.addTo(layer)
        teaserPoints.push({ key: `property:${p.id}`, ...preview })
      })

      // Oasis stays — gold star pins; same card, linking to the Oasis
      // hotel page (/hotels/* on madeiraoasis.com, /oasis/hotels/* else).
      if (oasisStays.length) {
        const base = oasisBase(window.location.hostname)
        const oasisIcon = L.divIcon({
          className: 'explore-pin',
          html: `<div style="width:34px;height:34px;border-radius:9999px;background:linear-gradient(135deg,#f5d76e,#b8952e);border:2px solid #1c1a16;box-shadow:0 2px 10px rgba(184,149,46,0.65);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;cursor:pointer;color:#1c1a16;">★</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        })
        oasisStays.forEach((h) => {
          const preview: PointPreview = {
            type: 'property',
            slug: h.slug,
            name: h.title,
            lat: h.lat,
            lng: h.lng,
            photoUrl: h.photoUrl ?? h.coverImage ?? null,
            videoUrl: h.videoUrl ?? null,
            shortDescription: h.shortDescription ?? null,
            meta: null,
            address: h.address ?? null,
            href: withRef(`${base}/hotels/${h.slug}`),
          }
          const marker = L.marker([h.lat, h.lng], {
            icon: oasisIcon,
            title: h.title,
          })
          marker.on('click', () => openStaySheet(preview))
          marker.addTo(layer)
          teaserPoints.push({ key: `oasis:${h.id}`, ...preview })
        })
      }
    }
    if (filter === 'all' || filter === 'beaches') {
      const icon = pin(ambassador?.accentColor || '#3b82f6', '🏖️')
      shownBeaches.forEach((b) => {
        addPin(b.lat, b.lng, icon, b.name, `/beaches/${b.slug}`)
        teaserPoints.push({
          key: `beach:${b.id}`,
          type: 'beach',
          slug: b.slug,
          name: b.name,
          lat: b.lat,
          lng: b.lng,
          photoUrl: b.heroImage ?? null,
          href: withRef(`/beaches/${b.slug}`),
        })
      })
    }
    if (filter === 'all' || filter === 'food') {
      const icon = pin('#d4af37', '🍽️')
      shownRestaurants.forEach((r) => {
        addPin(r.lat, r.lng, icon, r.name, `/restaurants/${r.slug}`)
        teaserPoints.push({
          key: `restaurant:${r.id}`,
          type: 'restaurant',
          slug: r.slug,
          name: r.name,
          lat: r.lat,
          lng: r.lng,
          photoUrl: r.heroImage ?? null,
          href: withRef(`/restaurants/${r.slug}`),
        })
      })
    }
    if (filter === 'all' || filter === 'trails') {
      const icon = pin('#f97316', '🥾')
      shownTrails.forEach((t) => {
        addPin(t.lat, t.lng, icon, t.name, `/trails/${t.slug}`)
        teaserPoints.push({
          key: `trail:${t.id}`,
          type: 'trail',
          slug: t.slug,
          name: t.name,
          lat: t.lat,
          lng: t.lng,
          photoUrl: null,
          href: withRef(`/trails/${t.slug}`),
        })
      })
    }
    if (filter === 'all' || filter === 'views') {
      const icon = pin('#a855f7', '👁️')
      shownViewpoints.forEach((v) => {
        addPin(v.lat, v.lng, icon, v.name, `/viewpoints/${v.slug}`)
        teaserPoints.push({
          key: `viewpoint:${v.id}`,
          type: 'viewpoint',
          slug: v.slug,
          name: v.name,
          lat: v.lat,
          lng: v.lng,
          photoUrl: null,
          href: withRef(`/viewpoints/${v.slug}`),
        })
      })
    }

    // Ambassador's own approved spots — gold star pins opening a popup
    // (title, media, "Added by …") instead of navigating away.
    if (filter === 'all') {
      const icon = pin('#d4af37', '⭐')
      ambassadorPins.forEach((p) => {
        const marker = L.marker([p.lat, p.lng], { icon, title: p.title })
        const media = p.videoUrl
          ? `<video src="${escHtml(p.videoUrl)}" controls playsinline style="width:100%;border-radius:8px;margin-top:6px;"></video>`
          : p.photoUrl
            ? `<img src="${escHtml(p.photoUrl)}" alt="" loading="lazy" decoding="async" style="width:100%;border-radius:8px;margin-top:6px;" />`
            : `<div style="width:100%;height:80px;margin-top:6px;border-radius:8px;background:linear-gradient(135deg,#12324a,#0a1420);display:flex;align-items:center;justify-content:center;font-size:28px;">📍</div>`
        marker.bindPopup(
          `<div style="max-width:220px;">` +
            `<strong>${escHtml(p.title)}</strong>` +
            (p.description
              ? `<p style="margin:4px 0 0;font-size:12px;">${escHtml(p.description)}</p>`
              : '') +
            media +
            `<p style="margin:6px 0 0;font-size:11px;color:#777;">Added by ${escHtml(ambassador?.displayName ?? 'Ambassador')}</p>` +
            `<button type="button" class="js-get-directions" data-lat="${p.lat}" data-lng="${p.lng}" data-name="${escHtml(p.title)}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:#10b981;background:none;border:none;border-bottom:1px solid #10b981;padding:0 0 1px;cursor:pointer;">Get Directions →</button>` +
            `</div>`,
        )
        marker.addTo(layer)
      })
    }

    // Auto-open a few corner teaser cards once the initial map settles so
    // the map reads as alive, not just pins. The ref flips when the timer
    // fires, so a StrictMode remount or an early filter change just
    // re-arms the teasers.
    let autoOpenTimer: ReturnType<typeof setTimeout> | undefined
    if (!autoOpenedRef.current && teaserPoints.length) {
      autoOpenTimer = setTimeout(() => {
        autoOpenedRef.current = true
        setTeasers(pickTeasers(teaserPoints))
      }, 600)
    }

    return () => {
      if (autoOpenTimer) clearTimeout(autoOpenTimer)
    }
  }, [ready, filter, showAll, properties, oasisStays, visibleBeaches, visibleRestaurants, trails, viewpoints, ambassadorPins, ambassador, refCode])

  const openTeaser = (t: MapTeaser) => {
    setTeasers((ts) => ts.filter((x) => x.key !== t.key))
    setPreview(t)
    setSheetOpen(true)
  }

  const dismissTeaser = (key: string) =>
    setTeasers((ts) => ts.filter((x) => x.key !== key))

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
        {FILTERS.filter(
          (f) =>
            f.key === 'all' ||
            (f.key === 'stays' && (properties.length > 0 || oasisStays.length > 0)) ||
            (f.key === 'beaches' && visibleBeaches.length > 0) ||
            (f.key === 'food' && visibleRestaurants.length > 0) ||
            (f.key === 'trails' && trails.length > 0) ||
            (f.key === 'views' && viewpoints.length > 0),
        ).map((f) => (
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
      {/* Density toggle — featured curation by default; sits above the
          escape CTA so it never collides with the ambassador card. */}
      <div className="absolute bottom-16 left-1/2 z-[1001] flex -translate-x-1/2 gap-1 rounded-full border border-white/15 bg-[#0a1420]/90 p-1 backdrop-blur">
        <button
          type="button"
          aria-pressed={!showAll}
          onClick={() => setShowAll(false)}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            !showAll ? 'bg-[#d4af37] text-[#0a1420]' : 'text-white/60 hover:text-white'
          }`}
        >
          Featured only
        </button>
        <button
          type="button"
          aria-pressed={showAll}
          onClick={() => setShowAll(true)}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            showAll ? 'bg-[#d4af37] text-[#0a1420]' : 'text-white/60 hover:text-white'
          }`}
        >
          Show all points
        </button>
      </div>
      {/* Bottom-center keeps clear of the fixed WhatsApp/Sound buttons on the
          right edge and Leaflet's attribution corner */}
      <button
        type="button"
        onClick={() =>
          router.push(
            refCode ? `/book?ref=${encodeURIComponent(refCode)}` : '/book',
          )
        }
        className="absolute bottom-4 left-1/2 z-[1001] -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-500/60 bg-[#0a1420]/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur transition-colors hover:border-emerald-400 hover:bg-emerald-600"
      >
        Escape from {escapeCity} →
      </button>
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
      {dirTarget && (
        <GetDirectionsSheet
          hideTrigger
          open={dirOpen}
          onOpenChange={setDirOpen}
          lat={dirTarget.lat}
          lng={dirTarget.lng}
          name={dirTarget.name}
          theme="dark"
        />
      )}
    </div>
  )
}
