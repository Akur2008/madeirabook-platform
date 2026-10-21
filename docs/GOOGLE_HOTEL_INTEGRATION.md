# Google Hotel Prices / Free Booking Links — ARI Integration

Prototype of an internal ARI engine that serves rates and availability to
Google Hotel Center so properties appear in Google Maps and Free Booking
Links with direct-booking prices.

## Components

- `src/lib/googleAri.ts` — ARI engine: property resolution, per-day rates via
  `src/lib/pms` (Smoobu/Zeevou router), in-memory cache, Google Transaction
  XML/JSON builders, OTA push messages, OAuth 2.0 service-account flow.
- `src/app/api/google/rates/route.ts` — live-query endpoint.
- `src/lib/googleHotelCenter.ts` + `src/app/api/google/hotel-center/feed/route.ts`
  — multi-hotel price/availability feed for Hotel Center.
- `src/lib/googleIndexing.ts` — Google Indexing API submit, wired into the
  `Properties` `afterChange` hook.
- `scripts/test-google-rates.ts`, `scripts/test-google-hotel-center.ts` —
  validation runners.

## Live query endpoint

```
GET /api/google/rates?hotel_id=<slug|pmsPropertyId|id>
                    &checkin=YYYY-MM-DD&checkout=YYYY-MM-DD
                    &currency=EUR&format=xml|json&push=1
```

- `hotel_id` resolves against property `slug`, then `pmsPropertyId`, then the
  numeric Payload id. Only `status=published` properties are served.
- Default response is a Google `Transaction` XML message (`<Result>` with
  `Baserate`, `Tax`, `OtherFees`, `AllowablePointsOfSale` + deep-linked
  `URL`). `format=json` returns the same structure as JSON for debugging.
- Unavailable itineraries return HTTP 200 with `Baserate = -1` (Google
  convention), never an HTTP error.
- `push=1` additionally runs the ARI push path and returns the outcome —
  in sandbox mode the exact OAuth + HTTP POST request that would be sent.
- Diagnostics headers: `X-ARI-Cache: HIT|MISS`, `X-Response-Time`.

## Rate data mapping

- Nightly prices: `pms.getRates()` (Smoobu `/api/rates` or Zeevou rates via
  the router in `src/lib/pms`). Missing days fall back to
  `property.pricePerNight` and are treated as sellable — our checkout
  (`/api/checkout`) re-validates availability before payment.
- `OtherFees` = `property.cleaningFee`. `Tax` = 0 (PMS totals are
  tax-inclusive; a `TaxFeeInfo` message can be added later if needed).
- Availability: all nights in `[checkin, checkout)` must be present and not
  `available=false`; `minStay` on the check-in night is enforced.
- Degradation: `unavailableReason` is `no_pms_link` (property has no
  `pmsPropertyId`), `pms_unavailable` (PMS call failed),
  `closed_or_unpriced_night`, `min_stay`, or `no_nights`. All map to
  `Baserate -1` — Google is never served guessed prices.
- Warm-cache hits skip Postgres and the PMS entirely (keyed on raw query
  params), keeping the engine at ~0-5ms.
- Deep link: `{APP_URL}/p/{slug}?checkin=...&checkout=...&guests=2
  &utm_source=google&utm_medium=free_booking_link` → Stripe Checkout flow.

## Performance

- Responses are cached in-process (`globalThis` Map), TTL
  `GOOGLE_RATES_CACHE_TTL_MS` (default 60s). Warm hits are single-digit ms.
- Cold queries depend on PMS API latency; Google tolerates ~1s on live
  queries. Use `invalidateGoogleAri(propertyId)` after rate writes.

## Push mode (ARI delivery)

When credentials are configured the engine POSTs
`OTA_HotelRateAmountNotifRQ` + `OTA_HotelAvailNotifRQ` to
`https://www.google.com/travel/hotels/uploads/property_data` with an OAuth
2.0 service-account bearer token (JWT grant, scope
`https://www.googleapis.com/auth/travelpartner`).

## Environment variables

```
GOOGLE_HOTEL_PARTNER_KEY=        # RequestorID from Hotel Center
GOOGLE_HOTEL_ACCOUNT_ID=         # Hotel Center account id
GOOGLE_HOTEL_LANDING_PAGE_ID=direct   # PointOfSale id (Landing Pages feed)
GOOGLE_SERVICE_ACCOUNT_JSON=     # service account JSON (client_email+private_key)
GOOGLE_HOTEL_PUSH_ENDPOINT=      # override uploads endpoint if needed
GOOGLE_RATES_CACHE_TTL_MS=60000
GOOGLE_HOTEL_FEED_SLUGS=         # comma-separated feed override (default: orquidea+barcelo)
GOOGLE_INDEXING_KEY=             # service account JSON for the Indexing API
```

Without `GOOGLE_HOTEL_PARTNER_KEY` + `GOOGLE_SERVICE_ACCOUNT_JSON` the push
path runs in sandbox mode and returns the exact request instead of sending.

## Test

```
npm run dev
npx tsx scripts/test-google-rates.ts [--hotel=slug] [--base=URL]
```

## Hotel Center Feed — multi-hotel pilot (Orquídea + Barceló)

Production candidate feed for the Connectivity Partner application:

```
GET /api/google/hotel-center/feed
    ?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&guests=2&format=xml|json
    &hotels=slug1,slug2
```

- Feed hotels: `hotel-orquidea` (Hotel Orquídea — Funchal Center) and
  `barcelo-funchal-oldtown` (Barceló Funchal Oldtown). The list lives in
  `FEED_HOTEL_SLUGS` (`src/lib/googleHotelCenter.ts`), can be overridden
  globally via `GOOGLE_HOTEL_FEED_SLUGS` (comma-separated) or per request
  via the `hotels` param.
- Default response is XML: `<HotelCenterFeed>` → one `<Hotel>` per
  property → `<Property>` (id, name, address, lat/lng, landing page,
  image) + one `<Room>` per active UnitType.
- Each `<Room>` carries `<Availability status="available|blocked">` and a
  `<NightlyRates>` block with one `<Night date price available>` per day
  of the window — the default window is the next 30 days
  (`checkin=today`, `checkout=today+30`), capped at 62 nights.
- Prices are live: properties with a `pmsPropertyId` pull per-night rates
  from the PMS router (Smoobu `/api/rates` via `src/lib/pms`), so a price
  change in Smoobu shows up on the next request (the route is
  `Cache-Control: no-store`). Unlinked properties use the DB rate —
  rate plan `basePrice`, falling back to `property.pricePerNight`.
- A failed PMS call marks the room `blocked` (`reason="pms_unavailable"`)
  rather than serving guessed prices; nights missing from the PMS
  response fall back to the DB rate and stay sellable — checkout
  re-validates before payment.
- `format=json` returns the same structure for debugging.
- Implementation: `src/lib/googleHotelCenter.ts`
  (`generateHotelCenterFeed`, `toHotelCenterXml`, `toHotelCenterJson`) +
  `src/app/api/google/hotel-center/feed/route.ts`.

curl examples:

```
# XML feed, next 30 days, both pilot hotels
curl 'http://localhost:3000/api/google/hotel-center/feed'

# JSON debug view
curl 'http://localhost:3000/api/google/hotel-center/feed?format=json'

# Single hotel / custom window
curl 'http://localhost:3000/api/google/hotel-center/feed?hotels=hotel-orquidea&checkin=2026-11-01&checkout=2026-11-15'
```

Validate locally:

```
npm run dev
npx tsx scripts/test-google-hotel-center.ts [--base=URL]
```

## Google Indexing API

`src/lib/googleIndexing.ts` exports `submitToGoogleIndexing(url)` — it
publishes a `URL_UPDATED` notification via the `googleapis` package
(`indexing.urlNotifications.publish`, scope
`https://www.googleapis.com/auth/indexing`). The `Properties` collection
`afterChange` hook calls it with the property landing page
(`${APP_URL}/p/{slug}`) every time `status` becomes `published`.

```
GOOGLE_INDEXING_KEY=   # service account JSON (client_email + private_key)
```

Without the key the function logs a warning and skips — publishing a
property never fails because of indexing. The service account must be
added as a site owner in Search Console for notifications to be accepted.

### Submitting to Google Hotel Center (once approved)

1. In Hotel Center, register a Hotel List / price feed pointing at
   `https://www.madeirabook.com/api/google/hotel-center/feed`
   (XML, default format).
2. Map each `<PropertyID>` to the matching Google hotel listing
   (`hotel-orquidea` → Hotel Orquídea Funchal, `barcelo-funchal-oldtown`
   → Barceló Funchal Oldtown).
3. Validate the feed in Hotel Center's feed tool, then enable Free
   Booking Links with the `direct` PointOfSale.
4. For pull delivery keep the endpoint public; for push delivery reuse
   the OAuth flow in `src/lib/googleAri.ts`.
5. Add the Indexing API service account as a Search Console owner so
   `afterChange` notifications are accepted.

## Next steps

- Hotel List feed (`/api/google/hotels` or static) with `geoCoordinates`.
- Landing Pages feed declaring the `direct` PointOfSale.
- Consume `checkin/checkout/guests` params on `/p/[slug]` to prefill the
  BookingDrawer.
- Optional TaxFeeInfo message for Madeira tourist tax.
