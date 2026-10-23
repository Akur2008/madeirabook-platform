'use client'

import { useMemo, useState } from 'react'

import type { HotelStory } from '@/lib/hotel-stories'
import { oasisBase } from '@/lib/oasis-domain'

import HotelVideoSheet from './HotelVideoSheet'

interface HotelStoriesProps {
  stories: HotelStory[]
  // 'dark': madeirabook navy page; 'oasis': dark gold-themed Oasis page.
  theme?: 'dark' | 'oasis'
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

// "Hotel Stories" — iPhone-style frames (rounded bezel + dynamic island)
// holding only the poster image. The mp4 never loads here; a tap opens the
// full-screen HotelVideoSheet which is the only place the video mounts.
export default function HotelStories({ stories, theme = 'dark' }: HotelStoriesProps) {
  const [active, setActive] = useState<HotelStory | null>(null)
  // On madeiraoasis.com hotel links live at /hotels/*; on other hosts
  // (localhost, madeirabook.com) they sit under /oasis/hotels/*.
  const base = useMemo(
    () => (typeof window === 'undefined' ? '/oasis' : oasisBase(window.location.hostname)),
    [],
  )

  if (!stories.length) return null

  const headingCls =
    theme === 'oasis'
      ? 'font-serif text-3xl font-medium text-[#f5efe3] md:text-4xl'
      : 'text-3xl font-light text-white/90 md:text-4xl'
  const subCls = theme === 'oasis' ? 'text-[#f5efe3]/60' : 'text-white/60'
  const labelCls =
    theme === 'oasis' ? 'text-[#d4af37]' : 'text-white/85'

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <p
        className={`text-center text-[11px] font-medium uppercase tracking-[0.35em] ${
          theme === 'oasis' ? 'text-[#d4af37]' : 'text-white/50'
        }`}
      >
        Stories
      </p>
      <h2 className={`mt-3 text-center ${headingCls}`} style={theme === 'dark' ? { fontFamily: 'Cormorant Garamond, serif' } : undefined}>
        Hotel Stories
      </h2>
      <p className={`mx-auto mt-3 max-w-md text-center text-sm ${subCls}`}>
        Step inside a rare address — thirty seconds of the place, no filters.
      </p>

      <div className="mt-12 flex flex-wrap items-start justify-center gap-10 md:gap-16">
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => setActive(story)}
            aria-label={`Play video — ${story.title}`}
            className="group block"
          >
            {/* iPhone bezel: dark rim, rounded corners, side buttons */}
            <div className="relative rounded-[2.9rem] border border-white/15 bg-[#0b0b0c] p-[7px] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:-translate-y-1.5">
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
              {/* screen — poster only, video never mounts here */}
              <span className="relative block aspect-[9/19] w-[170px] overflow-hidden rounded-[2.3rem] bg-[#111] md:w-[195px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={story.posterUrl}
                  alt={story.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* dynamic island */}
                <span
                  aria-hidden
                  className="absolute left-1/2 top-2.5 z-10 h-[15px] w-[56px] -translate-x-1/2 rounded-full bg-black"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/50 bg-black/45 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-black/60">
                    <PlayIcon />
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-3 px-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
                  {story.title}
                </span>
              </span>
            </div>
            <span
              className={`mt-4 block text-center text-[10px] font-semibold uppercase tracking-[0.22em] ${labelCls}`}
            >
              Watch video
            </span>
          </button>
        ))}
      </div>

      <HotelVideoSheet
        video={
          active
            ? {
                videoUrl: active.videoUrl,
                title: active.title,
                description: active.description,
              }
            : null
        }
        onClose={() => setActive(null)}
        cta={
          active
            ? active.hotelSlug
              ? {
                  label: 'View Hotel',
                  href:
                    active.brand === 'book'
                      ? `/p/${active.hotelSlug}`
                      : `${base}/hotels/${active.hotelSlug}`,
                }
              : {
                  label: 'Request a stay',
                  href: `mailto:hello@madeiraoasis.com?subject=${encodeURIComponent(
                    `Inquiry about ${active.title}`,
                  )}`,
                }
            : null
        }
      />
    </section>
  )
}
