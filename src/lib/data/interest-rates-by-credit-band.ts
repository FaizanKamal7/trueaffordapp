/**
 * Default 30-year and 15-year fixed mortgage interest rate assumptions
 * by credit score band.
 *
 * Source: a static "as of" base rate (30yr, 760+ credit — the
 * conventional conforming benchmark rate) plus published typical
 * loan-level price adjustment (LLPA) spreads by credit tier, compiled
 * from the general shape of Fannie Mae/Freddie Mac LLPA matrices. Since
 * live rate feeds are explicitly out of scope for this product, this
 * base rate is a deliberate static default that MUST be reviewed and
 * updated periodically (rates move daily) — never presented as current
 * without checking `BASE_RATE_AS_OF`. Every rate shown in the UI must
 * disclose this date.
 */

import type { CreditBand } from "./pmi-rates";

export const BASE_RATE_AS_OF = "2026-09-10";
export const RATE_SOURCE = "Static baseline set from published conforming 30-year fixed averages (e.g. Freddie Mac PMMS), adjusted per credit band using Fannie Mae/Freddie Mac LLPA-style spreads. Not a live feed — must be reviewed periodically.";

const BASE_30YR_RATE = 0.0676;

/** Spread added to the base 30yr rate by credit band, in decimal (0.0025 = +25bps) */
const CREDIT_BAND_SPREAD_30YR: Record<CreditBand, number> = {
  "760+": 0,
  "740-759": 0.0013,
  "720-739": 0.0025,
  "700-719": 0.0038,
  "680-699": 0.0055,
  "660-679": 0.0078,
  "640-659": 0.0105,
  "620-639": 0.0138,
};

/** 15-year fixed typically prices ~50-60bps below the equivalent 30-year rate */
const FIFTEEN_YEAR_DISCOUNT = 0.0055;

export function getDefaultInterestRate(creditBand: CreditBand, termYears: 15 | 30 = 30): number {
  const rate = BASE_30YR_RATE + CREDIT_BAND_SPREAD_30YR[creditBand];
  return termYears === 15 ? rate - FIFTEEN_YEAR_DISCOUNT : rate;
}
