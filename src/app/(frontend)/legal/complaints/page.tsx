import { getPayload } from 'payload'
import config from '@/payload.config'
import React from 'react'
import { complaintsFallback as fb } from '../content'
import type { LegalInfo } from '@/payload-types'

export const revalidate = 60

export default async function ComplaintsPage() {
  let legalInfo: Partial<LegalInfo> | null = null
  try {
    const payload = await getPayload({ config: await config })
    legalInfo = await payload.findGlobal({ slug: 'legal-info' })
  } catch {
    // CMS unreachable — bundled copy below
  }

  const livro = {
    title: legalInfo?.livroDeReclamacoes?.title || fb.livroTitle,
    description: legalInfo?.livroDeReclamacoes?.description || fb.livroDescription,
    link: legalInfo?.livroDeReclamacoes?.link || fb.livroLink,
  }
  const cacram = {
    title: legalInfo?.cacramRal?.title || fb.cacramTitle,
    description: legalInfo?.cacramRal?.description || fb.cacramDescription,
    link: legalInfo?.cacramRal?.link || fb.cacramLink,
    contactEmail: legalInfo?.cacramRal?.contactEmail || fb.cacramEmail,
    contactPhone: legalInfo?.cacramRal?.contactPhone,
  }
  const company = {
    companyName: legalInfo?.companyInfo?.companyName || fb.companyName,
    nif: legalInfo?.companyInfo?.nif || fb.nif,
    address: legalInfo?.companyInfo?.address || fb.address,
    email: legalInfo?.companyInfo?.email || fb.email,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Complaints & Dispute Resolution</h1>

      {/* How to complain */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">How to Complain</h2>
        <p className="text-gray-300">
          If you have a complaint about your stay or our service, please contact us first at{' '}
          <a href="mailto:hello@madeirabook.com" className="text-sky-400 underline hover:text-sky-300">
            hello@madeirabook.com
          </a>{' '}
          — we aim to resolve any issue quickly and fairly.
        </p>
      </section>

      {/* Livro de Reclamações */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{livro.title}</h2>
        <p className="text-gray-300 mb-4">{livro.description}</p>
        <a
          href={livro.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Access Livro de Reclamações
        </a>
      </section>

      {/* CACRAM / RAL */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{cacram.title}</h2>
        <p className="text-gray-300 mb-4">{cacram.description}</p>
        <a
          href={cacram.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mr-4"
        >
          Visit CACRAM/RAL Website
        </a>
        {cacram.contactEmail && (
          <a
            href={`mailto:${cacram.contactEmail}`}
            className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Contact by Email
          </a>
        )}
        {cacram.contactPhone && (
          <p className="mt-2 text-gray-400">Phone: {cacram.contactPhone}</p>
        )}
      </section>

      {/* Company Information */}
      <section className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
        <div className="space-y-2 text-gray-300">
          <p><strong>Company:</strong> {company.companyName}</p>
          <p><strong>NIF:</strong> {company.nif}</p>
          <p><strong>Address:</strong> {company.address}</p>
          <p><strong>Email:</strong> {company.email}</p>
        </div>
      </section>
    </div>
  )
}
