import { isOasisHost } from '@/lib/oasis-domain'

// Pages that drive the engine's ambient channel themselves (breathing
// exercises, the audio test bench). GlobalAmbient must not touch the
// channel while the visitor is on one of these; when the visitor leaves,
// the default scene is crossfaded back in.
const PAGE_DRIVEN_PATHS = new Set(['/sluice-test', '/audio-test'])

export function isPageDrivenAmbient(pathname: string): boolean {
  return PAGE_DRIVEN_PATHS.has(pathname)
}

// Pages with their own <audio> ambience outside the engine — the engine
// stays silent so the two never double up. The Oasis homepage hero owns
// its two-track mix; on madeiraoasis.com it is served at "/" (middleware
// rewrite), elsewhere at "/oasis".
export function isExternallyManagedAmbient(
  pathname: string,
  host: string | null | undefined,
): boolean {
  if (pathname === '/oasis') return true
  return Boolean(host && isOasisHost(host) && pathname === '/')
}
