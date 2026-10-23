'use client'

import type { PointPreview, PointType } from './PointPreviewSheet'

export interface MapTeaser extends PointPreview {
  key: string
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const TYPE_EMOJI: Record<PointType, string> = {
  property: '🏠',
  beach: '🏖️',
  restaurant: '🍽️',
  trail: '🥾',
  viewpoint: '👁️',
  community: '⭐',
}

// Corner slots, kept clear of Leaflet's zoom control (top-left), the
// centred filter pills, the bottom CTA strip and the fixed Sound/WhatsApp/AI
// button column on the right edge — the 4th card is desktop-only and sits
// just left of that column.
const CORNER_SLOTS = [
  'left-3 top-28',
  'right-3 top-28',
  'left-3 bottom-24',
  'right-[5.5rem] bottom-24 hidden sm:flex',
] as const

// Up to `count` teasers: the first pin of every type first (so the corners
// show variety — a stay, a beach, a restaurant…), then leftovers in pin order.
export const pickTeasers = <T extends { type: PointType }>(
  points: T[],
  count = CORNER_SLOTS.length,
): T[] => {
  const seen = new Set<PointType>()
  const firsts: T[] = []
  const rest: T[] = []
  for (const p of points) {
    if (seen.has(p.type)) {
      rest.push(p)
    } else {
      seen.add(p.type)
      firsts.push(p)
    }
  }
  return [...firsts, ...rest].slice(0, count)
}

interface FloatingPointCardsProps {
  teasers: MapTeaser[]
  onSelect: (teaser: MapTeaser) => void
  onDismiss: (key: string) => void
}

export default function FloatingPointCards({
  teasers,
  onSelect,
  onDismiss,
}: FloatingPointCardsProps) {
  if (!teasers.length) return null
  return (
    <>
      {teasers.slice(0, CORNER_SLOTS.length).map((t, i) => (
        <div
          key={t.key}
          data-teaser={t.key}
          className={`absolute z-[1001] flex ${CORNER_SLOTS[i]}`}
        >
          <div className="relative flex w-40 items-center rounded-xl border border-slate-200 bg-white/95 shadow-lg shadow-black/15 backdrop-blur sm:w-44">
            <button
              type="button"
              onClick={() => onSelect(t)}
              className="flex min-w-0 flex-1 items-center gap-2 p-2 pr-5 text-left"
            >
              {t.photoUrl ? (
                // photoUrl comes from CMS — arbitrary host, plain <img>
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.photoUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base">
                  {TYPE_EMOJI[t.type]}
                </span>
              )}
              <span className="min-w-0">
                <span
                  className="block truncate text-sm leading-tight text-slate-900"
                  style={SERIF}
                >
                  {t.name}
                </span>
                <span className="mt-1 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  View
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label={`Hide ${t.name} card`}
              onClick={() => onDismiss(t.key)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] leading-none text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </>
  )
}
