import { getPayload } from 'payload'
import config from '@/payload.config'
import React from 'react'
import { LegalMarkdown } from '../LegalMarkdown'
import { privacyFallback, privacyLastUpdated } from '../content'

export const revalidate = 60

type LegalDoc = {
  title?: string | null
  content?: string | null
  lastUpdated?: string | null
}

export default async function PrivacyPolicyPage() {
  let doc: LegalDoc | null = null
  try {
    const payload = await getPayload({ config: await config })
    doc = await payload.findGlobal({ slug: 'privacy-policy' })
  } catch {
    // CMS unreachable — bundled copy below
  }

  const content = doc?.content?.trim() ? doc.content : privacyFallback
  const lastUpdated = doc?.lastUpdated
    ? new Date(doc.lastUpdated).toLocaleDateString()
    : privacyLastUpdated

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{doc?.title || 'Privacy Policy'}</h1>
      <LegalMarkdown source={content} />
      <p className="text-sm text-gray-500 mt-8">Last updated: {lastUpdated}</p>
    </div>
  )
}
