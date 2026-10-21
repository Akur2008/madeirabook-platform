// Central feature flags. Keep them compile-time constants so dead branches
// are easy to tree-shake and audit.
export const FEATURES = {
  // Ambassadors can SEE Madeira Oasis hotels as gold pins on their map
  // (read-only preview). Independent of referrals.oasisAccess, which stays
  // the per-ambassador gate for Oasis commission payouts (Stripe webhook).
  ambassadorOasisAccess: true,
  // "Suggest a hotel" for the Oasis collection — not built, keep off.
  oasisSuggestHotel: false,
  // Public Oasis showcase on madeirabook.com — /oasis stays as is.
  oasisPublic: false,
} as const
