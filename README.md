# madeirabook-platform

Pilot portal for Madeirabook — Next.js 15 (App Router) + Payload CMS v3 + Neon Postgres.

This is a parallel pilot, not a migration. The Express backend (`madeirabook-core`) keeps running and shares the same Neon database.

## Stack

- Next.js 15.5.4 (App Router, TypeScript)
- Payload CMS 3.90.2 (embedded, admin at `/admin`)
- `@payloadcms/db-postgres` — Neon Postgres
- React 19, Tailwind

## Requirements

- Node.js `^18.20.2 || >=20.9.0`
- npm 10+ (or pnpm 9/10/11)

## Setup

```bash
git clone git@github.com:Akur2008/madeirabook-platform.git
cd madeirabook-platform
cp .env.example .env
npm install
```

Fill in `.env`:

| Variable         | Description                                          |
| ---------------- | ---------------------------------------------------- |
| `DATABASE_URL`   | Neon Postgres connection string (same DB as core)    |
| `PAYLOAD_SECRET` | Random secret string (e.g. `openssl rand -hex 32`)   |

Payload creates its own tables in the shared database on first run (schema push in dev mode). It does not modify existing tables — do NOT touch the `legacy` schema.

## Run

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Admin panel: http://localhost:3000/admin — create the first admin user on first visit
- REST API: http://localhost:3000/api/gateways

## Build

```bash
npm run build
npm start
```

## Useful scripts

| Command                     | Purpose                                  |
| --------------------------- | ---------------------------------------- |
| `npm run generate:types`    | Regenerate `src/payload-types.ts`        |
| `npm run generate:importmap`| Regenerate admin import map              |
| `npm run lint`              | ESLint                                   |
| `npm run test:int`          | Integration tests (vitest)               |
| `npm run test:e2e`          | E2E tests (playwright)                   |

## Collections

- `users` — admin auth
- `media` — uploads
- `locations`, `amenities`, `properties` — domain content
- `gateways` — test collection (connectivity check)

Globals: `privacy-policy`, `terms-of-service`, `cookie-policy`, `legal-info`.
