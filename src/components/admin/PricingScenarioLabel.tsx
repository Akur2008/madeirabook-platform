'use client'

import { FieldLabel } from '@payloadcms/ui'
import type { FieldLabelClientProps } from 'payload'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'

// Description shown per scenario in the "?" modal — keep in sync with
// src/lib/pricing-rules.ts.
const SCENARIO_HELP: { title: string; text: string }[] = [
  {
    title: 'Smoobu',
    text: 'Цена из Smoobu (PMS). Продается. Комиссия 12%. Google ARI: Да.',
  },
  {
    title: 'Zeevou',
    text: 'Цена из Zeevou (PMS). Продается. Комиссия 15%. Google ARI: Да.',
  },
  {
    title: 'SiteMinder',
    text: 'Цена из SiteMinder (Channel Manager). Продается (если есть ключ). Комиссия 20%. Google ARI: Нет.',
  },
  {
    title: 'Manual',
    text: 'Цена вводится вручную в нашей базе. Продается. Комиссия 12%. Google ARI: Да.',
  },
  {
    title: 'Display only',
    text: 'Только витрина. Не продается. Google ARI: Нет. Пример: Orquídea.',
  },
]

// Custom label for the pricingScenario select: the standard Payload label
// plus a "?" button that opens a modal describing each scenario.
export const PricingScenarioLabel: React.FC<FieldLabelClientProps> = (props) => {
  const [open, setOpen] = useState(false)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <FieldLabel {...props} label={props.label ?? 'Pricing Scenario'} />
      <button
        type="button"
        aria-label="What each pricing scenario means"
        onClick={() => setOpen(true)}
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '1px solid currentColor',
          background: 'none',
          padding: 0,
          fontSize: 11,
          lineHeight: '14px',
          cursor: 'pointer',
          opacity: 0.6,
        }}
      >
        ?
      </button>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pricing scenarios"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 420,
                margin: 16,
                padding: '20px 24px',
                borderRadius: 8,
                background: 'var(--theme-bg, #1f1f1f)',
                color: 'var(--theme-text, #e5e5e5)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <strong>Pricing scenarios</strong>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {SCENARIO_HELP.map((s) => (
                  <li key={s.title} style={{ marginBottom: 8 }}>
                    <strong>{s.title}</strong> — {s.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </span>
  )
}

export default PricingScenarioLabel
