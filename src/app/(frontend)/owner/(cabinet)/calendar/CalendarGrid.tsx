'use client'

import React from 'react'

import {
  WEEKDAYS,
  addDays,
  channelColor,
  type CalendarApartment,
  type CalendarBooking,
  type RateDay,
} from './calendarShared'

interface GridProps {
  days: string[]
  today: string
  apartments: CalendarApartment[]
  bookingFor: (
    aptId: number | null,
    dateStr: string,
  ) => CalendarBooking | undefined
  rateFor: (aptId: number | null, dateStr: string) => RateDay | undefined
  onSelectBooking: (b: CalendarBooking) => void
}

function bookingBarClasses(bk: CalendarBooking, dateStr: string): string {
  const isStart = dateStr === bk.arrival
  const isEnd = dateStr === addDays(bk.departure, -1)
  let cls = ''
  if (isStart) cls += ' rounded-l-md'
  if (isEnd) cls += ' rounded-r-md'
  return cls
}

function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// Desktop: property rows × day columns, sticky first column.
export function CalendarTable({
  days,
  today,
  apartments,
  bookingFor,
  rateFor,
  onSelectBooking,
}: GridProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0d1a2a]">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 min-w-[180px] border-b border-white/10 bg-[#0d1a2a] px-3 py-2 text-left text-[11px] font-semibold text-white/50">
              Property
            </th>
            {days.map((dtStr) => {
              const wd = weekdayOf(dtStr)
              const isWeekend = wd === 0 || wd === 6
              const dayNum = Number(dtStr.slice(8))
              return (
                <th
                  key={dtStr}
                  className={`min-w-[44px] border-b border-white/10 px-0.5 py-1 text-center text-[10px] font-medium ${
                    dtStr === today
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : isWeekend
                        ? 'bg-white/[0.04] text-white/40'
                        : 'text-white/40'
                  }`}
                >
                  {WEEKDAYS[wd]}
                  <br />
                  <span className="text-[11px] text-white/70">{dayNum}</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {apartments.map((apt) => (
            <tr key={apt.id}>
              <td className="sticky left-0 z-10 whitespace-nowrap border-b border-white/10 bg-[#0d1a2a] px-3 py-2 text-[13px] font-semibold text-white/90">
                {apt.name}
              </td>
              {days.map((dtStr) => {
                const wd = weekdayOf(dtStr)
                const isWeekend = wd === 0 || wd === 6
                const rate = rateFor(apt.aptId, dtStr)
                const bk = bookingFor(apt.aptId, dtStr)
                return (
                  <td
                    key={dtStr}
                    className={`relative h-14 border-b border-r border-white/5 ${
                      dtStr === today
                        ? 'bg-emerald-500/10'
                        : isWeekend
                          ? 'bg-white/[0.03]'
                          : ''
                    }`}
                  >
                    {rate?.min_length_of_stay ? (
                      <span className="absolute left-0.5 top-0.5 text-[9px] text-white/40">
                        🌙{rate.min_length_of_stay}
                      </span>
                    ) : null}
                    {rate?.price != null && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-white/80">
                        €{Math.round(rate.price)}
                      </span>
                    )}
                    {bk && (
                      <button
                        type="button"
                        title={`${bk.channel}: ${bk.guestName}`}
                        onClick={() => onSelectBooking(bk)}
                        className={`absolute inset-x-0.5 top-1/2 h-3 -translate-y-1/2 cursor-pointer transition-opacity hover:opacity-80${bookingBarClasses(bk, dtStr)}`}
                        style={{ background: channelColor(bk.channel) }}
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Mobile: one card per property, days scroll horizontally with snap.
export function CalendarCards({
  days,
  today,
  apartments,
  bookingFor,
  rateFor,
  onSelectBooking,
}: GridProps) {
  return (
    <div className="space-y-4">
      {apartments.map((apt) => (
        <div
          key={apt.id}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
        >
          <div className="mb-2 truncate text-sm font-semibold text-white/90">
            {apt.name}
          </div>
          <div className="flex snap-x snap-proximity gap-1 overflow-x-auto pb-1">
            {days.map((dtStr) => {
              const wd = weekdayOf(dtStr)
              const isWeekend = wd === 0 || wd === 6
              const rate = rateFor(apt.aptId, dtStr)
              const bk = bookingFor(apt.aptId, dtStr)
              return (
                <div
                  key={dtStr}
                  className={`relative flex h-16 w-12 shrink-0 snap-start flex-col items-center rounded-lg border pt-1 ${
                    dtStr === today
                      ? 'border-emerald-400/40 bg-emerald-500/10'
                      : isWeekend
                        ? 'border-white/10 bg-white/[0.04]'
                        : 'border-white/10'
                  }`}
                >
                  <span className="text-[9px] font-semibold text-white/40">
                    {WEEKDAYS[wd]}
                  </span>
                  <span className="text-[11px] font-bold text-white/80">
                    {Number(dtStr.slice(8))}
                  </span>
                  {rate?.price != null && (
                    <span className="mt-auto mb-1 text-[10px] font-semibold text-white/80">
                      €{Math.round(rate.price)}
                    </span>
                  )}
                  {rate?.min_length_of_stay ? (
                    <span className="absolute right-0.5 top-0.5 text-[8px] text-white/40">
                      🌙{rate.min_length_of_stay}
                    </span>
                  ) : null}
                  {bk && (
                    <button
                      type="button"
                      title={`${bk.channel}: ${bk.guestName}`}
                      onClick={() => onSelectBooking(bk)}
                      className="absolute inset-x-0 bottom-0 h-1.5 rounded-b-lg"
                      style={{ background: channelColor(bk.channel) }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
