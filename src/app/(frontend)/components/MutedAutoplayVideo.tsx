'use client'

import { useAutoplayVideo } from '@/components/useAutoplayVideo'

interface MutedAutoplayVideoProps {
  src: string
  poster?: string | null
  alt: string
  className?: string
}

// Inline muted-autoplay clip. Browsers only allow autoplay when the video is
// muted and playsInline keeps iOS from going fullscreen; Low Power Mode can
// still refuse — after the hook's retry window we show the poster with a
// play button so a single tap starts playback inside a user gesture.
export default function MutedAutoplayVideo({
  src,
  poster,
  alt,
  className,
}: MutedAutoplayVideoProps) {
  const { videoRef, needsTap, playNow } = useAutoplayVideo()

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ''}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={alt}
        className="h-full w-full object-cover"
      />
      {needsTap && (
        <button
          type="button"
          onClick={playNow}
          aria-label={`Play video — ${alt}`}
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
        >
          {poster && (
            // poster can be an arbitrary CMS/R2 URL — plain <img>
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-black/45 backdrop-blur-sm transition-transform duration-300 hover:scale-110">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
              aria-hidden="true"
              className="ml-1 text-white"
            >
              <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.5-6.86a1.03 1.03 0 0 0 0-1.76L9.56 4.26A1.03 1.03 0 0 0 8 5.14z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
