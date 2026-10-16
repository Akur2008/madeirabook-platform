'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeletePropertyButton({
  id,
  title,
}: {
  id: number
  title: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/owner/properties/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.refresh()
        return
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      alert(data?.error || 'Delete failed')
    } catch {
      alert('Delete failed')
    }
    setBusy(false)
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-300 transition-colors hover:border-red-400 hover:text-red-200 disabled:opacity-50"
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  )
}
