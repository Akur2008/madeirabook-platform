'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const REF_COOKIE = 'madeirabook_ref'

// Pages can open the concierge with a preset question:
// window.dispatchEvent(new CustomEvent(ASK_CONCIERGE_EVENT, { detail: { message } }))
export const ASK_CONCIERGE_EVENT = 'madeirabook:ask-concierge'

type Message = { role: 'user' | 'assistant'; content: string }

const GREETING: Message = {
  role: 'assistant',
  content:
    "Hi! I'm your Madeira concierge. Ask me where to stay, which beaches to see, or where to eat — I'll point you to the right page.",
}

function readRefCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REF_COOKIE}=([^;]*)`),
  )
  return match ? decodeURIComponent(match[1]) : null
}

// Attach the ambassador ref code to internal links so attribution survives
// the click-through (middleware turns ?ref= into the madeirabook_ref cookie).
function withRef(href: string, ref: string | null): string {
  if (!ref || !href.startsWith('/')) return href
  return `${href}${href.includes('?') ? '&' : '?'}ref=${encodeURIComponent(ref)}`
}

// Minimal renderer: Markdown links + **bold** + newlines, rest plain text.
function renderText(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(<strong key={`${keyBase}-b${m.index}`}>{m[1]}</strong>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function MessageBody({ content, refCode }: { content: string; refCode: string | null }) {
  const parts: React.ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push(...renderText(content.slice(last, m.index), `t${m.index}`))
    const href = withRef(m[2], refCode)
    parts.push(
      <a
        key={m.index}
        href={href}
        className="text-emerald-300 underline decoration-emerald-300/40 underline-offset-2 hover:text-emerald-200"
      >
        {m[1]}
      </a>,
    )
    last = m.index + m[0].length
  }
  if (last < content.length) parts.push(...renderText(content.slice(last), 'tail'))
  return <span className="whitespace-pre-wrap">{parts}</span>
}

interface AiConciergeWidgetProps {
  /** Hide the built-in floating launcher — the host page provides its own
      open button that dispatches ASK_CONCIERGE_EVENT. */
  hideLauncherButton?: boolean
}

export default function AiConciergeWidget({
  hideLauncherButton = false,
}: AiConciergeWidgetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [refCode, setRefCode] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = useCallback(async (raw?: string) => {
    const text = (typeof raw === 'string' ? raw : input).trim()
    if (!text || streaming) return

    // Refresh attribution — the ref cookie may have been set by middleware
    // after the widget first mounted.
    setRefCode(readRefCookie())

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages([...next, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, page: pathname }),
      })
      if (!res.ok || !res.body) {
        throw new Error(`chat ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        const snapshot = acc
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: snapshot }
          return copy
        })
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          role: 'assistant',
          content:
            'Sorry — the concierge is unavailable right now. Please try again in a moment.',
        }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }, [input, messages, pathname, streaming])

  useEffect(() => {
    const onAsk = (e: Event) => {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message
      setRefCode(readRefCookie())
      setOpen(true)
      if (message) void send(message)
    }
    window.addEventListener(ASK_CONCIERGE_EVENT, onAsk)
    return () => window.removeEventListener(ASK_CONCIERGE_EVENT, onAsk)
  }, [send])

  // The owner cabinet is a back-office tool — no concierge there.
  if (pathname.startsWith('/owner')) return null

  return (
    <>
      {!hideLauncherButton && (
      <button
        type="button"
        aria-label={open ? 'Close concierge chat' : 'Open concierge chat'}
        aria-expanded={open}
        onClick={() => {
          setRefCode(readRefCookie())
          setOpen((v) => !v)
        }}
        className="fixed bottom-40 right-6 z-[2001] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#0e1c2b]/90 text-emerald-300 shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Madeirabook concierge chat"
          className={`fixed inset-x-3 z-[2100] flex h-[26rem] max-h-[60vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e1c2b]/95 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-6 sm:w-[380px] ${
            hideLauncherButton ? 'bottom-24' : 'bottom-[13.5rem]'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Madeirabook Concierge</p>
              <p className="text-xs text-white/50">AI assistant — answers instantly</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-600/80 px-3 py-2 text-sm leading-6 text-white'
                    : 'mr-auto max-w-[90%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-sm leading-6 text-white/90'
                }
              >
                <MessageBody content={msg.content} refCode={refCode} />
                {msg.role === 'assistant' && streaming && i === messages.length - 1 && (
                  <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-emerald-300/80" />
                )}
              </div>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-white/10 px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Madeira…"
              maxLength={500}
              disabled={streaming}
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-emerald-400/50 disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={streaming || !input.trim()}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-400 disabled:cursor-default disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
