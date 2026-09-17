/**
 * Private mortgage insurance (PMI) annual rate, as a percentage of the
 * loan amount, by credit score band and loan-to-value (LTV) band.
 *
 * Source: illustrative rates compiled from the general shape of publicly
 * published mortgage insurer rate cards (e.g. MGIC, Radian, Essent rate
 * finder tools), which price PMI on these same two axes. These are
 * LLM-compiled approximations for a "typical" borrower profile (30-year
 * fixed, standard coverage) — actual quoted rates vary by insurer,
 * coverage percentage, loan purpose, and state, and change frequently.
 * Verify against a primary rate card before relying on them in
 * production, and re-verify on every "lastUpdated" review cycle.
 *
 * PMI applies only when the down payment is under 20% (LTV > 80%).
 */

export interface PmiRateBand {
  minLtv: number;
  maxLtv: number;
  /** Annual PMI rate as a fraction of loan amount (0.0058 = 0.58%/yr) */
  annualRatePct: number;
}

export type CreditBand = "760+" | "740-759" | "720-739" | "700-719" | "680-699" | "660-679" | "640-659" | "620-639";

export const CREDIT_BANDS: CreditBand[] = ["760+", "740-759", "720-739", "700-719", "680-699", "660-679", "640-659", "620-639"];

const SOURCE = "Illustrative rates compiled from the shape of published mortgage insurer (MGIC/Radian/Essent-style) rate cards";
const LAST_UPDATED = "2026-09-17";

/**
 * [creditBand][ltvBandIndex] -> annual PMI rate.
 * LTV bands: 80.01-85, 85.01-90, 90.01-95, 95.01-97
 */
const PMI_RATE_TABLE: Record<CreditBand, number[]> = {
  "760+": [0.0019, 0.0027, 0.0034, 0.0058],
  "740-759": [0.0024, 0.0033, 0.0044, 0.0072],
  "720-739": [0.0029, 0.0041, 0.0055, 0.0086],
  "700-719": [0.0034, 0.0049, 0.0066, 0.01],
  "680-699": [0.004, 0.0058, 0.0079, 0.0116],
  "660-679": [0.0052, 0.0074, 0.0099, 0.0141],
  "640-659": [0.0066, 0.0093, 0.0123, 0.0169],
  "620-639": [0.0081, 0.0112, 0.0148, 0.0197],
};

const LTV_BANDS: PmiRateBand[] = [
  { minLtv: 80.01, maxLtv: 85, annualRatePct: NaN },
  { minLtv: 85.01, maxLtv: 90, annualRatePct: NaN },
  { minLtv: 90.01, maxLtv: 95, annualRatePct: NaN },
  { minLtv: 95.01, maxLtv: 97, annualRatePct: NaN },
];

export const PMI_DATA_SOURCE = { source: SOURCE, lastUpdated: LAST_UPDATED };

/**
 * Looks up the annual PMI rate for a given LTV percentage (e.g. 92.5 for 92.5%)
 * and credit band. Returns 0 if LTV is at or below 80 (no PMI required).
 * LTV above 97 is clamped to the 95.01-97 band (max published coverage tier).
 */
export function getPmiAnnualRate(ltvPct: number, creditBand: CreditBand): number {
  if (ltvPct <= 80) return 0;

  const rates = PMI_RATE_TABLE[creditBand];
  const bandIndex = LTV_BANDS.findIndex((b) => ltvPct >= b.minLtv && ltvPct <= b.maxLtv);

  if (bandIndex === -1) {
    // Above the highest published band (>97 LTV, i.e. <3% down) — clamp to the top tier.
    if (ltvPct > 97) return rates[rates.length - 1];
    // Between 80 and 80.01 due to floating point — treat as the lowest band.
    return rates[0];
  }

  return rates[bandIndex];
}
