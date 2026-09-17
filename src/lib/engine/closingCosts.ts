export const CLOSING_COST_LOW_PCT = 0.02;
export const CLOSING_COST_HIGH_PCT = 0.05;
export const CLOSING_COST_TYPICAL_PCT = 0.03;

export interface ClosingCostsEstimate {
  low: number;
  typical: number;
  high: number;
  /** Down payment + typical closing costs — the actual cash a buyer needs at the table */
  totalCashNeededTypical: number;
  totalCashNeededLow: number;
  totalCashNeededHigh: number;
}

/**
 * Closing costs are frequently the thing that derails first-time buyers
 * who budgeted only for the down payment (spec 3.9). Modeled as a
 * 2-5% range of home price, called out as additional cash needed on top
 * of the down payment rather than folded invisibly into the loan.
 */
export function estimateClosingCosts(homePrice: number, downPaymentDollars: number): ClosingCostsEstimate {
  const low = homePrice * CLOSING_COST_LOW_PCT;
  const typical = homePrice * CLOSING_COST_TYPICAL_PCT;
  const high = homePrice * CLOSING_COST_HIGH_PCT;

  return {
    low,
    typical,
    high,
    totalCashNeededLow: downPaymentDollars + low,
    totalCashNeededTypical: downPaymentDollars + typical,
    totalCashNeededHigh: downPaymentDollars + high,
  };
}
