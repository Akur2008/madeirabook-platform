'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { setWorkerUrl } from 'maplibre-gl'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'

import GetDirectionsSheet from '@/components/GetDirectionsSheet'
import PointPreviewSheet, { type PointPreview } from './PointPreviewSheet'

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

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

interface PropertyMapProps {
  latitude: number
  longitude: number
  title: string
  imageUrl?: string
  address?: string
  endLatitude?: number
  endLongitude?: number
  endTitle?: string
  // When set, the pin renders as the explore-style circle and opens the
  // shared BottomSheet card — auto-opened once on page load.
  point?: PointPreview
  pinColor?: string
  pinEmoji?: string
}

export default function PropertyMap({
  latitude,
  longitude,
  title,
  imageUrl,
  address,
  endLatitude,
  endLongitude,
  endTitle,
  point,
  pinColor = '#10b981',
  pinEmoji = '🏠',
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Fires once: auto-open the property's card on the initial load
  const autoOpenedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const hasEnd = endLatitude != null && endLongitude != null

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      scrollWheelZoom: false,
    })

    // OpenFreeMap via MapLibre GL (vector tiles)
    maplibreGL({ style: OPENFREEMAP_STYLE }).addTo(map)

    if (point) {
      // Same pin + tap-to-card pattern as /explore: the BottomSheet card
      // replaces the Leaflet popup entirely.
      const icon = L.divIcon({
        className: 'explore-pin',
        html: `<div style="width:34px;height:34px;border-radius:9999px;background:${pinColor};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;cursor:pointer;">${pinEmoji}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
      const marker = L.marker([latitude, longitude], { icon, title })
      marker.on('click', () => setSheetOpen(true))
      marker.addTo(map)
    } else {
      const directionsBtn = `<button type="button" class="js-get-directions" style="margin-top:8px;font-size:12px;font-weight:600;color:#10b981;background:none;border:none;border-bottom:1px solid #10b981;padding:0 0 1px;cursor:pointer;">Get Directions →</button>`
      const popupHtml = imageUrl
        ? `<div style="font-family: 'Cormorant Garamond', serif; font-size: 15px; text-align: center;">
             <img src="${imageUrl}" alt="${title}" loading="lazy" decoding="async" style="width: 180px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; display: block;" />
             <div style="color: #111827; font-weight: 500;">${title}</div>
             ${directionsBtn}
           </div>`
        : `<div style="font-family: 'Cormorant Garamond', serif; font-size: 15px; color: #111827; text-align: center;">${title}<br/>${directionsBtn}</div>`

      L.marker([latitude, longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupHtml, { maxWidth: 220 })
    }

    if (hasEnd) {
      L.marker([endLatitude, endLongitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(endTitle ?? 'End point', { maxWidth: 220 })

      L.polyline(
        [
          [latitude, longitude],
          [endLatitude, endLongitude],
        ],
        { color: '#f97316', weight: 3, dashArray: '6 8' },
      ).addTo(map)

      map.fitBounds(
        L.latLngBounds([latitude, longitude], [endLatitude, endLongitude]).pad(0.15),
      )
    }

    mapRef.current = map

    // Auto-open the property card once the map settles — same feel as the
    // /explore map's pin tap. Only opens when the card has a real photo —
    // a placeholder icon never pops on its own. The ref flips when the
    // timer fires, so a StrictMode remount just re-arms the open.
    let autoOpenTimer: ReturnType<typeof setTimeout> | undefined
    if (point?.photoUrl && !autoOpenedRef.current) {
      autoOpenTimer = setTimeout(() => {
        autoOpenedRef.current = true
        setSheetOpen(true)
      }, 600)
    }

    return () => {
      if (autoOpenTimer) clearTimeout(autoOpenTimer)
      map.remove()
      mapRef.current = null
    }
  }, [latitude, longitude, title, imageUrl, endLatitude, endLongitude, endTitle, point, pinColor, pinEmoji])

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-[400px] rounded-xl overflow-hidden border border-white/10"
        onClick={(e) => {
          // Leaflet popups live inside this container — delegated click
          // bridges the popup's plain-HTML button into React state.
          if ((e.target as HTMLElement).closest('.js-get-directions')) {
            setDirectionsOpen(true)
          }
        }}
      />
      <GetDirectionsSheet
        hideTrigger
        open={directionsOpen}
        onOpenChange={setDirectionsOpen}
        lat={latitude}
        lng={longitude}
        name={title}
        address={address}
        theme="dark"
      />
      <PointPreviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        point={point ?? null}
      />
    </>
  )
}
