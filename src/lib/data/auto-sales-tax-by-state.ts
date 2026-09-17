/**
 * Average combined (state + typical local) sales/use tax rate applied to a
 * vehicle purchase, by state, expressed as a fraction of the taxable
 * purchase price (e.g. 0.0625 = 6.25%).
 *
 * Source: compiled from published state sales tax tables and state DMV/
 * revenue-department vehicle tax guidance (e.g. Tax Foundation combined
 * state-and-local sales tax rate reports, cross-checked against state DMV
 * "how vehicle sales tax is calculated" pages). These are LLM-compiled
 * approximations of a "typical" statewide rate, not a live feed — actual
 * tax owed depends on the buyer's county/city, and a handful of states
 * (e.g. Hawaii's excise tax, Illinois' local surtaxes) have meaningfully
 * different real-world mechanics than a flat percentage. Verify against a
 * primary source before relying on this in production, and re-verify on
 * every "lastUpdated" review cycle.
 *
 * Simplification: several states (e.g. many, but not all) reduce the
 * taxable amount by the value of a trade-in — this calculator applies that
 * "typical" trade-in-credit methodology uniformly (tax is computed on
 * price minus trade-in value) rather than modeling the handful of states
 * that tax the full purchase price regardless of trade-in. This keeps the
 * math simple and directionally correct at the cost of state-by-state
 * precision on that one mechanic.
 *
 * States with no state sales tax on vehicle purchases: Alaska, Delaware,
 * Montana, New Hampshire, Oregon (0%). Some of these still allow local
 * option taxes in specific jurisdictions (e.g. Alaska boroughs) — this
 * table intentionally reflects the statewide baseline of 0%, not every
 * local exception.
 */

export interface AutoSalesTaxEntry {
  state: string;
  stateCode: string;
  /** Average combined state+local sales tax rate applied to vehicle purchases, as a fraction (0.0625 = 6.25%) */
  ratePct: number;
  source: string;
  lastUpdated: string;
}

const SOURCE = "Compiled from Tax Foundation combined state/local sales tax rate reports and state DMV vehicle sales tax guidance (statewide averages)";
const LAST_UPDATED = "2025-01-01";

function entry(state: string, stateCode: string, ratePct: number): AutoSalesTaxEntry {
  return { state, stateCode, ratePct, source: SOURCE, lastUpdated: LAST_UPDATED };
}

export const AUTO_SALES_TAX_BY_STATE: Record<string, AutoSalesTaxEntry> = {
  AL: entry("Alabama", "AL", 0.0391),
  AK: entry("Alaska", "AK", 0),
  AZ: entry("Arizona", "AZ", 0.0837),
  AR: entry("Arkansas", "AR", 0.0946),
  CA: entry("California", "CA", 0.0868),
  CO: entry("Colorado", "CO", 0.0777),
  CT: entry("Connecticut", "CT", 0.0635),
  DE: entry("Delaware", "DE", 0),
  DC: entry("District of Columbia", "DC", 0.06),
  FL: entry("Florida", "FL", 0.07),
  GA: entry("Georgia", "GA", 0.07),
  HI: entry("Hawaii", "HI", 0.0444),
  ID: entry("Idaho", "ID", 0.06),
  IL: entry("Illinois", "IL", 0.0888),
  IN: entry("Indiana", "IN", 0.07),
  IA: entry("Iowa", "IA", 0.06),
  KS: entry("Kansas", "KS", 0.0869),
  KY: entry("Kentucky", "KY", 0.06),
  LA: entry("Louisiana", "LA", 0.0945),
  ME: entry("Maine", "ME", 0.055),
  MD: entry("Maryland", "MD", 0.06),
  MA: entry("Massachusetts", "MA", 0.0625),
  MI: entry("Michigan", "MI", 0.06),
  MN: entry("Minnesota", "MN", 0.0775),
  MS: entry("Mississippi", "MS", 0.07),
  MO: entry("Missouri", "MO", 0.0836),
  MT: entry("Montana", "MT", 0),
  NE: entry("Nebraska", "NE", 0.0694),
  NV: entry("Nevada", "NV", 0.0823),
  NH: entry("New Hampshire", "NH", 0),
  NJ: entry("New Jersey", "NJ", 0.0663),
  NM: entry("New Mexico", "NM", 0.0413),
  NY: entry("New York", "NY", 0.0852),
  NC: entry("North Carolina", "NC", 0.03),
  ND: entry("North Dakota", "ND", 0.05),
  OH: entry("Ohio", "OH", 0.0723),
  OK: entry("Oklahoma", "OK", 0.045),
  OR: entry("Oregon", "OR", 0),
  PA: entry("Pennsylvania", "PA", 0.0634),
  RI: entry("Rhode Island", "RI", 0.07),
  SC: entry("South Carolina", "SC", 0.05),
  SD: entry("South Dakota", "SD", 0.04),
  TN: entry("Tennessee", "TN", 0.0955),
  TX: entry("Texas", "TX", 0.0625),
  UT: entry("Utah", "UT", 0.0719),
  VT: entry("Vermont", "VT", 0.06),
  VA: entry("Virginia", "VA", 0.0415),
  WA: entry("Washington", "WA", 0.0925),
  WV: entry("West Virginia", "WV", 0.06),
  WI: entry("Wisconsin", "WI", 0.0543),
  WY: entry("Wyoming", "WY", 0.054),
};

export function getAutoSalesTaxRate(stateCode: string): AutoSalesTaxEntry {
  const entry = AUTO_SALES_TAX_BY_STATE[stateCode.toUpperCase()];
  if (!entry) {
    throw new Error(`No auto sales tax data for state code "${stateCode}"`);
  }
  return entry;
}
