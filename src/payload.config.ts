import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Locations } from './collections/Locations'
import { Amenities } from './collections/Amenities'
import { Properties } from './collections/Properties'
import { Gateways } from './collections/Gateways'
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
  collections: [Users, Media, Locations, Amenities, Properties, Gateways],
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
  plugins: [],
})
