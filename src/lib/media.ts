// Media rows are URL references — a video is marked by its mimeType, with the
// file extension as a fallback for rows where mimeType was never filled in.
export const isVideoMedia = (img: {
  mimeType?: string | null
  url?: string | null
}) =>
  Boolean(
    img.mimeType?.startsWith('video/') ||
      /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(img.url ?? ''),
  )
