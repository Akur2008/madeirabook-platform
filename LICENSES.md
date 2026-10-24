# Licenses

Third-party fonts, libraries and services used by Madeirabook / Madeira Oasis.
Last audited: 2026-10-24.

## Fonts

| Font | Source | License | Commercial use |
|------|--------|---------|----------------|
| Playfair Display | Google Fonts CDN (`(oasis)/layout.tsx`) | SIL Open Font License 1.1 | Yes |
| Inter | Google Fonts CDN (`(oasis)/layout.tsx`, `public/*.html`) | SIL Open Font License 1.1 | Yes |
| Cormorant Garamond | Google Fonts CDN (`/api/unsubscribe/[token]` page) | SIL Open Font License 1.1 | Yes |
| Roboto Mono | referenced in `styles.css` (`--font-mono`) | Apache License 2.0 | Yes |
| system-ui / Georgia / ui-serif | OS system fonts | n/a | Yes |

GDPR note: fonts are loaded from `fonts.googleapis.com`/`fonts.gstatic.com`,
which sends the visitor's IP address to Google. Consider self-hosting the
font files or covering this in the Privacy Policy + cookie consent.

## Runtime dependencies

| Package | Version | License |
|---------|---------|---------|
| @maplibre/maplibre-gl-leaflet | 0.1.4 | ISC |
| @payloadcms/db-postgres | 3.91.0 | MIT |
| @payloadcms/next | 3.91.0 | MIT |
| @payloadcms/richtext-lexical | 3.91.0 | MIT |
| @payloadcms/storage-s3 | 3.91.0 | MIT |
| @payloadcms/ui | 3.91.0 | MIT |
| @sentry/nextjs | 11.8.0 | MIT |
| @vercel/analytics | 2.0.1 | MIT |
| cross-env | 7.0.3 | MIT |
| date-fns | 4.4.0 | MIT |
| dotenv | 16.4.7 | BSD-2-Clause |
| googleapis | 186.0.0 | Apache-2.0 |
| graphql | 16.14.2 | MIT |
| jose | 5.10.0 | MIT |
| leaflet | 1.9.4 | BSD-2-Clause |
| maplibre-gl | 6.14.0 | BSD-3-Clause |
| next | 15.5.28 | MIT |
| payload | 3.91.0 | MIT |
| pg | 8.20.0 | MIT |
| react | 19.2.6 | MIT |
| react-day-picker | 9.14.0 | MIT |
| react-dom | 19.2.6 | MIT |
| react-leaflet | 5.0.0 | Hippocratic-2.1* |
| sharp | 0.35.5 | Apache-2.0 |
| stripe | 23.0.0 | MIT |
| vaul | 1.1.2 | MIT |
| zod | 4.6.7 | MIT |

\* `react-leaflet` uses the Hippocratic License 2.1 — not OSI-approved; it
restricts use to purposes compatible with the UN Universal Declaration of
Human Rights. A booking platform is within bounds, but it is a non-standard
license worth keeping on the radar.

## Dev dependencies

| Package | Version | License |
|---------|---------|---------|
| @playwright/test | 1.58.2 | Apache-2.0 |
| @tailwindcss/postcss | 4.3.3 | MIT |
| @testing-library/react | 16.3.0 | MIT |
| @types/leaflet | 1.9.22 | MIT |
| @types/node | 22.19.9 | MIT |
| @types/pg | 8.20.0 | MIT |
| @types/react | 19.2.14 | MIT |
| @types/react-dom | 19.2.3 | MIT |
| @vitejs/plugin-react | 4.5.2 | MIT |
| eslint | 9.39.5 | MIT |
| eslint-config-next | 16.3.3 | MIT |
| jsdom | 28.0.0 | MIT |
| postcss | 8.5.29 | MIT |
| prettier | 3.9.9 | MIT |
| tailwindcss | 4.3.3 | MIT |
| tsx | 4.22.4 | MIT |
| typescript | 5.7.3 | Apache-2.0 |
| vite-tsconfig-paths | 6.0.5 | MIT |
| vitest | 4.1.12 | MIT |

## Third-party services / embeds

| Service | Where | Notes |
|---------|-------|-------|
| Vercel Analytics | `(frontend)/layout.tsx` | Cookieless; loads only after cookie consent |
| Sentry | `instrumentation.ts`, `next.config.ts` | Error telemetry — disclose in Privacy Policy |
| Travelpayouts / Aviasales widgets (`tpemd.com`) | `public/*.html` flight pages | Third-party script; may set tracking cookies |
| Meteoblue weather widget | `public/madeira-safety.html` etc. | Third-party iframe |
| MapLibre + OpenStreetMap tiles | map components | Check tile provider terms (OSM attribution required) |
| WhatsApp `wa.me` deep links | concierge buttons | External service, no data sent until user clicks |

## Media assets

Photo/video/audio licensing is tracked in the security audit report —
several assets need a manual license check. See the flagged-assets table
in the audit report (session of 2026-10-24) or `git log` for details.
