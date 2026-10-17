// Shared types and helpers for the owner calendar (read-only, A3.1).

export interface CalendarApartment {
  id: number
  name: string
  aptId: number | null
}

export interface CalendarBooking {
  id: number
  propertyId: number
  aptId: number
  arrival: string
  departure: string
  channel: string
  guestName: string
  guestEmail: string
  guestPhone: string
  price: number
  adults: number
  children: number
  guests: number
  checkIn: string
  checkOut: string
}

export interface RateDay {
  price?: number
  min_length_of_stay?: number
  available?: boolean | number
}

export type RatesMap = Record<string, Record<string, RateDay>>

export interface CalendarData {
  month: string
  apartments: CalendarApartment[]
  rates: RatesMap
  bookings: CalendarBooking[]
}

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function fmtDateKey(y: number, monthIdx: number, day: number): string {
  return `${y}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return fmtDateKey(dt.getFullYear(), dt.getMonth(), dt.getDate())
}

// Channel → stripe color, per A3.1 spec. "Direct booking" is checked first —
// it would otherwise match /booking/i.
const CHANNEL_COLOR_RULES: [RegExp, string][] = [
  [/direct|madeirabook/i, '#10b981'],
  [/booking/i, '#3b82f6'],
  [/airbnb/i, '#ef4444'],
  [/expedia/i, '#f97316'],
  [/agoda/i, '#a855f7'],
]

export function channelColor(channelName: string): string {
  for (const [re, color] of CHANNEL_COLOR_RULES) {
    if (re.test(channelName)) return color
  }
  return '#6b7280'
}

export const CHANNEL_LEGEND = [
  { label: 'Direct / Madeirabook', color: '#10b981' },
  { label: 'Booking.com', color: '#3b82f6' },
  { label: 'Airbnb', color: '#ef4444' },
  { label: 'Expedia', color: '#f97316' },
  { label: 'Agoda', color: '#a855f7' },
  { label: 'Other', color: '#6b7280' },
]
