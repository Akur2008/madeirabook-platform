'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

// Shows the property's iCal export URL in the admin edit view.
// Paste it into Zeevou (property settings -> iCal import) to sync booked
// dates. Rendered only for saved documents.
export const IcalUrlField: React.FC = () => {
  const { id } = useDocumentInfo()
  if (!id) return null

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/ical/${id}.ics`
      : `/api/ical/${id}.ics`

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>iCal export</div>
      <a href={url} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
        {url}
      </a>
      <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
        Paste into Zeevou property settings → iCal import.
      </div>
    </div>
  )
}

export default IcalUrlField
