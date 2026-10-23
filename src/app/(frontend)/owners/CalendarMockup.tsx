import React from 'react'

type Cell = { day: number; price?: number; state?: 'booked' | 'blocked' }

const DAYS: (Cell | null)[] = [
  null,
  null,
  { day: 1, price: 140 },
  { day: 2, price: 140 },
  { day: 3, price: 145 },
  { day: 4, state: 'booked' },
  { day: 5, state: 'booked' },
  { day: 6, state: 'booked' },
  { day: 7, price: 150 },
  { day: 8, price: 140 },
  { day: 9, price: 140 },
  { day: 10, price: 155 },
  { day: 11, price: 160 },
  { day: 12, state: 'blocked' },
  { day: 13, state: 'blocked' },
  { day: 14, price: 150 },
  { day: 15, price: 140 },
  { day: 16, price: 140 },
  { day: 17, price: 145 },
  { day: 18, state: 'booked' },
  { day: 19, state: 'booked' },
  { day: 20, price: 165 },
  { day: 21, price: 160 },
  { day: 22, price: 140 },
  { day: 23, price: 140 },
  { day: 24, price: 145 },
  { day: 25, price: 150 },
  { day: 26, price: 155 },
  { day: 27, price: 150 },
  { day: 28, price: 140 },
  { day: 29, price: 140 },
  { day: 30, price: 148 },
  { day: 31, price: 150 },
]

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export default function CalendarMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b132b]">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <span className="text-xs text-white/40">
          Owner Cabinet — Pricing Calendar
        </span>
      </div>

      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div>
          <p className="text-sm font-semibold text-white">October 2026</p>
          <p className="text-xs text-white/40">Casa do Miradouro · synced via Smoobu</p>
        </div>
        <div className="flex gap-1.5">
          <span className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-white/50">
            ‹ Prev
          </span>
          <span className="rounded-md border border-[#10b981]/40 px-2.5 py-1 text-[11px] font-medium text-[#10b981]">
            Next ›
          </span>
        </div>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-1 px-5 pt-4 text-center text-[10px] uppercase tracking-wider text-white/35">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 p-5 pt-2">
        {DAYS.map((cell, i) =>
          cell === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <div
              key={cell.day}
              className={`flex h-14 flex-col items-center justify-center rounded-lg border text-xs ${
                cell.state === 'booked'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300/80'
                  : cell.state === 'blocked'
                    ? 'border-white/10 bg-white/[0.03] text-white/25 line-through'
                    : 'border-white/10 bg-white/[0.02] text-white/80'
              }`}
            >
              <span className="font-medium">{cell.day}</span>
              {cell.state === 'booked' ? (
                <span className="mt-0.5 text-[9px] uppercase tracking-wide">
                  Booked
                </span>
              ) : cell.state === 'blocked' ? (
                <span className="mt-0.5 text-[9px] uppercase tracking-wide no-underline">
                  Blocked
                </span>
              ) : (
                <span className="mt-0.5 text-[10px] text-[#10b981]/90">
                  €{cell.price}
                </span>
              )}
            </div>
          ),
        )}
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-4 border-t border-white/10 px-5 py-3 text-[11px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/40" /> Booking.com
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-white/15" /> Blocked
        </span>
        <span className="ml-auto text-[#10b981]/80">Stripe payout: €1,240</span>
      </div>
    </div>
  )
}
