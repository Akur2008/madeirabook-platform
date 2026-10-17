// Zeevou OAuth2 token manager (client_credentials grant, server-to-server).
// POST {base}/oauth2-token returns a Bearer JWT (expires_in 1209600 = 14 days).
// Zeevou has no static Personal Token — OAuth only (per Zeevou support).
// Ported from madeirabook-core src/services/pms/zeevou-oauth.js.

const OAUTH_BASE =
  process.env.ZEEVOU_BASE_URL ||
  process.env.ZEEVOU_SANDBOX_URL ||
  'https://sandbox.zeevou.com'
const TOKEN_URL = `${OAUTH_BASE}/oauth2-token`

interface TokenState {
  accessToken: string
  expiresAt: number
}

// globalThis so the token survives Next.js dev hot reloads (14-day JWT).
const globalForToken = globalThis as unknown as {
  __zeevouToken?: TokenState | null
}

function getCredPair(): { id: string; secret: string } {
  const id = process.env.ZEEVOU_OAUTH_CRED_CLIENT_ID
  const secret = process.env.ZEEVOU_OAUTH_CRED_CLIENT_SECRET
  if (!id || !secret) {
    throw new Error(
      'ZEEVOU_OAUTH_CRED_CLIENT_ID / ZEEVOU_OAUTH_CRED_CLIENT_SECRET are not set',
    )
  }
  return { id, secret }
}

export async function getAccessToken(): Promise<string> {
  const cached = globalForToken.__zeevouToken
  if (cached && cached.expiresAt - 60_000 > Date.now()) {
    return cached.accessToken
  }

  const { id, secret } = getCredPair()
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    }),
    signal: AbortSignal.timeout(15000),
  })
  const text = await res.text()
  let parsed: Record<string, unknown>
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    parsed = { raw: text }
  }
  if (!res.ok || typeof parsed.access_token !== 'string') {
    throw new Error(
      `Zeevou OAuth failed: ${res.status} ${JSON.stringify(parsed).slice(0, 300)}`,
    )
  }
  globalForToken.__zeevouToken = {
    accessToken: parsed.access_token,
    expiresAt: Date.now() + Number(parsed.expires_in || 0) * 1000,
  }
  return globalForToken.__zeevouToken.accessToken
}
