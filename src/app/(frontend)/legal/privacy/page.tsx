import { getPayload } from 'payload'
import config from '../../../../payload.config.js'
import React from 'react'

export default async function PrivacyPolicyPage() {
  const payload = await getPayload({ config })
  const privacyPolicy = await payload.findGlobal({
    slug: 'privacy-policy',
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{privacyPolicy.title}</h1>
      <div className="prose prose-lg max-w-none whitespace-pre-line">
        {privacyPolicy.content}
      </div>
      {privacyPolicy.lastUpdated && (
        <p className="text-sm text-gray-500 mt-8">
          Last updated: {new Date(privacyPolicy.lastUpdated).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
