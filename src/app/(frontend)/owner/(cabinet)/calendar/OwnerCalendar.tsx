'use client'

import React, { useEffect, useMemo, useState } from 'react'

import BookingModal from './BookingModal'
import { CalendarCards, CalendarTable } from './CalendarGrid'
import {
  CHANNEL_LEGEND,
  MONTH_NAMES,
  fmtDateKey,
  type CalendarBooking,
  type CalendarData,
} from './calendarShared'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default function OwnerCalendar() {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<CalendarBooking | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/owner/calendar?month=${month}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
        if (!cancelled) setData(j as CalendarData)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [month])

  const [year, monthIdx] = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    return [y, m - 1]
  }, [month])

  const days = useMemo(() => {
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
    const arr: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(fmtDateKey(year, monthIdx, d))
    }
    return arr
  }, [year, monthIdx])

  const today = useMemo(() => {
    const n = new Date()
    return fmtDateKey(n.getFullYear(), n.getMonth(), n.getDate())
  }, [])

  const monthOptions = useMemo(() => {
    const base = new Date()
    const opts: { value: string; label: string }[] = []
    for (let i = -6; i <= 18; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      opts.push({ value, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` })
    }
    return opts
  }, [])

  const changeMonth = (m: string) => {
    setMonth(m)
    setLoading(true)
    setError('')
  }

  const shiftMonth = (delta: number) => {
    const d = new Date(year, monthIdx + delta, 1)
    changeMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    )
  }

  const bookingFor = (aptId: number | null, dateStr: string) =>
    aptId == null
      ? undefined
      : data?.bookings.find(
          (b) => b.aptId === aptId && dateStr >= b.arrival && dateStr < b.departure,
        )

  const rateFor = (aptId: number | null, dateStr: string) =>
    aptId == null ? undefined : data?.rates[String(aptId)]?.[dateStr]

  const selectedPropertyName = selected
    ? (data?.apartments.find((a) => a.id === selected.propertyId)?.name ?? '')
    : ''

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium" style={SERIF}>
            Calendar
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {data
              ? `${data.apartments.length} properties · ${data.bookings.length} bookings`
              : 'Prices and bookings from Smoobu'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => changeMonth(e.target.value)}
            className="rounded-lg border border-white/15 bg-[#0d1a2a] px-3 py-2 text-sm text-white/90"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-white/15 px-3 py-2 text-white/70 transition-colors hover:border-white/40 hover:text-white"
            aria-label="Previous month"
          >
            &larr;
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-white/15 px-3 py-2 text-white/70 transition-colors hover:border-white/40 hover:text-white"
            aria-label="Next month"
          >
            &rarr;
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Could not load calendar data: {error}
        </div>
      )}

      <div className="mt-6">
        {loading && !data ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-16 text-center text-sm text-white/40">
            Loading calendar…
          </div>
        ) : data && data.apartments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-16 text-center text-sm text-white/40">
            No properties linked to your account yet.
          </div>
        ) : data ? (
          <div className={loading ? 'opacity-50 transition-opacity' : ''}>
            <div className="hidden md:block">
              <CalendarTable
                days={days}
                today={today}
                apartments={data.apartments}
                bookingFor={bookingFor}
                rateFor={rateFor}
                onSelectBooking={setSelected}
              />
            </div>
            <div className="md:hidden">
              <CalendarCards
                days={days}
                today={today}
                apartments={data.apartments}
                bookingFor={bookingFor}
                rateFor={rateFor}
                onSelectBooking={setSelected}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/50">
        {CHANNEL_LEGEND.map((c) => (
          <span key={c.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: c.color }}
            />
            {c.label}
          </span>
        ))}
      </div>

      {selected && (
        <BookingModal
          booking={selected}
          propertyName={selectedPropertyName}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
