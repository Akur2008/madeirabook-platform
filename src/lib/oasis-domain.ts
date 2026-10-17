export const OASIS_HOSTS = new Set([
  'madeiraoasis.com',
  'www.madeiraoasis.com',
])

export function isOasisHost(host: string | null | undefined): boolean {
  return OASIS_HOSTS.has((host ?? '').split(':')[0].toLowerCase())
}

// URL prefix for Oasis links: clean paths on madeiraoasis.com, /oasis/*
// on other hosts (madeirabook.com preview, localhost dev).
export function oasisBase(host: string | null | undefined): string {
  return isOasisHost(host) ? '' : '/oasis'
}
