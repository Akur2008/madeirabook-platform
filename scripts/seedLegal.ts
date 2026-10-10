import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

const privacyPolicyContent = `
At Madeirabook, we are committed to protecting your privacy and personal data in accordance with the General Data Protection Regulation (GDPR) and Portuguese law.

## Data We Collect

We collect the following types of personal data:
- Contact information (name, email, phone)
- Booking details (dates, property preferences)
- Payment information (processed securely through Stripe)
- Telegram user data (if you use our bot)

## Your Rights

Under GDPR, you have the right to:
- Access your personal data
- Rectify inaccurate data
- Request deletion of your data
- Object to processing
- Data portability

## Contact

For privacy inquiries, contact us at privacy@madeirabook.com
`

const termsOfServiceContent = `
Welcome to Madeirabook. By using our platform, you agree to these Terms of Service.

## Service Description

Madeirabook is a platform that connects guests with curated accommodations in Madeira. We facilitate bookings between guests and property owners.

## User Responsibilities

- Provide accurate information
- Respect property rules and policies
- Make payments on time
- Cancel bookings according to the cancellation policy

## Cancellations & Refunds

Cancellation policies vary by property. Please review the specific policy for each booking before confirming.

## Governing Law

These terms are governed by Portuguese law. Any disputes shall be resolved through the Madeira Regional Arbitration Court (CACRAM/RAL).
`

const cookiePolicyContent = `
We use cookies to improve your experience on our platform.

## Types of Cookies

- Essential cookies: Required for basic functionality
- Analytics cookies: Help us understand how you use our platform
- Marketing cookies: Used for personalized content

## Managing Cookies

You can manage cookie preferences through your browser settings or our cookie consent banner.
`

const livroDeReclamacoesDescription = `
The Livro de Reclamações (Complaints Book) is an official Portuguese consumer protection mechanism. You can file complaints about tourism services through this platform.

This is a mandatory service for all tourism businesses in Portugal and provides an official channel for resolving disputes.
`

const cacramRalDescription = `
CACRAM (Centro de Arbitragem de Conflitos de Consumo da Região Autónoma da Madeira) and RAL (Rede de Arbitragem de Litígios de Consumo) provide alternative dispute resolution services for consumers in Madeira.

This service is free, fast, and an alternative to traditional court proceedings for consumer disputes.

## What You Can Resolve Through CACRAM/RAL

- Service quality disputes
- Billing disagreements
- Contract interpretation issues
- Other consumer-related conflicts
`

export async function seedLegalData(): Promise<void> {
  const payload = await getPayload({ config })

  console.log('🌱 Seeding legal data...')

  // Seed Privacy Policy
  try {
    await payload.updateGlobal({
      slug: 'privacy-policy',
      data: {
        title: 'Privacy Policy',
        content: privacyPolicyContent,
        lastUpdated: new Date().toISOString(),
      },
    })
    console.log('  ✓ Updated Privacy Policy')
  } catch (error) {
    console.log('  - Privacy Policy error:', error)
  }

  // Seed Terms of Service
  try {
    await payload.updateGlobal({
      slug: 'terms-of-service',
      data: {
        title: 'Terms of Service',
        content: termsOfServiceContent,
        lastUpdated: new Date().toISOString(),
      },
    })
    console.log('  ✓ Updated Terms of Service')
  } catch (error) {
    console.log('  - Terms of Service error:', error)
  }

  // Seed Cookie Policy
  try {
    await payload.updateGlobal({
      slug: 'cookie-policy',
      data: {
        title: 'Cookie Policy',
        content: cookiePolicyContent,
        lastUpdated: new Date().toISOString(),
      },
    })
    console.log('  ✓ Updated Cookie Policy')
  } catch (error) {
    console.log('  - Cookie Policy error:', error)
  }

  // Seed Legal Info
  try {
    await payload.updateGlobal({
      slug: 'legal-info',
      data: {
        livroDeReclamacoes: {
          title: 'Livro de Reclamações',
          description: livroDeReclamacoesDescription,
          link: 'https://www.livroreclamacoes.pt',
        },
        cacramRal: {
          title: 'CACRAM / RAL - Madeira Regional Arbitration',
          description: cacramRalDescription,
          link: 'https://www.cacram-madeira.pt',
          contactEmail: 'cacram@gov-madeira.pt',
          contactPhone: '+351 291 200 000',
        },
        companyInfo: {
          companyName: 'Madeirabook Lda',
          nif: '123456789',
          address: 'Rua da Consolação, 123, 9000-001 Funchal, Madeira, Portugal',
          email: 'info@madeirabook.com',
        },
      },
    })
    console.log('  ✓ Updated Legal Info')
  } catch (error) {
    console.log('  - Legal Info error:', error)
  }

  console.log('✅ Legal data seeding completed!')
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedLegalData()
    .then(() => {
      console.log('🎉 Legal data seeded successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error seeding legal data:', error)
      process.exit(1)
    })
}
