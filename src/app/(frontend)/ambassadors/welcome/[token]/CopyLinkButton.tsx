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
      className="shrink-0 rounded-md border border-[#10b981]/50 px-3 py-1.5 text-xs font-semibold text-[#10b981] transition-colors hover:bg-[#10b981] hover:text-[#0a1420]"
    >
      {copied ? 'Copied ✓' : 'Copy link'}
    </button>
  )
}
