# Madeirabook.com — Current Site Structure Analysis

**Date:** 2026-09-29 (Updated: 11:55 UTC)  
**URL:** https://www.madeirabook.com  
**Redirect:** madeirabook.com → www.madeirabook.com (HTTP 308)

---

## HTTP Headers

### Primary Response (www.madeirabook.com)
```
HTTP/2 200
accept-ranges: bytes
access-control-allow-origin: *
age: 179432
cache-control: public, max-age=0, must-revalidate
content-disposition: inline
content-type: text/html; charset=utf-8
date: Tue, 29 Sep 2026 11:55:03 GMT
etag: "b360ecf6afffdfb4245b1b1a6f4bf557"
last-modified: Sun, 27 Sep 2026 10:04:30 GMT
server: Vercel
strict-transport-security: max-age=63072000
x-vercel-cache: HIT
x-vercel-id: cdg1::drs87-1790682903763-ff74d516bcf8
content-length: 17587
```

**Key observations:**
- Hosted on Vercel
- Static HTML (content-length: 17.5KB)
- HSTS enabled (63072000s = 2 years)
- CORS allowed for all origins
- Cache HIT (served from edge cache, age: 179432s ≈ 2 days)

---

## HTML Structure

### Document Meta
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Madeira Stays — Direct Booking | Madeirabook</title>
  <meta name="description" content="Book ocean-view apartments in Madeira directly from local hosts. Best price guaranteed, no platform fees, -10% for returning guests.">
  <meta name="theme-color" content="#1a3a2e">
```

**SEO Meta:**
- Title: "Madeira Stays — Direct Booking | Madeirabook"
- Description: Focus on direct booking, local hosts, no fees
- Theme color: #1a3a2e (dark green)
- Image preload: `/hero.jpg`

### Page Layout

#### 1. Navigation (Sticky)
```html
<nav class="border-b border-slate-200 py-4 px-6 sticky top-0 bg-white/95 backdrop-blur z-50">
```
- Logo: "Madeirabook"
- Links: Stays, Flights, Guides, Weather
- CTA: "Book →" (redirects to madeirabook.zeevou.direct)
- Mobile: horizontal scrollable menu

#### 2. Hero Section
```html
<section class="hero">
```
- Background: `/images/madeira-cover-balcony.jpg`
- Headline: "Madeira stays, direct."
- Subhead: Focus on returning guests, ocean-view, local hosts
- CTA 1: "Book a stay" → madeirabook.zeevou.direct
- CTA 2: "Find flights from your city" → /book-flights
- Gradient overlay for text readability

#### 3. Weather Widget
```html
<iframe src="https://www.meteoblue.com/en/weather/maps/widget/funchal_portugal_2267827?...">
```
- Meteoblue weather widget
- Location: Funchal, Portugal
- Embedded iframe with weather map
- Sandbox restrictions for security

#### 4. Why Guests Return Section
```html
<section style="background:#f8fafc;padding:64px 24px;">
```
- Headline: "Why guests come back to Madeira"
- **Aviasales widget** (TP.emd integration):
  ```html
  <script async src="https://tpemd.com/content?currency=eur&trs=575770&shmarker=779585&destination=FNC...">
  ```
  - Flight price comparison
  - Commission tracking (trs=575770, shmarker=779585)
  - Target: FNC (Funchal airport)
  - Currency: EUR
  - Limit: 6 results

- **Feature cards (4):**
  1. "Summer all year" → /best-time-to-visit-madeira.html
  2. "Flights from €15" → /book-flights.html
  3. "Safest in Europe" → /madeira-safety.html
  4. "Events off-season" → /madeira-events-calendar.html

- **Email subscription form:**
  ```html
  <form id="subscribe-form-home">
  ```
  - POST to: `https://madeirabook-core.vercel.app/api/subscribe`
  - Payload: `{ email, source: 'homepage' }`
  - Promise: "free Madeira guide"
  - JavaScript fetch with error handling

#### 5. Footer
```html
<footer style="background:#0f172a;color:#94a3b8;padding:64px 24px 32px;">
```
- 6 columns:
  1. Madeirabook (brand)
  2. Stay (where to stay, rentals, locations)
  3. Flights (cities, search, routes)
  4. Food & Wine (guides, restaurants, drinks)
  5. Explore (safety, events, history, tours)
  6. Contact (Telegram bot, WhatsApp, booking)

- Floating buttons:
  - Telegram: t.me/Madeirabookbot (fixed top-right)
  - WhatsApp: wa.me/79626854685 (fixed bottom-right)

#### 6. Hidden SEO Content
```html
<div class="seo-hidden">
```
- Hidden via CSS (`position: absolute; left: -9999px`)
- Contains additional SEO text with internal links
- Purpose: SEO optimization without visible clutter

---

## Technologies & External Services

### 1. CSS Framework
```html
<script src="https://cdn.tailwindcss.com"></script>
```
- Tailwind CSS (CDN version)
- Used for navigation and floating buttons
- Inline styles for hero section

### 2. Weather Widget
- **Provider:** Meteoblue
- **Type:** Embedded iframe
- **Location:** Funchal, Portugal (ID: 2267827)
- **Features:** Wind animation, satellite, cloud maps
- **Security:** Sandbox restrictions

### 3. Flight Search
- **Provider:** TP.emd (Aviasales affiliate)
- **Script:** https://tpemd.com/content
- **Tracking:**
  - `trs=575770` (Travel Payouts affiliate ID)
  - `shmarker=779585` (sub-affiliate marker)
  - Destination: FNC (Funchal)
- **Target:** www.aviasales.com/search
- **Campaign:** promo_id=4044, campaign_id=100

### 4. Email Subscription
- **Endpoint:** https://madeirabook-core.vercel.app/api/subscribe
- **Method:** POST
- **Body:** JSON `{ email, source }`
- **Response:** `{ ok: boolean }`
- **Error handling:** UI feedback for success/failure

### 5. Booking System
- **Platform:** Zeevou
- **URL:** madeirabook.zeevou.direct
- **Type:** White-label booking engine
- **Purpose:** Direct booking without platform fees

### 6. Contact Channels
- **Telegram:** t.me/Madeirabookbot
- **WhatsApp:** wa.me/79626854685 (Russian number: +7 962 685-4685)
- **Pre-filled message:** "I want to have a holiday in Madeira"

---

## JSON-LD Microdata

**Status:** ❌ No JSON-LD microdata detected in the HTML.

**Recommendation:** Add structured data for:
- Organization schema (business info, contact)
- LocalBusiness schema (location, hours)
- FAQ schema (common questions)
- BreadcrumbList schema (navigation)
- Article schema (for guide pages)

---

## Internal Link Structure

### Main Categories
1. **Stays**
   - /madeira-apartment-rentals.html
   - /where-to-stay-madeira.html
   - /funchal-short-term-rentals.html
   - /canico-self-catering.html

2. **Flights**
   - /flights-to-madeira.html
   - /book-flights.html
   - /london-to-madeira.html
   - /paris-to-madeira.html

3. **Guides**
   - /madeira-guide.html
   - /madeira-food-guide.html
   - /where-to-eat-madeira.html
   - /madeira-safety.html
   - /madeira-events-calendar.html
   - /madeira-history.html
   - /madeira-tours.html
   - /madeira-guide-replacement.html

4. **Food & Wine**
   - /espetada.html
   - /poncha.html
   - /madeira-wine-tasting.html

5. **Weather**
   - /best-time-to-visit-madeira.html

---

## External Links

### Booking & Services
- madeirabook.zeevou.direct (booking engine)
- www.meteoblue.com (weather widget)
- tpemd.com (flight affiliate)
- www.aviasales.com (flight search)

### Contact
- t.me/Madeirabookbot (Telegram)
- wa.me/79626854685 (WhatsApp)

---

## Performance Observations

1. **Static HTML:** Entire page is pre-rendered (17.5KB)
2. **CDN Caching:** Served from Vercel edge cache (HIT, 2-day cache)
3. **External Scripts:**
   - Tailwind CSS (CDN)
   - TP.emd (async)
   - Meteoblue iframe
4. **No JavaScript framework:** Vanilla JS for form handling
5. **Optimization opportunities:**
   - Inline critical CSS
   - Preload hero image (already done)
   - Lazy load weather widget
   - Add JSON-LD for SEO
   - Implement service worker for offline support

---

## Security & Privacy

1. **HSTS:** Enabled (2 years)
2. **CORS:** Permissive (`*`) - consider restricting
3. **No CSP headers detected** - should add Content Security Policy
4. **No tracking pixels visible** (except affiliate scripts)
5. **Email collection:** Sends to madeirabook-core.vercel.app
6. **Iframe sandbox:** Meteoblue widget has sandbox restrictions

---

## Architecture Notes

### Current Stack
- **Hosting:** Vercel (static deployment)
- **Booking:** Zeevou (external SaaS)
- **Email:** Madeirabook-core (separate Vercel app)
- **Affiliate:** Travel Payouts (Aviasales)
- **Weather:** Meteoblue (widget)
- **CSS:** Tailwind (CDN)
- **JS:** Vanilla (no framework)

### Integration Points
1. **Zeevou:** White-label booking (iframe or redirect)
2. **Madeirabook-core:** Email subscription API
3. **Travel Payouts:** Flight search with commission tracking
4. **Telegram/WhatsApp:** Direct messaging channels
5. **Meteoblue:** Weather data via iframe

### Static vs Dynamic
- **Static:** HTML, CSS, most content
- **Dynamic:** Email subscription (API call)
- **External:** Weather widget, flight search (iframes/scripts)

---

## Migration Considerations for Next.js Platform

### What to Keep
- Content structure (hero, features, footer)
- SEO meta tags
- Email subscription integration
- Zeevou booking integration
- Weather widget (or replace with better solution)
- Flight affiliate integration
- Contact channels (Telegram, WhatsApp)

### What to Improve
- Add JSON-LD microdata
- Implement proper error handling for API calls
- Add loading states for external widgets
- Optimize image loading (Next.js Image component)
- Implement proper routing (dynamic routes for guides)
- Add analytics/tracking (if needed)
- Add CSP headers for security
- Restrict CORS policy

### What to Replace
- Tailwind CDN → npm package
- Inline styles → CSS modules or Tailwind
- External flight widget → custom component
- Meteoblue iframe → weather API component
- Static HTML → Next.js SSG/ISR

---

## File Structure Inference

Based on current site, expected static files:
```
/
├── index.html
├── madeira-apartment-rentals.html
├── flights-to-madeira.html
├── madeira-guide.html
├── best-time-to-visit-madeira.html
├── madeira-safety.html
├── madeira-events-calendar.html
├── madeira-food-guide.html
├── where-to-eat-madeira.html
├── espetada.html
├── poncha.html
├── madeira-wine-tasting.html
├── where-to-stay-madeira.html
├── funchal-short-term-rentals.html
├── canico-self-catering.html
├── book-flights.html
├── london-to-madeira.html
├── paris-to-madeira.html
├── madeira-history.html
├── madeira-tours.html
└── madeira-guide-replacement.html
```

Images:
```
/images/
├── madeira-cover-balcony.jpg
└── hero.jpg
```

---

## Next Steps for Platform Migration

1. **Content inventory:** Migrate all HTML pages to Next.js routes
2. **CMS integration:** Move content to Payload CMS collections
3. **API endpoints:**
   - Health check ✅ (already created)
   - Email subscription (integrate with existing)
   - Weather data (replace iframe with API)
   - Flight search (replace widget with API)
4. **Booking integration:** Zeevou API or iframe
5. **SEO enhancement:** Add JSON-LD, sitemap, robots.txt
6. **Performance:** Image optimization, code splitting
7. **Analytics:** Add tracking (if not present)
8. **Security:** Add CSP, restrict CORS

---

## Commission Tracking

### Travel Payouts (Aviasales)
- **Affiliate ID:** 575770
- **Sub-marker:** 779585
- **Campaign ID:** 100
- **Promo ID:** 4044
- **Currency:** EUR
- **Destination:** FNC (Funchal)

### Revenue Model
- Flight bookings via Aviasales (commission)
- Direct bookings via Zeevou (no platform fees)
- Email list building for remarketing
