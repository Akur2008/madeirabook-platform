# Madeirabook Platform — Roadmap

**Last updated:** 2026-09-29  
**Platform:** Next.js 15.5.4 + Payload CMS v3.90.2 + Neon Postgres

---

## Current Status

### Phase 1: Foundation (In Progress)
- [x] Project setup (Next.js 15, Payload CMS v3)
- [x] Neon Postgres connection
- [x] Health check API endpoint (`/api/health`)
- [x] Current site structure analysis
- [x] Architecture documentation
- [ ] Payload CMS collections setup
- [ ] Basic frontend components
- [ ] Integration with existing madeirabook-core

---

## Phase 2: Payload CMS Collections (Priority)

### 1. Properties Collection

**Purpose:** Store property metadata for display and search.

**Fields:**
- `id` (Auto-increment)
- `slug` (Text, unique)
- `name` (Text, required)
- `description` (Rich Text)
- `type` (Select: apartment, villa, hotel, eco-lodge)
- `location` (Group):
  - `city` (Text)
  - `area` (Text)
  - `address` (Text)
  - `coordinates` (Point/JSON)
- `capacity` (Group):
  - `bedrooms` (Number)
  - `bathrooms` (Number)
  - `maxGuests` (Number)
  - `floorSize` (Number, m²)
- `amenities` (Array, checkboxes)
- `images` (Array, upload)
- `pms` (Select: zeevou, smoobu)
- `pmsPropertyId` (Text)
- `returningGuestDiscount` (Boolean, default: false)
- `status` (Select: active, inactive, archived)
- `createdAt` (Date)
- `updatedAt` (Date)

**Integration points:**
- Sync with Zeevou/Smoobu API
- Display on property pages
- Search/filter in frontend
- 10% discount logic for returning guests

---

### 2. Articles Collection

**Purpose:** Content management for guides, blog posts, and SEO pages.

**Fields:**
- `id` (Auto-increment)
- `slug` (Text, unique)
- `title` (Text, required)
- `summary` (Text, max 160 chars)
- `content` (Rich Text)
- `category` (Select: flights, stays, guides, food, weather, history)
- `tags` (Array, text)
- `publishedAt` (Date)
- `author` (Text)
- `featuredImage` (Upload)
- `gallery` (Array, upload)
- `seo` (Group):
  - `metaTitle` (Text)
  - `metaDescription` (Text)
  - `ogImage` (Upload)
- `status` (Select: draft, published, archived)
- `views` (Number, default: 0)
- `tier` (Select: pillar, regular, one-time)
- `anomaly` (Select: 1-6, null)
- `visualAnchor` (Select: map, chart, circle, before-after)
- `createdAt` (Date)
- `updatedAt` (Date)

**Integration points:**
- Dynamic routing for article pages
- SEO meta tags
- Related articles suggestions
- Tier-based content strategy
- Anomaly-based categorization

---

### 3. Subscribers Collection

**Purpose:** Email list management for PDF guides and newsletters.

**Fields:**
- `id` (Auto-increment)
- `email` (Text, unique, required)
- `source` (Select: homepage, flight-alerts, pdf-guide, thefork, telegram)
- `telegramId` (BigInt, nullable)
- `status` (Select: active, unsubscribed, bounced)
- `segments` (Array: guest, returning, restaurant-lover, flight-watcher)
- `subscribedAt` (Date)
- `unsubscribedAt` (Date, nullable)
- `lastEmailSent` (Date, nullable)
- `emailCount` (Number, default: 0)
- `metadata` (JSON)

**Integration points:**
- `/api/subscribe` endpoint
- Resend email service
- Telegram bot linking
- n8n automation workflows
- Flight alerts triggers

---

### 4. Guests Collection

**Purpose:** Guest profiles for loyalty program and returning guest tracking.

**Fields:**
- `id` (Auto-increment)
- `telegramId` (BigInt, unique, nullable)
- `email` (Text, unique, nullable)
- `name` (Text)
- `phone` (Text)
- `language` (Select: en, ru, de, fr, es)
- `segment` (Select: new, returning, vip)
- `bookings` (Array, references to external PMS booking IDs)
- `firstBookingDate` (Date, nullable)
- `lastBookingDate` (Date, nullable)
- `totalBookings` (Number, default: 0)
- `lastStayPropertyId` (Text, nullable)
- `preferences` (JSON: food, activities, season)
- `feedback` (Array):
  - `bookingId` (Text)
  - `rating` (Number, 1-10)
  - `comment` (Text)
  - `isPublic` (Boolean)
  - `createdAt` (Date)
- `notifications` (Group):
  - `emailEnabled` (Boolean, default: true)
  - `telegramEnabled` (Boolean, default: true)
  - `whatsappEnabled` (Boolean, default: false)
- `createdAt` (Date)
- `updatedAt` (Date)

**Integration points:**
- Telegram Mini App authentication
- 10% discount eligibility
- n8n return guest automation
- Review collection (private/public)
- WhatsApp/360dialog integration

---

## Phase 3: Frontend Development

### Priority 1: Core Components
- [ ] Navigation component (sticky, responsive)
- [ ] Hero section with property search
- [ ] Property card component
- [ ] Article card component
- [ ] Footer component
- [ ] CTA buttons with UTM tracking

### Priority 2: Property Pages
- [ ] Property listing page
- [ ] Property detail page (dynamic route)
- [ ] Property search/filter
- [ ] Booking integration (Zeevou deep-link)
- [ ] Schema.org VacationRental markup

### Priority 3: Content Pages
- [ ] Article listing page
- [ ] Article detail page (dynamic route)
- [ ] Category pages (flights, stays, guides, etc.)
- [ ] Related articles component
- [ ] Schema.org Article/FAQPage markup

### Priority 4: Guest Features
- [ ] Email subscription form
- [ ] PDF guide download
- [ ] Flight alerts signup
- [ ] Telegram bot deep-links
- [ ] Returning guest discount UI

---

## Phase 4: Integrations

### External Systems
- [ ] Zeevou API (properties, calendar, bookings)
- [ ] Smoobu API (properties, calendar, bookings)
- [ ] Stripe Connect (payments, owner onboarding)
- [ ] Resend (email delivery)
- [ ] 360dialog (WhatsApp messages)
- [ ] n8n (automation workflows)
- [ ] TheFork (restaurant affiliate)
- [ ] TravelPayouts (flights, car rental)

### Webhooks
- [ ] Stripe payment events
- [ ] Telegram bot events
- [ ] Zeevou booking events
- [ ] Smoobu booking events
- [ ] n8n automation triggers

---

## Phase 5: SEO & Performance

### SEO
- [ ] Dynamic sitemap.xml generation
- [ ] robots.txt configuration
- [ ] Canonical URLs
- [ ] Meta tags (title, description, OG)
- [ ] JSON-LD structured data
- [ ] `llms.txt` for AI search
- [ ] Image optimization (Next.js Image)

### Performance
- [ ] Image optimization and lazy loading
- [ ] Code splitting
- [ ] Font optimization
- [ ] Critical CSS inlining
- [ ] Service worker for offline support
- [ ] Vercel Edge caching configuration

---

## Phase 6: Analytics & Monitoring

### Analytics
- [ ] Google Analytics 4 setup
- [ ] Search Console integration
- [ ] Custom event tracking (bookings, subscriptions)
- [ ] UTM parameter handling
- [ ] Conversion tracking

### Monitoring
- [ ] Error tracking (Sentry or similar)
- [ ] Uptime monitoring
- [ ] Performance monitoring (Vercel Analytics)
- [ ] API response time tracking
- [ ] Database query performance

---

## Phase 7: Testing

### Unit Tests
- [ ] API endpoint tests
- [ ] Utility function tests
- [ ] Collection validation tests

### Integration Tests
- [ ] Payload CMS CRUD operations
- [ ] External API integrations (Zeevou, Smoobu)
- [ ] Webhook handling
- [ ] Email sending (Resend)

### E2E Tests
- [ ] Property search flow
- [ ] Subscription flow
- [ ] Booking deep-link flow
- [ ] Mobile responsiveness

---

## Phase 8: Deployment

### Infrastructure
- [ ] Vercel project configuration
- [ ] Environment variables setup
- [ ] Domain configuration (madeirabook.com)
- [ ] SSL certificate
- [ ] CDN configuration

### CI/CD
- [ ] GitHub Actions for automated testing
- [ ] Automated deployment on push to main
- [ ] Database migration scripts
- [ ] Rollback procedures

---

## Migration from Existing Stack

### From madeirabook-site (Static HTML)
- [ ] Migrate property pages to dynamic routes
- [ ] Convert inline styles to Tailwind
- [ ] Move content to Payload CMS
- [ ] Preserve existing SEO (redirects)
- [ ] Update UTM tracking

### From madeirabook-core (Express)
- [ ] Migrate API endpoints to Next.js API routes
- [ ] Integrate with Payload CMS
- [ ] Update webhook handlers
- [ ] Migrate database schema to Payload collections
- [ ] Preserve authentication logic

---

## Timeline Estimates

| Phase | Duration | Dependencies |
|---|---|---|
| Phase 1: Foundation | 1 week | - |
| Phase 2: CMS Collections | 2 weeks | Phase 1 |
| Phase 3: Frontend Core | 2 weeks | Phase 2 |
| Phase 3: Property Pages | 1 week | Phase 3 Core |
| Phase 3: Content Pages | 1 week | Phase 3 Core |
| Phase 3: Guest Features | 1 week | Phase 3 Core |
| Phase 4: Integrations | 3 weeks | Phase 2, 3 |
| Phase 5: SEO & Performance | 1 week | Phase 3 |
| Phase 6: Analytics | 1 week | Phase 3 |
| Phase 7: Testing | 2 weeks | Phase 3, 4 |
| Phase 8: Deployment | 1 week | All phases |

**Total estimated time:** 14-16 weeks

---

## Risk Mitigation

### Technical Risks
- **Payload CMS learning curve:** Allocate extra time for team training
- **External API rate limits:** Implement caching and queueing
- **Database migration risks:** Comprehensive testing before production
- **Performance degradation:** Load testing before launch

### Business Risks
- **SEO impact during migration:** Implement proper redirects
- **User experience disruption:** Gradual rollout with feature flags
- **Third-party service downtime:** Fallback mechanisms
- **Data loss:** Regular backups and rollback procedures

---

## Success Metrics

### Technical Metrics
- Page load time < 2s (Lighthouse score > 90)
- API response time < 200ms
- 99.9% uptime
- Zero critical bugs in production

### Business Metrics
- Organic traffic growth: +50% in 6 months
- Email conversion rate: >5%
- Returning guest rate: >20%
- Direct booking conversion: >2%

---

## Notes

- **Database schema changes:** Must go through Payload CMS migrations
- **External API changes:** Monitor and update adapters accordingly
- **Security:** Regular dependency updates, security audits
- **Documentation:** Keep API docs and component docs up to date
- **Team communication:** Weekly syncs, clear task assignment

---

**Last reviewed:** 2026-09-29  
**Next review:** 2026-10-06
