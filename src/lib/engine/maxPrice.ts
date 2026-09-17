import { classifyAffordability } from "./tiers";
import type { AffordabilityResult, AffordabilityTier, HouseholdInputs, LoanAssumptions } from "./types";

export const MAX_BINARY_SEARCH_ITERATIONS = 100;
export const CONVERGENCE_DOLLARS = 1;
/** Hard ceiling so a pathological/huge-income input can't loop the bracket search forever */
const PRICE_CEILING = 100_000_000;

const TIER_RANK: Record<AffordabilityTier, number> = {
  comfortable: 0,
  stretch: 1,
  risky: 2,
  unaffordable: 3,
};

function meetsOrBeatsTier(result: AffordabilityResult, targetTier: Exclude<AffordabilityTier, "unaffordable">): boolean {
  return TIER_RANK[result.tier] <= TIER_RANK[targetTier];
}

interface BracketedSearchResult {
  maxHomePrice: number;
  iterations: number;
  converged: boolean;
}

/**
 * Generic binary search for the largest home price at which a monotonic
 * `satisfies` predicate holds. Shared by every "max price" solver in this
 * module — tier-based, pure-DTI, and pure-leftover-income variants all
 * reduce to "find the boundary of a monotonic true/false predicate over
 * price." Converges to within $1, capped at 100 iterations.
 */
function binarySearchMaxPrice(loan: LoanAssumptions, satisfies: (price: number) => boolean): BracketedSearchResult {
  if (!satisfies(0)) {
    return { maxHomePrice: 0, iterations: 0, converged: true };
  }

  // Bracket a `hi` where the predicate no longer holds, doubling from a sane starting point.
  let lo = 0;
  let hi = Math.max(loan.downPaymentDollars * 2, 100_000);
  while (satisfies(hi)) {
    if (hi >= PRICE_CEILING) {
      hi = PRICE_CEILING;
      break;
    }
    hi = Math.min(hi * 2, PRICE_CEILING);
  }

  let iterations = 0;
  let converged = false;
  while (iterations < MAX_BINARY_SEARCH_ITERATIONS) {
    if (hi - lo <= CONVERGENCE_DOLLARS) {
      converged = true;
      break;
    }
    const mid = (lo + hi) / 2;
    if (satisfies(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
    iterations++;
  }

  return { maxHomePrice: Math.floor(lo), iterations, converged };
}

export interface MaxPriceResult {
  targetTier: Exclude<AffordabilityTier, "unaffordable">;
  maxHomePrice: number;
  affordability: AffordabilityResult;
  iterations: number;
  converged: boolean;
  /**
   * True when the solved max price is at or below the cash down payment —
   * i.e. the household's DTI/leftover-income capacity is so constrained
   * (usually by other debts or expenses) that they can't sustainably
   * finance anything, even though they have cash on hand. A real,
   * explainable edge case, not a bug.
   */
  downPaymentExceedsMaxPrice: boolean;
}

/**
 * Binary-search the maximum home price at which the household still
 * meets (or beats) `targetTier`. Monthly cost is non-decreasing in home
 * price (tax, insurance, maintenance, and — for a fixed-dollar down
 * payment — the loan amount all scale up with price), so the "meets
 * target tier" predicate is monotonic and a binary search converges
 * cleanly.
 */
export function solveMaxHomePrice(household: HouseholdInputs, loan: LoanAssumptions, targetTier: Exclude<AffordabilityTier, "unaffordable">): MaxPriceResult {
  const { maxHomePrice, iterations, converged } = binarySearchMaxPrice(loan, (price) => meetsOrBeatsTier(classifyAffordability(household, loan, price), targetTier));
  const affordability = classifyAffordability(household, loan, maxHomePrice);

  return {
    targetTier,
    maxHomePrice,
    affordability,
    iterations,
    converged,
    downPaymentExceedsMaxPrice: loan.downPaymentDollars > 0 && maxHomePrice <= loan.downPaymentDollars,
  };
}

export interface SustainablePriceResult {
  maxHomePrice: number;
  affordability: AffordabilityResult;
  iterations: number;
  converged: boolean;
}

/**
 * The maximum home price at which the household's leftover income (after
 * the full sustainable housing cost, other debts, and real-life
 * expenses) stays at or above zero — ignoring lender DTI ratio ceilings
 * entirely. Pairs with the risky-tier max price (which is the pure-DTI,
 * leftover-agnostic ceiling) to show the "lender would approve X, but you
 * can only sustain Y" gap the spec calls out (3.6).
 */
export function solveSustainableMaxPrice(household: HouseholdInputs, loan: LoanAssumptions): SustainablePriceResult {
  const { maxHomePrice, iterations, converged } = binarySearchMaxPrice(loan, (price) => classifyAffordability(household, loan, price).leftoverIncome >= 0);
  return { maxHomePrice, affordability: classifyAffordability(household, loan, maxHomePrice), iterations, converged };
}

/**
 * The maximum home price a lender would likely approve — pure DTI-ratio
 * ceiling (housing <= 36%, total debt <= 50%), generous, ignoring
 * leftover income. This is exactly the "risky" tier boundary, since the
 * risky tier is itself defined without a leftover-income condition.
 */
export function solveLenderApprovalMaxPrice(household: HouseholdInputs, loan: LoanAssumptions): MaxPriceResult {
  return solveMaxHomePrice(household, loan, "risky");
}
