'use client'

import { useMemo } from 'react'
import { Drawer } from 'vaul'

import { oasisBase } from '@/lib/oasis-domain'
import type { HeroVideoSpot } from './InteractiveHero'

interface VideoBottomSheetProps {
  spot: HeroVideoSpot | null
  onClose: () => void
  // Slugs that currently have a live hotel page (published madeiraoasis
  // inventory). Spots outside the set get a concierge CTA instead of a
  // link that would 404.
  liveSlugs: ReadonlySet<string>
}

export default function VideoBottomSheet({ spot, onClose, liveSlugs }: VideoBottomSheetProps) {
  // On madeiraoasis.com hotel links live at /hotels/*; on other hosts
  // (localhost, madeirabook.com preview) they sit under /oasis/hotels/*.
  const base = useMemo(
    () => (typeof window === 'undefined' ? '/oasis' : oasisBase(window.location.hostname)),
    [],
  )
  const live = spot != null && liveSlugs.has(spot.hotelSlug)

  return (
    <Drawer.Root
      open={spot != null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Drawer.Portal>
        {/* z-[1250]: above Leaflet panes (1000) and the fixed header (1100) */}
        <Drawer.Overlay className="fixed inset-0 z-[1250] bg-black/70 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[1250] mx-auto flex h-dvh w-full flex-col overflow-hidden bg-black outline-none md:h-[94dvh] md:max-w-md md:rounded-t-3xl md:border md:border-white/15 md:border-b-0">
          <Drawer.Handle className="z-20 mx-auto mb-1 mt-2 h-1 w-10 shrink-0 rounded-full bg-white/30" />
          <Drawer.Close
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-lg text-white/70 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
          >
            ✕
          </Drawer.Close>
          <Drawer.Title className="sr-only">
            {spot ? spot.title : 'Hotel video'}
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Vertical video preview of the hotel.
          </Drawer.Description>

          {spot && (
            <div className="relative flex-1">
              <video
                key={spot.id}
                src={spot.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 px-6 pb-8 pt-16">
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#10b981]">
                  Madeira Oasis
                </p>
                <h2 className="font-serif mt-2 text-3xl leading-tight text-white">
                  {spot.title}
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/75">
                  {spot.description}
                </p>
                {/* href differs between SSR (/oasis) and the oasis host (/) */}
                <a
                  suppressHydrationWarning
                  href={
                    live
                      ? `${base}/hotels/${spot.hotelSlug}`
                      : `mailto:hello@madeiraoasis.com?subject=${encodeURIComponent(
                          `Inquiry about ${spot.title}`,
                        )}`
                  }
                  className="mt-6 block w-full rounded-full border border-[#10b981] bg-[#10b981] py-3.5 text-center text-sm font-semibold uppercase tracking-[0.15em] text-[#1c1a16] transition-colors hover:bg-transparent hover:text-[#10b981]"
                >
                  {live ? `Discover ${spot.title}` : 'Request a stay'}
                </a>
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
