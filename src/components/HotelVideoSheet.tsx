'use client'

import { Drawer } from 'vaul'

export interface HotelVideo {
  videoUrl: string // vertical 9:16 mp4
  title: string
  description?: string | null
}

interface HotelVideoSheetProps {
  video: HotelVideo | null
  onClose: () => void
  cta: { label: string; href: string } | null
}

// Full-screen (100vw x 100dvh) video sheet. The <video> only mounts while a
// story is active, so callers can render this on every page without paying
// for the clip up front. Autoplay is muted + looped + playsInline, which is
// what mobile browsers allow without a gesture.
export default function HotelVideoSheet({ video, onClose, cta }: HotelVideoSheetProps) {
  return (
    <Drawer.Root
      open={video != null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Drawer.Portal>
        {/* z-[2200]: above Leaflet panes (1000), fixed headers (1100), the
            existing video sheet (1250) and the floating WhatsApp/AI/sound
            column (1999–2100) — the full-screen sheet stays topmost */}
        <Drawer.Overlay className="fixed inset-0 z-[2200] bg-black/80 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-0 z-[2200] flex h-dvh w-full flex-col overflow-hidden bg-black outline-none">
          <Drawer.Close
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-xl text-white/80 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
          >
            ✕
          </Drawer.Close>
          <Drawer.Title className="sr-only">
            {video ? video.title : 'Hotel video'}
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Vertical video preview of the hotel.
          </Drawer.Description>

          {video && (
            <div className="relative flex-1">
              <video
                key={video.videoUrl}
                src={video.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 px-6 pb-10 pt-16 text-center">
                <h2 className="font-serif text-3xl leading-tight text-white md:text-4xl">
                  {video.title}
                </h2>
                {video.description && (
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/75">
                    {video.description}
                  </p>
                )}
                {cta && (
                  <a
                    suppressHydrationWarning
                    href={cta.href}
                    onClick={onClose}
                    className="mx-auto mt-6 block w-full max-w-sm rounded-full border border-[#10b981] bg-[#10b981] py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-[#1c1a16] transition-colors hover:bg-transparent hover:text-[#10b981]"
                  >
                    {cta.label}
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
