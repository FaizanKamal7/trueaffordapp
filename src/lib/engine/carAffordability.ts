import { getAutoSalesTaxRate } from "../data/auto-sales-tax-by-state";
import { getDefaultAutoLoanRate } from "../data/auto-loan-rates-by-credit-band";
import { monthlyPrincipalAndInterest } from "./mortgage";
import { totalRealLifeExpenses } from "./types";
import type { AffordabilityTier, CreditBand, HouseholdInputs } from "./types";

export type CarLoanTerm = 36 | 48 | 60 | 72;

export interface CarLoanAssumptions {
  stateCode: string;
  /** Cash down payment, in dollars */
  downPaymentDollars: number;
  /** Value of a trade-in vehicle applied toward the purchase, in dollars */
  tradeInValueDollars: number;
  /** Annual interest rate as a decimal (0.0675 = 6.75%). If omitted, engine uses the credit-band default. */
  interestRate?: number;
  creditBand: CreditBand;
  termMonths: CarLoanTerm;
  /** Monthly auto insurance premium — a direct user input, not looked up from a table (varies too much by driver) */
  insuranceMonthly: number;
}

export interface CarMonthlyCostBreakdown {
  carPrice: number;
  /** Sales tax owed on (price - trade-in value), clamped at 0 */
  salesTax: number;
  /** price - downPayment - tradeInValue + salesTax, clamped at 0 */
  amountFinanced: number;
  principalAndInterest: number;
  insurance: number;
  /** P&I + insurance — the real monthly cost of the car (excludes fuel/maintenance/registration, which this calculator doesn't model) */
  totalMonthlyCost: number;
}

/**
 * Computes the full monthly cost breakdown for a given car price and loan
 * assumptions. Single source of truth every other function here builds on,
 * mirroring housingCost.ts's role for the home calculators.
 */
export function computeCarMonthlyCosts(carPrice: number, loan: CarLoanAssumptions): CarMonthlyCostBreakdown {
  const clampedPrice = Math.max(0, carPrice);
  const taxableAmount = Math.max(0, clampedPrice - loan.tradeInValueDollars);
  const taxEntry = getAutoSalesTaxRate(loan.stateCode);
  const salesTax = taxableAmount * taxEntry.ratePct;

  const amountFinanced = Math.max(0, clampedPrice - loan.downPaymentDollars - loan.tradeInValueDollars + salesTax);
  const annualRate = loan.interestRate ?? getDefaultAutoLoanRate(loan.creditBand);
  const principalAndInterest = monthlyPrincipalAndInterest(amountFinanced, annualRate, loan.termMonths / 12);

  const insurance = loan.insuranceMonthly;
  const totalMonthlyCost = principalAndInterest + insurance;

  return {
    carPrice: clampedPrice,
    salesTax,
    amountFinanced,
    principalAndInterest,
    insurance,
    totalMonthlyCost,
  };
}

/**
 * Tier boundaries as a percentage of GROSS monthly income spent on the
 * car's total monthly cost (P&I + insurance). Anchored to the widely-cited
 * "20/4/10 rule" of thumb for car buying (20% down, 4-year/48-month term
 * or shorter, total vehicle cost at or under 10% of gross monthly income)
 * — 10% is the rule's own "comfortable" line, and Stretch/Risky widen that
 * ceiling the same way the home tiers widen past the lender-ideal 28%
 * housing ratio. These are commonly-recommended personal-finance
 * thresholds, not a regulatory or lending standard — see the
 * `AffordabilityTier` docs in types.ts for the same disclosure on the home
 * side.
 */
export const CAR_TIER_THRESHOLDS = {
  comfortable: { maxPctGrossIncome: 0.1 },
  stretch: { maxPctGrossIncome: 0.15 },
  risky: { maxPctGrossIncome: 0.2 },
} as const;

/** Exported for direct boundary testing — the pure ratio decision table behind classifyCarAffordability. */
export function classifyCarTierFromRatio(pctOfGrossMonthlyIncome: number): AffordabilityTier {
  if (pctOfGrossMonthlyIncome <= CAR_TIER_THRESHOLDS.comfortable.maxPctGrossIncome) return "comfortable";
  if (pctOfGrossMonthlyIncome <= CAR_TIER_THRESHOLDS.stretch.maxPctGrossIncome) return "stretch";
  if (pctOfGrossMonthlyIncome <= CAR_TIER_THRESHOLDS.risky.maxPctGrossIncome) return "risky";
  return "unaffordable";
}

export interface CarAffordabilityResult {
  breakdown: CarMonthlyCostBreakdown;
  /** Total monthly car cost as a fraction of gross monthly income — what the tier is based on */
  pctOfGrossMonthlyIncome: number;
  tier: AffordabilityTier;
  /** Net income remaining after the car payment, other debts, and real-life expenses — the site's core sustainability test */
  leftoverIncome: number;
  /** Household can sustain this car payment long-term (passes the leftover-income test), independent of which tier it falls in */
  householdCanSustain: boolean;
}

/**
 * Full affordability assessment for a specific car price against a
 * household's income, debts, and real-life expenses. The tier is a pure
 * income-ratio classification (the 20/4/10-style rule); leftoverIncome is
 * a separate, independent check — a household can be "Comfortable" by the
 * ratio and still fail the leftover-income test once real expenses are
 * counted, which is exactly the gap this site is built to surface.
 */
export function classifyCarAffordability(household: HouseholdInputs, loan: CarLoanAssumptions, carPrice: number): CarAffordabilityResult {
  const breakdown = computeCarMonthlyCosts(carPrice, loan);

  const pctOfGrossMonthlyIncome = household.grossMonthlyIncome > 0 ? breakdown.totalMonthlyCost / household.grossMonthlyIncome : Infinity;
  const tier = classifyCarTierFromRatio(pctOfGrossMonthlyIncome);

  const leftoverIncome = household.netMonthlyIncome - breakdown.totalMonthlyCost - household.otherMonthlyDebts - totalRealLifeExpenses(household.expenses);
  const householdCanSustain = leftoverIncome >= 0;

  return { breakdown, pctOfGrossMonthlyIncome, tier, leftoverIncome, householdCanSustain };
}

export const MAX_CAR_BINARY_SEARCH_ITERATIONS = 100;
export const CAR_CONVERGENCE_DOLLARS = 1;
/** Hard ceiling so a pathological/huge-income input can't loop the bracket search forever */
const CAR_PRICE_CEILING = 10_000_000;

const TIER_RANK: Record<AffordabilityTier, number> = {
  comfortable: 0,
  stretch: 1,
  risky: 2,
  unaffordable: 3,
};

function meetsOrBeatsCarTier(result: CarAffordabilityResult, targetTier: Exclude<AffordabilityTier, "unaffordable">): boolean {
  return TIER_RANK[result.tier] <= TIER_RANK[targetTier];
}

interface BracketedCarSearchResult {
  maxCarPrice: number;
  iterations: number;
  converged: boolean;
}

/**
 * Generic binary search for the largest car price at which a monotonic
 * `satisfies` predicate holds. Mirrors maxPrice.ts's binarySearchMaxPrice:
 * total monthly cost is non-decreasing in price (sales tax and the
 * financed amount both scale up with price for a fixed down payment/
 * trade-in), so "meets target tier" and "leftover income >= 0" are both
 * monotonic and a binary search converges cleanly.
 */
function binarySearchMaxCarPrice(loan: CarLoanAssumptions, satisfies: (price: number) => boolean): BracketedCarSearchResult {
  if (!satisfies(0)) {
    return { maxCarPrice: 0, iterations: 0, converged: true };
  }

  let lo = 0;
  let hi = Math.max((loan.downPaymentDollars + loan.tradeInValueDollars) * 2, 20_000);
  while (satisfies(hi)) {
    if (hi >= CAR_PRICE_CEILING) {
      hi = CAR_PRICE_CEILING;
      break;
    }
    hi = Math.min(hi * 2, CAR_PRICE_CEILING);
  }

  let iterations = 0;
  let converged = false;
  while (iterations < MAX_CAR_BINARY_SEARCH_ITERATIONS) {
    if (hi - lo <= CAR_CONVERGENCE_DOLLARS) {
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

  return { maxCarPrice: Math.floor(lo), iterations, converged };
}

export interface CarMaxPriceResult {
  targetTier: Exclude<AffordabilityTier, "unaffordable">;
  maxCarPrice: number;
  affordability: CarAffordabilityResult;
  iterations: number;
  converged: boolean;
}

/** Binary-search the maximum car price at which the household still meets (or beats) `targetTier`. */
export function solveMaxCarPrice(household: HouseholdInputs, loan: CarLoanAssumptions, targetTier: Exclude<AffordabilityTier, "unaffordable">): CarMaxPriceResult {
  const { maxCarPrice, iterations, converged } = binarySearchMaxCarPrice(loan, (price) => meetsOrBeatsCarTier(classifyCarAffordability(household, loan, price), targetTier));
  const affordability = classifyCarAffordability(household, loan, maxCarPrice);

  return { targetTier, maxCarPrice, affordability, iterations, converged };
}

export interface CarSustainablePriceResult {
  maxCarPrice: number;
  affordability: CarAffordabilityResult;
  iterations: number;
  converged: boolean;
}

/**
 * The maximum car price at which the household's leftover income (after
 * the full car cost, other debts, and real-life expenses) stays at or
 * above zero — ignoring the 20/4/10-style income-ratio ceiling entirely.
 * Pairs with the risky-tier max price (the pure-ratio, leftover-agnostic
 * ceiling) to show the same "rule of thumb says X, but you can only
 * sustain Y" gap the rest of the site is built around.
 */
export function solveSustainableMaxCarPrice(household: HouseholdInputs, loan: CarLoanAssumptions): CarSustainablePriceResult {
  const { maxCarPrice, iterations, converged } = binarySearchMaxCarPrice(loan, (price) => classifyCarAffordability(household, loan, price).leftoverIncome >= 0);
  return { maxCarPrice, affordability: classifyCarAffordability(household, loan, maxCarPrice), iterations, converged };
}
