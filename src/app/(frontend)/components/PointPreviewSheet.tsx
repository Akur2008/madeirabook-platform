'use client'

import Image from 'next/image'
import { Drawer } from 'vaul'

import OfflineNavButton from '@/components/OfflineNavButton'
import MutedAutoplayVideo from './MutedAutoplayVideo'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

// Hosts whitelisted in next.config remotePatterns/localPatterns — anything
// else (Wikimedia, one-off CMS links) falls back to a plain lazy <img>.
const OPTIMIZABLE_HOSTS = new Set([
  'gzu76sbajt7s2dfg.public.blob.vercel-storage.com',
  'pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev',
  'www.madeirabook.com',
  'images.unsplash.com',
])

const canOptimize = (src: string) => {
  if (src.startsWith('/')) return true
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(src).hostname)
  } catch {
    return false
  }
}

export type PointType =
  | 'property'
  | 'beach'
  | 'restaurant'
  | 'trail'
  | 'viewpoint'
  | 'community'

export interface PointPreview {
  type: PointType
  slug: string
  name: string
  lat: number
  lng: number
  photoUrl?: string | null
  videoUrl?: string | null
  shortDescription?: string | null
  meta?: string | null
  addedBy?: string | null
  href?: string | null
  address?: string | null
}

interface PointPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  point: PointPreview | null
  /** Stacking context — 'z-[1350]' when the map itself sits in a z-1300 modal. */
  zIndex?: string
}

const TYPE_LABEL: Record<PointType, string> = {
  property: 'Stay',
  beach: 'Beach',
  restaurant: 'Restaurant',
  trail: 'Trail',
  viewpoint: 'Viewpoint',
  community: 'Community Pick',
}

const TYPE_EMOJI: Record<PointType, string> = {
  property: '🏠',
  beach: '🏖️',
  restaurant: '🍽️',
  trail: '🥾',
  viewpoint: '👁️',
  community: '⭐',
}

const pointHref = (point: PointPreview) =>
  point.href ??
  (point.type === 'property' ? `/p/${point.slug}` : `/${point.type}s/${point.slug}`)

export default function PointPreviewSheet({
  open,
  onOpenChange,
  point,
  zIndex = 'z-[1200]',
}: PointPreviewSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        {/* Plain backdrop div instead of Drawer.Overlay — an overlay tap must
            not close the card (only the ✕ or a swipe-down may). zIndex prop:
            z-[1200] above bare Leaflet panes, z-[1350] above the map modal. */}
        <div
          className={`fixed inset-0 ${zIndex} bg-black/60 backdrop-blur-sm`}
        />
        <Drawer.Content
          className={`fixed inset-x-0 bottom-0 ${zIndex} mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border border-white/15 border-b-0 bg-[#0a1420] outline-none`}
        >
          <Drawer.Handle className="mx-auto mb-2 mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />
          <Drawer.Close
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
          >
            ✕
          </Drawer.Close>
          <Drawer.Title className="sr-only">
            {point ? point.name : 'Place preview'}
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Preview of the selected place on the map.
          </Drawer.Description>

          {point && (
            <div className="overflow-y-auto px-6 pb-6">
              <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
                {point.videoUrl ? (
                  // key remounts the video when another pin is selected so
                  // the muted autoplay is attempted again for the new src
                  <MutedAutoplayVideo
                    key={point.videoUrl}
                    src={point.videoUrl}
                    poster={point.photoUrl ?? null}
                    alt={point.name}
                    className="aspect-video w-full"
                  />
                ) : point.photoUrl ? (
                  <div className="relative aspect-video w-full">
                    {canOptimize(point.photoUrl) ? (
                      <Image
                        src={point.photoUrl}
                        alt={point.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        loading="lazy"
                        className="object-cover"
                      />
                    ) : (
                      // photoUrl comes from CMS/Wikimedia — arbitrary host, plain <img>
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={point.photoUrl}
                        alt={point.name}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-[#0f1d2e] text-6xl">
                    {TYPE_EMOJI[point.type]}
                  </div>
                )}
              </div>

              <p className="mb-0 mt-5 text-center text-xs uppercase tracking-widest text-white/40">
                {point.type === 'community' ? (
                  <span className="rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 px-3 py-1 text-[#d4af37]">
                    {TYPE_LABEL[point.type]}
                  </span>
                ) : (
                  TYPE_LABEL[point.type]
                )}
              </p>
              <h2
                className="mt-2 text-center text-3xl font-light leading-tight text-white/95"
                style={SERIF}
              >
                {point.name}
              </h2>
              {point.meta && (
                <p className="mb-0 mt-2 text-center text-sm text-[#d4af37]">
                  {point.meta}
                </p>
              )}
              {point.shortDescription && (
                <p className="mb-0 mt-3 text-center text-sm leading-relaxed text-white/70">
                  {point.shortDescription}
                </p>
              )}
              {point.addedBy && (
                <p className="mb-0 mt-3 text-center text-xs text-white/45">
                  Added by {point.addedBy}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <OfflineNavButton
                  lat={point.lat}
                  lng={point.lng}
                  name={point.name}
                  className="w-full whitespace-nowrap rounded-full border border-[#d4af37] bg-[#d4af37] py-3 text-xs font-semibold uppercase tracking-widest text-[#0a1420] transition-colors hover:bg-[#c9a227]"
                />
                {point.href !== null && (
                  <a
                    href={pointHref(point)}
                    className="block w-full rounded-full border border-white/30 bg-white/10 py-3 text-center text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/20"
                  >
                    View Details →
                  </a>
                )}
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
