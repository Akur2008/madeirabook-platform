import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://d481b72e6512af2313370a43b696bac5@o4512266386276352.ingest.de.sentry.io/4512266408886352',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV || 'development',
})
