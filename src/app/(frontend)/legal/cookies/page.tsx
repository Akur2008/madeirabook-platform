import { getPayload } from 'payload'
import config from '../../../../payload.config.js'
import React from 'react'

export default async function CookiePolicyPage() {
  const payload = await getPayload({ config })
  const cookiePolicy = await payload.findGlobal({
    slug: 'cookie-policy',
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{cookiePolicy.title}</h1>
      <div className="prose prose-lg max-w-none whitespace-pre-line">
        {cookiePolicy.content}
      </div>
      {cookiePolicy.lastUpdated && (
        <p className="text-sm text-gray-500 mt-8">
          Last updated: {new Date(cookiePolicy.lastUpdated).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
