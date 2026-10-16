import Link from 'next/link'
import React from 'react'

import PropertyForm from '../_components/PropertyForm'
import { getFormOptions } from '../_lib'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default async function NewPropertyPage() {
  const { amenities, houseRules, locations } = await getFormOptions()

  return (
    <div className="max-w-2xl">
      <Link
        href="/owner/properties"
        className="text-sm text-white/50 transition-colors hover:text-white"
      >
        &larr; Properties
      </Link>
      <h1 className="mt-4 text-3xl font-medium" style={SERIF}>
        Add a property
      </h1>
      <p className="mb-6 mt-2 text-sm text-white/50">
        After creating, add photos via the Media page. The object becomes
        visible on the site only after verification.
      </p>

      <PropertyForm
        mode="create"
        amenities={amenities}
        houseRules={houseRules}
        locations={locations}
      />
    </div>
  )
}
