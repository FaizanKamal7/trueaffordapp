/**
 * Default auto loan APR assumptions by credit score band, for a new-car
 * loan (used-car APRs run somewhat higher across every band, which this
 * simplified model does not separately track).
 *
 * Source: a static "as of" base rate (top credit tier) plus published
 * typical APR spreads by credit tier, compiled from the general shape of
 * industry credit-tier auto loan rate reporting (e.g. Experian's "State of
 * the Automotive Finance Market" quarterly-style breakdowns, which
 * routinely show a very wide gap between prime and deep-subprime auto
 * borrowers — far wider than the equivalent mortgage credit-band spread).
 * Since live rate feeds are explicitly out of scope for this product, this
 * base rate is a deliberate static default that MUST be reviewed and
 * updated periodically (auto rates move with the broader rate environment)
 * — never presented as current without checking `BASE_RATE_AS_OF`. Every
 * rate shown in the UI must disclose this date.
 *
 * This reuses the mortgage CreditBand type/bands (see pmi-rates.ts) for UI
 * consistency across the site, even though real auto lenders tier credit
 * somewhat differently than mortgage lenders — a documented simplification.
 */

import type { CreditBand } from "./pmi-rates";

export const BASE_RATE_AS_OF = "2025-01-01";
export const RATE_SOURCE =
  "Static baseline set from published new-car average APR for top-tier credit (e.g. Experian State of the Automotive Finance Market-style reporting) as of BASE_RATE_AS_OF, adjusted per credit band using the typical prime-to-subprime APR spread reported for auto loans. Not a live feed — must be reviewed periodically.";

/** Top-tier (760+) new-car APR baseline */
const BASE_RATE = 0.0649;

/**
 * Auto loan credit-band spreads are dramatically wider than mortgage
 * spreads — a deep-subprime auto borrower routinely pays 10-15 points more
 * than a prime borrower, versus roughly 1.5 points for mortgages. This is
 * a real, well-documented feature of the auto lending market (mortgages
 * are secured by an appreciating/stable asset and underwritten more
 * conservatively; auto loans are secured by a rapidly depreciating asset
 * and subprime auto lending carries much higher default risk), not a
 * data error.
 */
const CREDIT_BAND_SPREAD: Record<CreditBand, number> = {
  "760+": 0,
  "740-759": 0.0075,
  "720-739": 0.0145,
  "700-719": 0.0225,
  "680-699": 0.032,
  "660-679": 0.0475,
  "640-659": 0.0775,
  "620-639": 0.1175,
};

export function getDefaultAutoLoanRate(creditBand: CreditBand): number {
  return BASE_RATE + CREDIT_BAND_SPREAD[creditBand];
}
