import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentOwner } from '@/lib/ownerAuth'
import OwnerCalendar from './OwnerCalendar'

export const dynamic = 'force-dynamic'

export default async function OwnerCalendarPage() {
  const owner = await getCurrentOwner()
  if (!owner) redirect('/owner/login')

  return <OwnerCalendar readOnly={owner.hasActiveSubscription !== true} />
}
