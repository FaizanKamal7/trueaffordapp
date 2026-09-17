/**
 * Average annual homeowner's insurance premium by state, referenced to a
 * $300,000 dwelling coverage amount (HO-3, standard policy).
 *
 * Source: compiled from publicly published 2026 annual homeowner's
 * insurance rate surveys (Insurify-style aggregated studies of average
 * premiums by state at $300k dwelling coverage). Actual premiums vary
 * heavily by coverage amount, deductible, construction, claims history,
 * and — especially in FL/LA/TX/coastal and wildfire-exposed states — by
 * carrier availability, which shifts year to year. California in
 * particular has seen major insurers pull back or exit the state
 * entirely, pushing many homeowners onto higher-cost, limited-coverage
 * FAIR Plan policies not reflected in a simple state average.
 *
 * These are LLM-compiled approximations, not a live feed (live rate
 * feeds are explicitly out of scope for this product). Verify against a
 * primary source before relying on them in production, and re-verify on
 * every "lastUpdated" review cycle. States flagged `highCost: true` see
 * volatile, fast-rising premiums (hurricane/wildfire exposure, insurer
 * withdrawals) and deserve the most scrutiny before reuse.
 */

export interface InsuranceEntry {
  state: string;
  stateCode: string;
  /** Average annual premium in USD for a $300,000 dwelling coverage reference policy */
  annualPremiumAt300k: number;
  /** The dwelling value this premium is referenced to */
  referenceHomeValue: number;
  highCost: boolean;
  source: string;
  lastUpdated: string;
}

const SOURCE = "Compiled from Insurify-style 2026 annual homeowner's insurance premium surveys ($300k dwelling reference)";
const LAST_UPDATED = "2026-09-17";

function entry(state: string, stateCode: string, annualPremiumAt300k: number, highCost = false): InsuranceEntry {
  return { state, stateCode, annualPremiumAt300k, referenceHomeValue: 300_000, highCost, source: SOURCE, lastUpdated: LAST_UPDATED };
}

export const INSURANCE_BY_STATE: Record<string, InsuranceEntry> = {
  AL: entry("Alabama", "AL", 3480, true),
  AK: entry("Alaska", "AK", 1332),
  AZ: entry("Arizona", "AZ", 2172),
  AR: entry("Arkansas", "AR", 3540, true),
  CA: entry("California", "CA", 2040, true),
  CO: entry("Colorado", "CO", 3276, true),
  CT: entry("Connecticut", "CT", 1980),
  DE: entry("Delaware", "DE", 1332),
  DC: entry("District of Columbia", "DC", 1188),
  FL: entry("Florida", "FL", 6432, true),
  GA: entry("Georgia", "GA", 2568),
  HI: entry("Hawaii", "HI", 1500),
  ID: entry("Idaho", "ID", 1728),
  IL: entry("Illinois", "IL", 2604),
  IN: entry("Indiana", "IN", 2244),
  IA: entry("Iowa", "IA", 2580),
  KS: entry("Kansas", "KS", 4080, true),
  KY: entry("Kentucky", "KY", 3288, true),
  LA: entry("Louisiana", "LA", 5004, true),
  ME: entry("Maine", "ME", 1248),
  MD: entry("Maryland", "MD", 1968),
  MA: entry("Massachusetts", "MA", 1956),
  MI: entry("Michigan", "MI", 2292),
  MN: entry("Minnesota", "MN", 2688),
  MS: entry("Mississippi", "MS", 3348, true),
  MO: entry("Missouri", "MO", 2940),
  MT: entry("Montana", "MT", 2520),
  NE: entry("Nebraska", "NE", 4116, true),
  NV: entry("Nevada", "NV", 1272),
  NH: entry("New Hampshire", "NH", 1188),
  NJ: entry("New Jersey", "NJ", 1272),
  NM: entry("New Mexico", "NM", 3264, true),
  NY: entry("New York", "NY", 1356),
  NC: entry("North Carolina", "NC", 3276, true),
  ND: entry("North Dakota", "ND", 2652),
  OH: entry("Ohio", "OH", 1752),
  OK: entry("Oklahoma", "OK", 5568, true),
  OR: entry("Oregon", "OR", 1344),
  PA: entry("Pennsylvania", "PA", 1296),
  RI: entry("Rhode Island", "RI", 2280),
  SC: entry("South Carolina", "SC", 2772),
  SD: entry("South Dakota", "SD", 2724),
  TN: entry("Tennessee", "TN", 3168),
  TX: entry("Texas", "TX", 4644, true),
  UT: entry("Utah", "UT", 1548),
  VT: entry("Vermont", "VT", 924),
  VA: entry("Virginia", "VA", 1740),
  WA: entry("Washington", "WA", 1428),
  WV: entry("West Virginia", "WV", 1560),
  WI: entry("Wisconsin", "WI", 1524),
  WY: entry("Wyoming", "WY", 1740),
};

export function getInsuranceRate(stateCode: string): InsuranceEntry {
  const entry = INSURANCE_BY_STATE[stateCode.toUpperCase()];
  if (!entry) {
    throw new Error(`No insurance data for state code "${stateCode}"`);
  }
  return entry;
}
