// Google Indexing API client — notifies Google when a property landing page
// is (re)published so hotel pages are crawled faster. Uses the `googleapis`
// package with the service-account JSON stored in GOOGLE_INDEXING_KEY.
// Fails gracefully (warn + skip) when the key is missing or invalid — a
// misconfigured key must never break a Payload save.
//
// NOTE: keep this module free of @payload-config imports — it is loaded by
// the Properties collection hook, which is part of the config itself.

const INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing'
const SUBMIT_TIMEOUT_MS = 10_000

export type IndexingNotificationType = 'URL_UPDATED' | 'URL_DELETED'

export interface IndexingOutcome {
  ok: boolean
  configured: boolean
  status: number | null
  detail: string
}

// Public landing page for a property — same convention as the Hotel Center
// feed (hotelCenterLandingUrl), duplicated here to avoid a config import
// cycle through the collections.
export function propertyLandingUrl(slug: string): string {
  const base = (process.env.APP_URL || 'https://www.madeirabook.com').replace(/\/$/, '')
  return `${base}/p/${slug}`
}

function parseKey(raw: string): { client_email?: string; private_key?: string } | null {
  try {
    const key = JSON.parse(raw) as { client_email?: string; private_key?: string }
    return key.client_email && key.private_key ? key : null
  } catch {
    return null
  }
}

// Submits a URL to the Google Indexing API (urlNotifications.publish).
// Returns a structured outcome instead of throwing: callers log and move on.
export async function submitToGoogleIndexing(
  url: string,
  type: IndexingNotificationType = 'URL_UPDATED',
): Promise<IndexingOutcome> {
  const raw = process.env.GOOGLE_INDEXING_KEY
  if (!raw) {
    console.warn(`googleIndexing: GOOGLE_INDEXING_KEY is not set — skipping ${url}`)
    return { ok: false, configured: false, status: null, detail: 'not_configured' }
  }

  const key = parseKey(raw)
  if (!key) {
    console.warn('googleIndexing: GOOGLE_INDEXING_KEY is not valid service-account JSON')
    return { ok: false, configured: false, status: null, detail: 'invalid_key' }
  }

  try {
    const { google } = await import('googleapis')
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [INDEXING_SCOPE],
    })
    const indexing = google.indexing({ version: 'v3', auth })
    const res = await Promise.race([
      indexing.urlNotifications.publish({ requestBody: { url, type } }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('indexing api timeout')), SUBMIT_TIMEOUT_MS),
      ),
    ])
    return {
      ok: true,
      configured: true,
      status: res.status,
      detail: JSON.stringify(res.data).slice(0, 500),
    }
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    console.warn(`googleIndexing: submit failed for ${url}: ${detail}`)
    return { ok: false, configured: true, status: null, detail }
  }
}
