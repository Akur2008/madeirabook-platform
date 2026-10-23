'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

interface ReferralWallet {
  stripeAccountId?: string | null
  pendingBalance?: number | null
  totalPaid?: number | null
}

const eur = (cents: number): string => `€${(cents / 100).toFixed(2)}`

// Wallet block on the Referral edit screen: shows the accrued balance and
// sends it to the ambassador's Stripe Express account via "Pay Out".
// Disabled until the ambassador has a connected Stripe account.
export const AmbassadorPayoutPanel: React.FC = () => {
  const { id } = useDocumentInfo()
  const [wallet, setWallet] = useState<ReferralWallet | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTransfer, setLastTransfer] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!id) return
    fetch(`/api/referrals/${id}?depth=0`, { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((doc: ReferralWallet) => setWallet(doc))
      .catch(() => setWallet(null))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (!id || !wallet) return null

  const pending = wallet.pendingBalance ?? 0
  const paid = wallet.totalPaid ?? 0
  const hasAccount = Boolean(wallet.stripeAccountId)

  const payOut = async () => {
    setBusy(true)
    setError(null)
    setLastTransfer(null)
    try {
      const res = await fetch('/api/admin/ambassador-payout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId: id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Payout failed (${res.status})`)
      } else {
        setLastTransfer(data.transferId ?? null)
      }
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payout failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        padding: '12px 16px',
        marginTop: '8px',
      }}
    >
      <strong>Ambassador wallet</strong>
      <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
        <span>Pending balance: {eur(pending)}</span>
        <span>Total paid: {eur(paid)}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        {hasAccount ? (
          <button
            type="button"
            disabled={busy || pending <= 0}
            onClick={payOut}
            style={{ cursor: pending > 0 && !busy ? 'pointer' : 'default' }}
          >
            {busy ? 'Paying…' : `Pay Out ${eur(pending)}`}
          </button>
        ) : (
          <span style={{ opacity: 0.7 }}>
            No Stripe account — the ambassador must finish onboarding first.
          </span>
        )}
      </div>
      {lastTransfer && (
        <div style={{ color: 'var(--theme-success-500)', marginTop: 8 }}>
          Paid — transfer {lastTransfer}
        </div>
      )}
      {error && (
        <div style={{ color: 'var(--theme-error-500)', marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default AmbassadorPayoutPanel
