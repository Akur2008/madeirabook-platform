'use client'

import { useState } from 'react'

type Status = 'pending' | 'approved' | 'rejected'

const LABEL: Record<Status, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const COLOR: Record<Status, string> = {
  pending: '#b45309',
  approved: '#047857',
  rejected: '#b91c1c',
}

// List-view cell for AmbassadorPins.status with inline Approve/Reject actions.
// The PATCH goes through Payload REST with the admin session cookie, so the
// collection's update access (admin only) still applies.
export default function PinStatusCell(props: {
  cellData?: unknown
  rowData?: { id?: string | number }
}) {
  const [status, setStatus] = useState<Status>(
    (props.cellData as Status) ?? 'pending',
  )
  const [busy, setBusy] = useState(false)

  const id = props.rowData?.id

  const moderate = async (next: Status) => {
    if (id == null || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/ambassador-pins/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) setStatus(next)
    } finally {
      setBusy(false)
    }
  }

  const btnStyle: React.CSSProperties = {
    border: '1px solid var(--theme-elevation-400)',
    borderRadius: '4px',
    background: 'transparent',
    color: 'var(--theme-text)',
    cursor: busy ? 'wait' : 'pointer',
    fontSize: '11px',
    padding: '2px 8px',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: COLOR[status], fontWeight: 600 }}>
        {LABEL[status]}
      </span>
      {status !== 'approved' && (
        <button
          type="button"
          style={btnStyle}
          disabled={busy}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void moderate('approved')
          }}
        >
          Approve
        </button>
      )}
      {status !== 'rejected' && (
        <button
          type="button"
          style={btnStyle}
          disabled={busy}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void moderate('rejected')
          }}
        >
          Reject
        </button>
      )}
    </div>
  )
}
