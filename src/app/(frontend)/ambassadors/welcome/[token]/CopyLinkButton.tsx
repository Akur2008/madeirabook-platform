'use client'

import React, { useState } from 'react'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-md border border-[#d4af37]/50 px-3 py-1.5 text-xs font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37] hover:text-[#0a1420]"
    >
      {copied ? 'Copied ✓' : 'Copy link'}
    </button>
  )
}
