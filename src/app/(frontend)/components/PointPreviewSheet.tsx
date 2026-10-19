'use client'

import { Drawer } from 'vaul'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

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
  photoUrl?: string | null
  videoUrl?: string | null
  shortDescription?: string | null
  meta?: string | null
  addedBy?: string | null
  href?: string | null
}

interface PointPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  point: PointPreview | null
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
}: PointPreviewSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        {/* z-[1200] to stay above Leaflet map panes/controls (z-index up to 1000) */}
        <Drawer.Overlay className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[1200] mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border border-white/15 border-b-0 bg-[#0a1420] outline-none">
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
              <div className="mt-2 flex justify-center">
                {point.videoUrl ? (
                  <video
                    src={point.videoUrl}
                    controls
                    playsInline
                    className="h-auto max-h-[40vh] w-auto rounded-xl border border-white/10"
                  />
                ) : point.photoUrl ? (
                  // photoUrl comes from CMS/Wikimedia — arbitrary host, plain <img>
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={point.photoUrl}
                    alt={point.name}
                    className="aspect-[9/16] h-auto max-h-[40vh] w-auto rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex aspect-[9/16] max-h-[40vh] w-full items-center justify-center rounded-xl border border-white/10 bg-[#0f1d2e] text-6xl">
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
                {point.href !== null && (
                  <a
                    href={pointHref(point)}
                    className="block w-full rounded-full border border-emerald-600 bg-emerald-600 py-3 text-center text-sm uppercase tracking-widest text-white transition-colors hover:bg-emerald-500"
                  >
                    {point.type === 'community' ? 'See their map →' : 'View full page →'}
                  </a>
                )}
                <Drawer.Close asChild>
                  <button
                    type="button"
                    className="w-full rounded-full border border-white/30 bg-white/10 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20"
                  >
                    Close
                  </button>
                </Drawer.Close>
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
