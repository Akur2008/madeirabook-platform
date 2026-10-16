import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Uploads } from './collections/Uploads'
import { Locations } from './collections/Locations'
import { Amenities } from './collections/Amenities'
import { HouseRules } from './collections/HouseRules'
import { Properties } from './collections/Properties'
import { Gateways } from './collections/Gateways'
import { SluicePages } from './collections/SluicePages'
import { Cities } from './collections/Cities'
import { Beaches } from './collections/Beaches'
import { Restaurants } from './collections/Restaurants'
import { Subscribers } from './collections/Subscribers'
import { EmailQueue } from './collections/EmailQueue'
import { WebhookEvents } from './collections/WebhookEvents'
import { Bookings } from './collections/Bookings'
import { Referrals } from './collections/Referrals'
import { Guides } from './collections/Guides'
import { AffiliatePayouts } from './collections/AffiliatePayouts'
import { Applications } from './collections/Applications'
import { Trails } from './collections/Trails'
import { Viewpoints } from './collections/Viewpoints'
import { PrivacyPolicy } from './globals/PrivacyPolicy'
import { TermsOfService } from './globals/TermsOfService'
import { CookiePolicy } from './globals/CookiePolicy'
import { LegalInfo } from './globals/LegalInfo'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Uploads,
    Locations,
    Amenities,
    HouseRules,
    Properties,
    Gateways,
    SluicePages,
    Cities,
    Beaches,
    Restaurants,
    Subscribers,
    EmailQueue,
    WebhookEvents,
    Bookings,
    Referrals,
    Guides,
    AffiliatePayouts,
    Applications,
    Trails,
    Viewpoints,
  ],
  globals: [PrivacyPolicy, TermsOfService, CookiePolicy, LegalInfo],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        uploads: {
          prefix: 'uploads',
          generateFileURL: ({ filename, prefix }) =>
            `${process.env.R2_PUBLIC_URL}/${prefix ?? 'uploads'}/${filename}`,
        },
      },
      bucket: 'madeirabook-sounds',
      config: {
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        forcePathStyle: true,
      },
      disableLocalStorage: true,
    }),
  ],
})
