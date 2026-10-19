# Ambassador Onboarding — Applications → Referral → Stripe → Live Map

## Flow

1. Creator applies at `/ambassadors` → `applications` row with `status='new'`.
2. Admin sets `status='approved'` in `/admin` → `createAmbassadorInvitation`
   afterChange hook (`src/collections/Applications.ts`) fires once:
   - creates `referrals` row: unique `code` from the Instagram handle,
     `status='paused'`, 7-day `invitationToken`, copied beach/restaurant picks;
   - creates a Stripe **Express** account (`type: 'express'`,
     `business_type: 'individual'`, `card_payments` + `transfers`
     capabilities, monthly payouts on the 1st) and stores
     `stripeAccountId` on the referral;
   - emails the ambassador the acceptance email (map link + welcome link +
     Stripe onboarding link).
3. Ambassador opens `/ambassadors/welcome/<token>` → POST
   `/api/ambassador/accept` → `invitationUsedAt` set + `status='active'`.
4. `/m/<code>` serves the map only when `status='active'`. `stripeAccountId`
   is **not** required for the map — a missing Stripe account does not 404
   the map; `status != 'active'` does.

## Idempotency

- The hook runs only on the `status` transition into `approved`
  (`previousDoc.status !== 'approved'`).
- If a referral already exists for the application, the hook does not
  recreate it and does not resend the invitation email — but it **retries**
  Stripe setup when `stripeAccountId` is empty (self-heal on re-approval).
- `attachStripeAccount` skips any referral that already has
  `stripeAccountId`. Stripe failure never blocks referral creation — it is
  logged (`code`, `message`, `type`, `requestId`) and reported via admin
  alert email.
- `scripts/create-stripe-for-ambassador.ts` is idempotent for the same
  reason; safe to re-run for any code.

## Manual repair / backfill

```bash
# Single ambassador (also sends the payout-setup email):
npx tsx scripts/create-stripe-for-ambassador.ts merlin_visual

# All active referrals missing stripeAccountId (no emails sent):
npx tsx scripts/create-stripe-for-ambassador.ts --backfill-active
```

Both commands use local `.env` (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`,
`DATABASE_URL`). The Stripe secret must belong to the same account/mode as
production — today that is Stripe **test mode**; switch `sk_live_*` only
when the platform goes live with Connect.

## Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Referral created, `stripeAccountId` empty, no error | `STRIPE_SECRET_KEY` missing in the deploy env (hook skips silently) | Set the env var, re-run the repair script or re-toggle `approved` |
| `Stripe create failed: platform_capabilities_incomplete` | Platform not allowed to request `card_payments`/`transfers` for Express accounts | Stripe Dashboard → Settings → Connect: enable Card Payments and Transfers for connected accounts |
| `/m/<code>` → 404 | `status != 'active'` (invitation not accepted) or wrong code | Check referral `status`; ambassador accepts via welcome link, or set `active` in `/admin` |
| Onboarding link expired | `accountLinks` URLs are single-use/short-lived | Re-run the script — it creates a fresh link only when `stripeAccountId` is missing; otherwise create a link via `stripe.accountLinks.create` for the stored account |
| Acceptance email missing | `RESEND_API_KEY` unset or Resend error | Check logs; resend manually — hook does not retry email |

## Related code

- `src/collections/Applications.ts` — approve hook, Stripe account creation.
- `src/app/api/ambassador/accept/route.ts` — invitation acceptance.
- `src/app/(frontend)/m/[code]/page.tsx` — public ambassador map.
- `src/lib/emails/templates.ts` — `ambassadorAccepted` email.
