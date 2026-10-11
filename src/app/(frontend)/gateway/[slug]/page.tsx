import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import GatewayView from './GatewayView'

export default async function GatewayPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'sluice-pages',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 0,
  })

  const sluicePage = docs[0]
  if (!sluicePage) notFound()

  return <GatewayView sluicePage={sluicePage} />
}
