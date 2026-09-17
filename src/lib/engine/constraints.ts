import { PROPERTY_TAX_BY_STATE } from "../data/property-tax-by-state";
import { INSURANCE_BY_STATE } from "../data/homeowners-insurance-by-state";
import { getPropertyTaxRate } from "../data/property-tax-by-state";
import { getInsuranceRate } from "../data/homeowners-insurance-by-state";
import { computeMonthlyCosts } from "./housingCost";
import { solveMaxHomePrice } from "./maxPrice";
import { totalRealLifeExpenses, ZERO_EXPENSES } from "./types";
import type { AffordabilityTier, HouseholdInputs, LoanAssumptions } from "./types";

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export const NATIONAL_AVG_PROPERTY_TAX_RATE = average(Object.values(PROPERTY_TAX_BY_STATE).map((e) => e.effectiveRatePct));
export const NATIONAL_AVG_INSURANCE_PREMIUM_AT_300K = average(Object.values(INSURANCE_BY_STATE).map((e) => e.annualPremiumAt300k));

export type ConstraintId = "other-debts" | "state-property-tax" | "state-insurance" | "pmi" | "real-life-expenses";

export interface ConstraintExplanation {
  id: ConstraintId;
  /** Dollars per month this factor is costing the household, relative to a neutral baseline */
  monthlyImpact: number;
  /** Dollars this factor is subtracting from the household's max sustainable home price, when computable */
  priceImpact: number | null;
  description: string;
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

const MIN_MONTHLY_IMPACT_TO_SURFACE = 15;
const MIN_PRICE_IMPACT_TO_SURFACE = 500;

/**
 * Identifies the concrete, named factors currently constraining what this
 * household can afford — the "what's driving this" panel. Each constraint
 * is computed by comparing the household's actual scenario against a
 * neutral counterfactual (zero debts, national-average tax rate, etc.),
 * so every number traces back to a real before/after delta rather than a
 * vague weight.
 */
export function explainConstraints(
  household: HouseholdInputs,
  loan: LoanAssumptions,
  targetTier: Exclude<AffordabilityTier, "unaffordable">
): ConstraintExplanation[] {
  const baselineMaxPrice = solveMaxHomePrice(household, loan, targetTier).maxHomePrice;
  const breakdown = computeMonthlyCosts(baselineMaxPrice, loan);
  const constraints: ConstraintExplanation[] = [];

  // Other monthly debts (auto, student loans, credit cards) — reduces borrowing capacity via DTI.
  if (household.otherMonthlyDebts > 0) {
    const withoutDebts = solveMaxHomePrice({ ...household, otherMonthlyDebts: 0 }, loan, targetTier).maxHomePrice;
    const priceImpact = withoutDebts - baselineMaxPrice;
    if (priceImpact >= MIN_PRICE_IMPACT_TO_SURFACE) {
      constraints.push({
        id: "other-debts",
        monthlyImpact: household.otherMonthlyDebts,
        priceImpact,
        description: `Your ${formatUSD(household.otherMonthlyDebts)}/mo in other debt payments is reducing your maximum price by about ${formatUSD(priceImpact)}.`,
      });
    }
  }

  // State property tax vs. national average.
  const taxEntry = getPropertyTaxRate(loan.stateCode);
  const nationalAvgMonthlyTax = (baselineMaxPrice * NATIONAL_AVG_PROPERTY_TAX_RATE) / 12;
  const taxMonthlyImpact = breakdown.propertyTax - nationalAvgMonthlyTax;
  if (taxMonthlyImpact >= MIN_MONTHLY_IMPACT_TO_SURFACE) {
    constraints.push({
      id: "state-property-tax",
      monthlyImpact: taxMonthlyImpact,
      priceImpact: null,
      description: `${taxEntry.state} property tax at ${(taxEntry.effectiveRatePct * 100).toFixed(2)}% is costing you roughly ${formatUSD(taxMonthlyImpact)}/mo more than the national average would suggest.`,
    });
  }

  // State homeowner's insurance vs. national average.
  const insuranceEntry = getInsuranceRate(loan.stateCode);
  const nationalAvgMonthlyInsurance = (NATIONAL_AVG_INSURANCE_PREMIUM_AT_300K * (baselineMaxPrice / insuranceEntry.referenceHomeValue)) / 12;
  const insuranceMonthlyImpact = breakdown.insurance - nationalAvgMonthlyInsurance;
  if (insuranceMonthlyImpact >= MIN_MONTHLY_IMPACT_TO_SURFACE) {
    constraints.push({
      id: "state-insurance",
      monthlyImpact: insuranceMonthlyImpact,
      priceImpact: null,
      description: `Homeowner's insurance in ${insuranceEntry.state} is costing you roughly ${formatUSD(insuranceMonthlyImpact)}/mo more than the national average would suggest.`,
    });
  }

  // PMI.
  if (breakdown.pmi > 0) {
    const downPaymentNeededFor20Pct = Math.max(0, baselineMaxPrice * 0.2 - loan.downPaymentDollars);
    constraints.push({
      id: "pmi",
      monthlyImpact: breakdown.pmi,
      priceImpact: null,
      description: `Private mortgage insurance is costing you ${formatUSD(breakdown.pmi)}/mo because your down payment is under 20%. An additional ${formatUSD(downPaymentNeededFor20Pct)} down would eliminate it.`,
    });
  }

  // Real-life (non-DTI) expenses.
  const expensesTotal = totalRealLifeExpenses(household.expenses);
  if (expensesTotal > 0) {
    const withoutExpensesMaxPrice = solveMaxHomePrice({ ...household, expenses: ZERO_EXPENSES }, loan, targetTier).maxHomePrice;
    const priceImpact = withoutExpensesMaxPrice - baselineMaxPrice;
    constraints.push({
      id: "real-life-expenses",
      monthlyImpact: expensesTotal,
      priceImpact: priceImpact >= MIN_PRICE_IMPACT_TO_SURFACE ? priceImpact : null,
      description:
        priceImpact >= MIN_PRICE_IMPACT_TO_SURFACE
          ? `Your ${formatUSD(expensesTotal)}/mo in childcare, healthcare, groceries, and other real-life expenses is reducing your maximum price by about ${formatUSD(priceImpact)} — lenders won't count this, but it's real.`
          : `Your ${formatUSD(expensesTotal)}/mo in childcare, healthcare, groceries, and other real-life expenses doesn't affect what a lender will approve, but it directly reduces what's left over each month.`,
    });
  }

  return constraints.sort((a, b) => b.monthlyImpact - a.monthlyImpact).slice(0, 3);
}
