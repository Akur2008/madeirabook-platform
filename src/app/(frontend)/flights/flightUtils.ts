import { format } from 'date-fns'

export const AVIASALES_MARKER = '779585'
export const DEFAULT_ORIGIN_IATA = 'LIS'
export const DEFAULT_DESTINATION_IATA = 'FNC'

const IATA_RE = /^[a-zA-Z]{3}$/

// Cities that have dedicated "-to-madeira" pages on the site, plus Madeira itself.
const CITY_TO_IATA: Record<string, string> = {
  amsterdam: 'AMS',
  barcelona: 'BCN',
  berlin: 'BER',
  brussels: 'BRU',
  dublin: 'DUB',
  edinburgh: 'EDI',
  frankfurt: 'FRA',
  funchal: 'FNC',
  lisbon: 'LIS',
  liverpool: 'LPL',
  london: 'LON',
  madrid: 'MAD',
  madeira: 'FNC',
  manchester: 'MAN',
  munich: 'MUC',
  paris: 'PAR',
  porto: 'OPO',
  vienna: 'VIE',
  zurich: 'ZRH',
}

export type PriceRow = { date: string; price: number }

export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function ddmm(d: Date): string {
  return format(d, 'ddMM')
}

export function resolveCity(input: string, fallback: string): string {
  const trimmed = input.trim()
  if (IATA_RE.test(trimmed)) return trimmed.toUpperCase()
  return CITY_TO_IATA[trimmed.toLowerCase()] ?? fallback
}

// Aviasales deep link: /search/{origin}{ddmm}{dest}[{ddmm}][{pax}] — the trailing
// digit is the passenger count (omitted when 1, matching historical links).
export function aviasalesUrl(opts: {
  origin: string
  destination: string
  departISO: string
  returnISO?: string | null
  passengers?: number
}): string {
  const { origin, destination, departISO, returnISO, passengers = 1 } = opts
  const dep = new Date(`${departISO}T12:00:00`)
  let path = `${origin}${ddmm(dep)}${destination}`
  if (returnISO) {
    const ret = new Date(`${returnISO}T12:00:00`)
    if (ret > dep) path += ddmm(ret)
  }
  const pax = Math.min(Math.max(Math.round(passengers), 1), 9)
  if (pax > 1) path += String(pax)
  return `https://www.aviasales.com/search/${path}?marker=${AVIASALES_MARKER}`
}
