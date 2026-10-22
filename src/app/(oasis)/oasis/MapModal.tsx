'use client'

import { useEffect } from 'react'

import OasisMap, {
  type OasisHotelPin,
  type OasisPoiPin,
} from '../../(frontend)/components/OasisMap'

interface MapModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hotels: OasisHotelPin[]
  beaches?: OasisPoiPin[]
  restaurants?: OasisPoiPin[]
  initialLat?: number
  initialLng?: number
  initialZoom?: number
}

export default function MapModal({
  open,
  onOpenChange,
  hotels,
  beaches,
  restaurants,
  initialLat,
  initialLng,
  initialZoom,
}: MapModalProps) {
  // Escape to close + lock body scroll while the map is up.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    // z-[1300]: above the fixed header (1100) and Leaflet panes (1000)
    <div
      className="fixed inset-0 z-[1300]"
      role="dialog"
      aria-modal="true"
      aria-label="Madeira Oasis hotel map"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute inset-0 overflow-hidden bg-[#fdfbf7] md:inset-8 md:rounded-2xl md:border md:border-[#d4af37]/40 md:shadow-2xl">
        {/* Leaflet is imported lazily inside OasisMap, so the map only
            mounts — and downloads — when the modal is open */}
        <OasisMap
          hotels={hotels}
          beaches={beaches}
          restaurants={restaurants}
          initialLat={initialLat}
          initialLng={initialLng}
          initialZoom={initialZoom}
        />
      </div>
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        aria-label="Close map"
        className="absolute right-4 top-4 z-[1301] flex h-11 w-11 items-center justify-center rounded-full border border-[#d4af37]/60 bg-[#14100c]/80 text-lg text-[#f5efe3] backdrop-blur transition-colors hover:bg-[#14100c] md:right-12 md:top-12"
      >
        ✕
      </button>
    </div>
  )
}
