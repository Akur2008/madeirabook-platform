'use client'

import Link from 'next/link'
import { useState } from 'react'

import HotelVideoSheet from './HotelVideoSheet'
import OfflineNavButton from './OfflineNavButton'

export interface RestaurantStoryItem {
  id: number
  slug: string
  name: string
  meta: string | null
  videoUrl: string | null
  posterUrl: string | null
  lat: number
  lng: number
}

const PlayIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    className="ml-0.5 text-white"
  >
    <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.5-6.86a1.03 1.03 0 0 0 0-1.76L9.56 4.26A1.03 1.03 0 0 0 8 5.14z" />
  </svg>
)

// Same iPhone bezel as HotelStories — poster only inside the screen; the
// mp4 never mounts here. `interactive` adds the hover lift + play button.
function PhoneFrame({
  item,
  interactive,
}: {
  item: RestaurantStoryItem
  interactive: boolean
}) {
  return (
    <div
      className={`relative mx-auto w-fit rounded-[2.9rem] border border-white/15 bg-[#0b0b0c] p-[7px] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)] transition-transform duration-300 ${
        interactive ? 'group-hover:-translate-y-1.5' : ''
      }`}
    >
      <span
        aria-hidden
        className="absolute -left-[2px] top-28 h-7 w-[3px] rounded-full bg-[#2c2c2e]"
      />
      <span
        aria-hidden
        className="absolute -left-[2px] top-40 h-12 w-[3px] rounded-full bg-[#2c2c2e]"
      />
      <span
        aria-hidden
        className="absolute -right-[2px] top-32 h-14 w-[3px] rounded-full bg-[#2c2c2e]"
      />
      <span className="relative block aspect-[9/19] w-[170px] overflow-hidden rounded-[2.3rem] bg-[#111] md:w-[195px]">
        {item.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.posterUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-4xl">
            🍽️
          </span>
        )}
        <span
          aria-hidden
          className="absolute left-1/2 top-2.5 z-10 h-[15px] w-[56px] -translate-x-1/2 rounded-full bg-black"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25"
        />
        {item.videoUrl && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/50 bg-black/45 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-black/60">
              <PlayIcon />
            </span>
          </span>
        )}
        <span className="absolute inset-x-0 bottom-3 px-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
          {item.name}
        </span>
      </span>
    </div>
  )
}

// Restaurants reel — phone-frame cards for every published restaurant.
// Frames with a video open the full-screen HotelVideoSheet; frames without
// one link straight to the restaurant page. Offline navigation sits under
// every card (same om:// deep link the map cards use).
export default function RestaurantStories({
  items,
}: {
  items: RestaurantStoryItem[]
}) {
  const [active, setActive] = useState<RestaurantStoryItem | null>(null)

  if (!items.length) return null

  return (
    <>
      <div className="mt-12 flex flex-wrap items-start justify-center gap-x-10 gap-y-12 md:gap-x-14">
        {items.map((item) => (
          <div key={item.id} className="w-[184px] md:w-[210px]">
            {item.videoUrl ? (
              <button
                type="button"
                onClick={() => setActive(item)}
                aria-label={`Play video — ${item.name}`}
                className="group block w-full"
              >
                <PhoneFrame item={item} interactive />
                <span className="mt-4 block text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85">
                  Watch video
                </span>
              </button>
            ) : (
              <Link
                href={`/restaurants/${item.slug}`}
                className="group block"
                aria-label={item.name}
              >
                <PhoneFrame item={item} interactive />
              </Link>
            )}

            <div className="mt-4 text-center">
              <Link
                href={`/restaurants/${item.slug}`}
                className="font-serif text-lg leading-tight text-white/95 transition-colors hover:text-white"
              >
                {item.name}
              </Link>
              {item.meta && (
                <p className="mt-1 text-[11px] uppercase tracking-wider text-white/45">
                  {item.meta}
                </p>
              )}
              <div className="mt-3 flex flex-col items-center gap-2">
                <OfflineNavButton
                  lat={item.lat}
                  lng={item.lng}
                  name={item.name}
                  className="w-full whitespace-nowrap rounded-full border border-[#10b981] bg-[#10b981] py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#0a1420] transition-colors hover:bg-[#059669]"
                />
                <Link
                  href={`/restaurants/${item.slug}`}
                  className="text-[10px] font-semibold uppercase tracking-widest text-white/50 transition-colors hover:text-white/80"
                >
                  View details →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <HotelVideoSheet
        video={
          active
            ? {
                videoUrl: active.videoUrl ?? '',
                title: active.name,
              }
            : null
        }
        onClose={() => setActive(null)}
        cta={
          active
            ? {
                label: 'View Restaurant',
                href: `/restaurants/${active.slug}`,
              }
            : null
        }
      />
    </>
  )
}
