/**
 * Effective property tax rate by state, expressed as an annual percentage
 * of home value (e.g. 0.0068 = 0.68% of home value per year).
 *
 * Source: Tax Foundation's 2026 state-by-state effective property tax
 * rate release (2024 ACS-derived housing and tax data — the latest
 * comparable state-level benchmark, not an actual 2026 tax-year
 * measurement). District of Columbia is not covered by that release and
 * is carried forward from the prior compiled estimate. Figures are
 * statewide averages — county and municipal rates vary significantly
 * within every state, sometimes by 2x or more.
 *
 * Not a live feed (live rate feeds are explicitly out of scope for this
 * product). Verify against a primary source (e.g. Tax Foundation's
 * latest annual release) before relying on them in production, and
 * re-verify on every "lastUpdated" review cycle.
 */

export interface PropertyTaxEntry {
  state: string;
  stateCode: string;
  /** Annual effective property tax rate, as a fraction of home value (0.0068 = 0.68%) */
  effectiveRatePct: number;
  source: string;
  lastUpdated: string;
}

const SOURCE = "Tax Foundation 2026 effective property tax rate release (2024 ACS-derived statewide averages)";
const LAST_UPDATED = "2026-09-17";

function entry(state: string, stateCode: string, effectiveRatePct: number): PropertyTaxEntry {
  return { state, stateCode, effectiveRatePct, source: SOURCE, lastUpdated: LAST_UPDATED };
}

export const PROPERTY_TAX_BY_STATE: Record<string, PropertyTaxEntry> = {
  AL: entry("Alabama", "AL", 0.0037),
  AK: entry("Alaska", "AK", 0.0094),
  AZ: entry("Arizona", "AZ", 0.0048),
  AR: entry("Arkansas", "AR", 0.0056),
  CA: entry("California", "CA", 0.007),
  CO: entry("Colorado", "CO", 0.005),
  CT: entry("Connecticut", "CT", 0.0154),
  DE: entry("Delaware", "DE", 0.0054),
  DC: entry("District of Columbia", "DC", 0.0056),
  FL: entry("Florida", "FL", 0.0078),
  GA: entry("Georgia", "GA", 0.0079),
  HI: entry("Hawaii", "HI", 0.0029),
  ID: entry("Idaho", "ID", 0.005),
  IL: entry("Illinois", "IL", 0.0188),
  IN: entry("Indiana", "IN", 0.0076),
  IA: entry("Iowa", "IA", 0.0133),
  KS: entry("Kansas", "KS", 0.0121),
  KY: entry("Kentucky", "KY", 0.0074),
  LA: entry("Louisiana", "LA", 0.0055),
  ME: entry("Maine", "ME", 0.0098),
  MD: entry("Maryland", "MD", 0.0092),
  MA: entry("Massachusetts", "MA", 0.01),
  MI: entry("Michigan", "MI", 0.0119),
  MN: entry("Minnesota", "MN", 0.01),
  MS: entry("Mississippi", "MS", 0.0058),
  MO: entry("Missouri", "MO", 0.0089),
  MT: entry("Montana", "MT", 0.0061),
  NE: entry("Nebraska", "NE", 0.0144),
  NV: entry("Nevada", "NV", 0.005),
  NH: entry("New Hampshire", "NH", 0.015),
  NJ: entry("New Jersey", "NJ", 0.0188),
  NM: entry("New Mexico", "NM", 0.0063),
  NY: entry("New York", "NY", 0.013),
  NC: entry("North Carolina", "NC", 0.0066),
  ND: entry("North Dakota", "ND", 0.0092),
  OH: entry("Ohio", "OH", 0.0136),
  OK: entry("Oklahoma", "OK", 0.0079),
  OR: entry("Oregon", "OR", 0.0081),
  PA: entry("Pennsylvania", "PA", 0.0126),
  RI: entry("Rhode Island", "RI", 0.0112),
  SC: entry("South Carolina", "SC", 0.0049),
  SD: entry("South Dakota", "SD", 0.01),
  TN: entry("Tennessee", "TN", 0.0052),
  TX: entry("Texas", "TX", 0.014),
  UT: entry("Utah", "UT", 0.0048),
  VT: entry("Vermont", "VT", 0.0151),
  VA: entry("Virginia", "VA", 0.0078),
  WA: entry("Washington", "WA", 0.0075),
  WV: entry("West Virginia", "WV", 0.0051),
  WI: entry("Wisconsin", "WI", 0.0132),
  WY: entry("Wyoming", "WY", 0.0053),
};

export function getPropertyTaxRate(stateCode: string): PropertyTaxEntry {
  const entry = PROPERTY_TAX_BY_STATE[stateCode.toUpperCase()];
  if (!entry) {
    throw new Error(`No property tax data for state code "${stateCode}"`);
  }
  return entry;
}
