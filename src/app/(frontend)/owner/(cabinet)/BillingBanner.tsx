'use client'

import React, { useState } from 'react'

async function goTo(endpoint: string): Promise<void> {
  const res = await fetch(endpoint, { method: 'POST' })
  const j = await res.json().catch(() => ({}))
  if (!res.ok || !j.url) {
    throw new Error(j.error || `HTTP ${res.status}`)
  }
  window.location.href = j.url
}

export default function BillingBanner({
  subscribed,
  hasCustomer,
}: {
  subscribed: boolean
  hasCustomer: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (endpoint: string) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await goTo(endpoint)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open Stripe')
      setBusy(false)
    }
  }

  if (subscribed) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3">
        <span className="text-sm text-emerald-200">
          PMS subscription active — €30/mo
        </span>
        {hasCustomer && (
          <button
            onClick={() => run('/api/owner/billing-portal')}
            disabled={busy}
            className="rounded-lg border border-emerald-300/30 px-3 py-1.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/10 disabled:opacity-50"
          >
            {busy ? 'Opening…' : 'Manage Billing'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-amber-100">
            Subscribe to manage your PMS — €30/mo
          </div>
          <div className="mt-0.5 text-xs text-amber-200/70">
            Prices, manual bookings and calendar editing require an active
            subscription.
          </div>
        </div>
        <button
          onClick={() => run('/api/owner/subscribe')}
          disabled={busy}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-[#0a1420] transition-colors hover:bg-amber-300 disabled:opacity-50"
        >
          {busy ? 'Opening…' : 'Subscribe'}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-amber-200">
          Could not start checkout: {error}
        </div>
      )}
    </div>
  )
}
