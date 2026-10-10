import { getPayload } from 'payload'
import config from '../../../../payload.config.js'
import React from 'react'

export default async function ComplaintsPage() {
  const payload = await getPayload({ config })
  const legalInfo = await payload.findGlobal({
    slug: 'legal-info',
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Complaints & Dispute Resolution</h1>

      {/* Livro de Reclamações */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{legalInfo.livroDeReclamacoes.title}</h2>
        <div className="prose prose-lg max-w-none mb-4 whitespace-pre-line">
          {legalInfo.livroDeReclamacoes.description}
        </div>
        <a
          href={legalInfo.livroDeReclamacoes.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Access Livro de Reclamações
        </a>
      </section>

      {/* CACRAM / RAL */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{legalInfo.cacramRal.title}</h2>
        <div className="prose prose-lg max-w-none mb-4 whitespace-pre-line">
          {legalInfo.cacramRal.description}
        </div>
        <a
          href={legalInfo.cacramRal.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mr-4"
        >
          Visit CACRAM/RAL Website
        </a>
        {legalInfo.cacramRal.contactEmail && (
          <a
            href={`mailto:${legalInfo.cacramRal.contactEmail}`}
            className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Contact by Email
          </a>
        )}
        {legalInfo.cacramRal.contactPhone && (
          <p className="mt-2 text-gray-600">
            Phone: {legalInfo.cacramRal.contactPhone}
          </p>
        )}
      </section>

      {/* Company Information */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
        <div className="space-y-2">
          <p><strong>Company:</strong> {legalInfo.companyInfo.companyName}</p>
          <p><strong>NIF:</strong> {legalInfo.companyInfo.nif}</p>
          <p><strong>Address:</strong> {legalInfo.companyInfo.address}</p>
          <p><strong>Email:</strong> {legalInfo.companyInfo.email}</p>
        </div>
      </section>
    </div>
  )
}
