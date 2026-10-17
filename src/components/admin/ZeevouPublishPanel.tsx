'use client'

import React, { useCallback, useEffect, useState } from 'react'

interface PropertyRow {
  id: number
  title: string
  pms?: 'smoobu' | 'zeevou' | null
  pmsPropertyId?: string | null
}

// Panel above the Properties list: offers a "Publish to Zeevou" button for
// properties whose pms is 'zeevou' or unset (never for pms='smoobu').
// Already-published rows show their Zeevou id instead of the button.
export const ZeevouPublishPanel: React.FC = () => {
  const [rows, setRows] = useState<PropertyRow[] | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    return fetch('/api/properties?limit=100&depth=0', {
      credentials: 'same-origin',
    })
      .then((res) => res.json())
      .then((data: { docs?: PropertyRow[] }) => setRows(data.docs ?? []))
      .catch(() => setRows([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/properties?limit=100&depth=0', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data: { docs?: PropertyRow[] }) => {
        if (!cancelled) setRows(data.docs ?? [])
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const publish = async (id: number) => {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/zeevou/publish', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Publish failed (${res.status})`)
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setBusy(null)
    }
  }

  if (!rows) return null
  const candidates = rows.filter((r) => r.pms !== 'smoobu')
  if (!candidates.length) return null

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}
    >
      <strong>Zeevou (Silver)</strong>
      {error && (
        <div style={{ color: 'var(--theme-error-500)', marginTop: 6 }}>
          {error}
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
        {candidates.map((r) => {
          const published = r.pms === 'zeevou' && r.pmsPropertyId
          return (
            <li
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '4px 0',
              }}
            >
              <span style={{ flex: 1 }}>{r.title}</span>
              {published ? (
                <span style={{ opacity: 0.7 }}>
                  Zeevou #{r.pmsPropertyId}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => publish(r.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {busy === r.id ? 'Publishing…' : 'Publish to Zeevou'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ZeevouPublishPanel
