// In-memory cache for the owner calendar API. Shared module (not the route
// file) so mutation routes can invalidate entries after writes to Smoobu.
// Survives dev hot reloads via globalThis.

export interface OwnerCalendarCacheEntry {
  at: number
  data: unknown
}

const globalForCache = globalThis as unknown as {
  __ownerCalendarCache?: Map<string, OwnerCalendarCacheEntry>
}

export const ownerCalendarCache = (globalForCache.__ownerCalendarCache ??=
  new Map<string, OwnerCalendarCacheEntry>())

export function invalidateOwnerCalendar(ownerId: number | string): void {
  const prefix = `${ownerId}:`
  for (const key of [...ownerCalendarCache.keys()]) {
    if (key.startsWith(prefix)) ownerCalendarCache.delete(key)
  }
}
