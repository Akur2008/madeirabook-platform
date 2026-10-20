# Google Hotel Prices / Free Booking Links — ARI Integration

Prototype of an internal ARI engine that serves rates and availability to
Google Hotel Center so properties appear in Google Maps and Free Booking
Links with direct-booking prices.

## Components

- `src/lib/googleAri.ts` — ARI engine: property resolution, per-day rates via
  `src/lib/pms` (Smoobu/Zeevou router), in-memory cache, Google Transaction
  XML/JSON builders, OTA push messages, OAuth 2.0 service-account flow.
- `src/app/api/google/rates/route.ts` — live-query endpoint.
- `scripts/test-google-rates.ts` — validation runner.

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
```

Without `GOOGLE_HOTEL_PARTNER_KEY` + `GOOGLE_SERVICE_ACCOUNT_JSON` the push
path runs in sandbox mode and returns the exact request instead of sending.

## Test

```
npm run dev
npx tsx scripts/test-google-rates.ts [--hotel=slug] [--base=URL]
```

## Hotel Center Feed — Orquídea pilot

While the Connectivity Partner application is pending, a static test feed
for a single pilot hotel is served at:

```
GET /api/google/hotel-center/feed
    ?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&guests=2&format=xml|json
```

- Pilot hotel: `hotel-orquidea` (Hotel Orquídea — Funchal Center), one room
  type (`standard-room`, occupancy 2), base rate from `pricePerNight`
  (EUR 110/night, tax-inclusive), 6 photos on R2, geo coordinates.
- Default response is XML: `<HotelCenterFeed>` → `<Hotel>` → `<Property>`
  (id, name, address, lat/lng, landing page, image) + `<Room>` (occupancy,
  check-in/out dates, nightly base rate, taxes, total). `format=json`
  returns the same structure for debugging.
- `checkin`/`checkout` are optional; the feed defaults to a 5-night window
  30 days out so the bare URL always renders.
- Implementation: `src/lib/googleHotelCenter.ts`
  (`generateHotelCenterFeed`, `toHotelCenterXml`, `toHotelCenterJson`) +
  `src/app/api/google/hotel-center/feed/route.ts`.
- Note: `properties` has no address field yet, so the pilot address
  (Rua dos Netos 69-71, 9000-084 Funchal, PT) is a constant in
  `PILOT_HOTEL` — move it into the collection when the schema is
  extended.

### Submitting to Google Hotel Center (once approved)

1. In Hotel Center, register a Hotel List / price feed pointing at
   `https://www.madeirabook.com/api/google/hotel-center/feed`
   (XML, default format).
2. Map `<PropertyID>` (`hotel-orquidea`) to the Google hotel listing for
   Hotel Orquídea, Funchal.
3. Validate the feed in Hotel Center's feed tool, then enable Free
   Booking Links with the `direct` PointOfSale.
4. For pull delivery keep the endpoint public; for push delivery reuse
   the OAuth flow in `src/lib/googleAri.ts`.

Validate locally:

```
npm run dev
npx tsx scripts/test-google-hotel-center.ts [--base=URL]
```

## Next steps

- Hotel List feed (`/api/google/hotels` or static) with `geoCoordinates`.
- Landing Pages feed declaring the `direct` PointOfSale.
- Consume `checkin/checkout/guests` params on `/p/[slug]` to prefill the
  BookingDrawer.
- Optional TaxFeeInfo message for Madeira tourist tax.
- Extend `properties` schema with `address` + per-room inventory to move
  the pilot beyond a single hotel/room.
