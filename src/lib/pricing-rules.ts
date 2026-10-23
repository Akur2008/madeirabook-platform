// PRICING RULES — the single source of truth for how a property is priced
// and sold. Roles, intentionally separated:
//
//   PMS (price source — source of truth for prices):
//     - smoobu  — prices come from the Smoobu API
//     - zeevou  — prices come from the Zeevou API (when Zeevou acts as PMS)
//     - manual  — price entered by hand in our own DB (pricePerNight)
//
//   Channel Manager (transport only — NOT a price source):
//     - siteminder — distributes inventory; a price never comes from it
//
//   Display only (no price, no booking):
//     - display_only — showcase pin on the map, e.g. Hotel Orquídea
//
// DO NOT MODIFY WITHOUT ARCHITECT APPROVAL.

export type PricingScenario =
  | 'smoobu'
  | 'zeevou'
  | 'siteminder'
  | 'manual'
  | 'display_only'

export type PriceSource =
  | 'smoobu_api'
  | 'zeevou_api'
  | 'siteminder_api'
  | 'payload_db'
  | null

export interface PricingRule {
  priceSource: PriceSource
  isBookable: boolean
  showInGoogle: boolean
  commission: number
}

export const PRICING_RULES: Record<PricingScenario, PricingRule> = {
  smoobu: {
    priceSource: 'smoobu_api',
    isBookable: true,
    showInGoogle: true,
    commission: 12,
  },
  zeevou: {
    priceSource: 'zeevou_api',
    isBookable: true,
    showInGoogle: true,
    commission: 15,
  },
  siteminder: {
    priceSource: 'siteminder_api',
    isBookable: false,
    showInGoogle: false,
    commission: 20,
  },
  manual: {
    priceSource: 'payload_db',
    isBookable: true,
    showInGoogle: true,
    commission: 12,
  },
  display_only: {
    priceSource: null,
    isBookable: false,
    showInGoogle: false,
    commission: 0,
  },
}

// Minimal shape — any object carrying the pricingScenario field.
export interface ScenarioRef {
  pricingScenario?: string | null
}

// Reads the property's pricing scenario. An unset/unknown value is
// display_only — the field is required with that same default in Payload,
// so a missing value can only mean "not yet classified" and must never
// silently sell.
export function getScenario(
  property: ScenarioRef | null | undefined,
): PricingScenario {
  const s = property?.pricingScenario
  return s && s in PRICING_RULES ? (s as PricingScenario) : 'display_only'
}

export function pricingRule(
  property: ScenarioRef | null | undefined,
): PricingRule {
  return PRICING_RULES[getScenario(property)]
}

// True when the stay can be sold through our checkout.
export function isBookable(property: ScenarioRef | null | undefined): boolean {
  return pricingRule(property).isBookable
}

// True when the property is allowed into Google Hotel Prices / ARI surfaces
// (live-query endpoint, Hotel Center feed).
export function showsInGoogle(
  property: ScenarioRef | null | undefined,
): boolean {
  return pricingRule(property).showInGoogle
}
