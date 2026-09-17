/**
 * Standard fixed-rate amortization math. Pure functions, no data-file or UI dependencies.
 */

/**
 * Monthly principal & interest payment for a fully-amortizing fixed-rate loan.
 * Handles the zero-interest edge case (straight-line payoff) explicitly —
 * the standard amortization formula divides by zero when annualRate is 0.
 */
export function monthlyPrincipalAndInterest(loanAmount: number, annualRate: number, termYears: number): number {
  if (loanAmount <= 0) return 0;

  const n = termYears * 12;
  if (annualRate === 0) {
    return loanAmount / n;
  }

  const r = annualRate / 12;
  const factor = Math.pow(1 + r, n);
  return (loanAmount * r * factor) / (factor - 1);
}

/**
 * Remaining loan balance after `monthsElapsed` payments of a fixed-rate,
 * fully-amortizing loan. Used to find the 78%-LTV PMI drop-off point.
 */
export function remainingBalance(loanAmount: number, annualRate: number, termYears: number, monthsElapsed: number): number {
  if (loanAmount <= 0) return 0;
  const n = termYears * 12;
  if (monthsElapsed <= 0) return loanAmount;
  if (monthsElapsed >= n) return 0;

  if (annualRate === 0) {
    const payment = loanAmount / n;
    return Math.max(0, loanAmount - payment * monthsElapsed);
  }

  const r = annualRate / 12;
  const payment = monthlyPrincipalAndInterest(loanAmount, annualRate, termYears);
  const factor = Math.pow(1 + r, monthsElapsed);
  const balance = loanAmount * factor - payment * ((factor - 1) / r);
  return Math.max(0, balance);
}

/**
 * The month number (1-indexed) at which the loan balance first amortizes
 * down to 78% of the ORIGINAL home value — the federally mandated automatic
 * PMI cancellation point (regardless of appreciation). Returns null if the
 * loan never reaches that point within its term (e.g. interest-only-like
 * edge cases) or if PMI wasn't required to begin with.
 */
export function monthsToPmiDropoff(loanAmount: number, originalHomeValue: number, annualRate: number, termYears: number): number | null {
  const targetBalance = originalHomeValue * 0.78;
  if (loanAmount <= targetBalance) return null;

  const n = termYears * 12;
  for (let month = 1; month <= n; month++) {
    if (remainingBalance(loanAmount, annualRate, termYears, month) <= targetBalance) {
      return month;
    }
  }
  return null;
}

export function loanToValuePct(loanAmount: number, homePrice: number): number {
  if (homePrice <= 0) return 0;
  return (loanAmount / homePrice) * 100;
}
