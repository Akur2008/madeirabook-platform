import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const REVALIDATE_SECONDS = 3600
const FALLBACK_PRICE_EUR = 17
const FALLBACK_MADEIRA_TEMP = 22
const WEATHER_TIMEOUT_MS = 3000
const MADEIRA_IATA = 'FNC'
const MADEIRA_COORDS = { lat: 32.65, lng: -16.908 }

type CityInfo = { iata: string; lat: number; lng: number; country: string }

const CITIES: Record<string, CityInfo> = {
  Lisbon: { iata: 'LIS', lat: 38.7223, lng: -9.1393, country: 'Portugal' },
  London: { iata: 'LGW', lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
  Paris: { iata: 'CDG', lat: 48.8566, lng: 2.3522, country: 'France' },
  Frankfurt: { iata: 'FRA', lat: 50.1109, lng: 8.6821, country: 'Germany' },
  Munich: { iata: 'MUC', lat: 48.1351, lng: 11.582, country: 'Germany' },
  Madrid: { iata: 'MAD', lat: 40.4168, lng: -3.7038, country: 'Spain' },
  Barcelona: { iata: 'BCN', lat: 41.3874, lng: 2.1686, country: 'Spain' },
  Amsterdam: { iata: 'AMS', lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  Dublin: { iata: 'DUB', lat: 53.3498, lng: -6.2603, country: 'Ireland' },
  Porto: { iata: 'OPO', lat: 41.1579, lng: -8.6291, country: 'Portugal' },
}

const FALLBACK_CITY = 'Lisbon'

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(d.getDate() + n)
  return out
}

function monthParam(offsetMonths: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offsetMonths)
  return toISODate(d)
}

function decodeHeader(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

type MonthMatrixEntry = {
  depart_date?: string
  value?: number
}

async function fetchMonthMatrix(origin: string, month: string): Promise<MonthMatrixEntry[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN
  if (!token) return []
  try {
    const url =
      `https://api.travelpayouts.com/v2/prices/month-matrix` +
      `?origin=${origin}&destination=${MADEIRA_IATA}` +
      `&month=${month}&currency=eur&show_to_affiliates=true` +
      `&token=${token}`
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const body = await res.json()
    const data = Array.isArray(body) ? body : (body as { data?: unknown })?.data
    return Array.isArray(data) ? (data as MonthMatrixEntry[]) : []
  } catch (err) {
    console.warn('escape-card: travelpayouts fetch failed', err)
    return []
  }
}

async function fetchCheapest(origin: string): Promise<{ price: number; date: string } | null> {
  const today = new Date()
  const fromISO = toISODate(today)
  const toISO = toISODate(addDays(today, 14))

  const [current, next] = await Promise.all([
    fetchMonthMatrix(origin, monthParam(0)),
    fetchMonthMatrix(origin, monthParam(1)),
  ])

  const inRange = [...current, ...next].filter(
    (e): e is { depart_date: string; value: number } =>
      typeof e?.depart_date === 'string' &&
      e.depart_date >= fromISO &&
      e.depart_date <= toISO &&
      typeof e.value === 'number' &&
      Number.isFinite(e.value),
  )
  if (!inRange.length) return null
  const best = inRange.reduce((a, b) => (b.value < a.value ? b : a))
  return { price: best.value, date: best.depart_date }
}

type WeatherPoint = { temp: number; code: number } | null

async function fetchWeather(city: CityInfo): Promise<{ from: WeatherPoint; to: WeatherPoint }> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${city.lat},${MADEIRA_COORDS.lat}` +
      `&longitude=${city.lng},${MADEIRA_COORDS.lng}` +
      `&current=temperature_2m,weather_code`
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
    })
    if (!res.ok) return { from: null, to: null }
    const body = (await res.json()) as
      | Array<{ current?: { temperature_2m?: number; weather_code?: number } }>
      | { current?: { temperature_2m?: number; weather_code?: number } }
    const points = Array.isArray(body) ? body : [body]
    const pick = (p: (typeof points)[number] | undefined): WeatherPoint =>
      p?.current &&
      typeof p.current.temperature_2m === 'number' &&
      typeof p.current.weather_code === 'number'
        ? { temp: Math.round(p.current.temperature_2m), code: p.current.weather_code }
        : null
    return { from: pick(points[0]), to: pick(points[1]) }
  } catch (err) {
    console.warn('escape-card: open-meteo fetch failed', err)
    return { from: null, to: null }
  }
}

export async function GET(req: NextRequest) {
  const geoCity = decodeHeader(req.headers.get('x-vercel-ip-city'))
  const geoCountry = decodeHeader(req.headers.get('x-vercel-ip-country'))

  const known = geoCity ? CITIES[geoCity] : undefined
  const geoFallback = !known
  const cityName = known ? geoCity! : FALLBACK_CITY
  const city = CITIES[cityName]
  const country = geoFallback ? city.country : geoCountry || city.country

  const [cheapest, weather] = await Promise.all([
    fetchCheapest(city.iata),
    fetchWeather(city),
  ])

  const priceFallback = cheapest === null

  return NextResponse.json(
    {
      city: cityName,
      country,
      fromIata: city.iata,
      cheapestPrice: cheapest?.price ?? FALLBACK_PRICE_EUR,
      cheapestDate: cheapest?.date ?? toISODate(addDays(new Date(), 7)),
      currency: 'EUR',
      fromTemp: weather.from?.temp ?? null,
      fromWeatherCode: weather.from?.code ?? null,
      toTemp: weather.to?.temp ?? FALLBACK_MADEIRA_TEMP,
      toWeatherCode: weather.to?.code ?? null,
      fallback: priceFallback,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  )
}
