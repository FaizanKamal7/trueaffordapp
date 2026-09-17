import { classifyAffordability } from "./tiers";
import type { HouseholdInputs, LoanAssumptions } from "./types";

export interface UnaffordableExplanation {
  reasons: string[];
}

/**
 * When a scenario doesn't clear even the Risky tier, the product spec
 * requires returning no number and instead explaining what would have to
 * change — never a broken or misleadingly precise figure. This inspects
 * which specific condition(s) are failing at the given home price and
 * names them in plain language.
 */
export function explainUnaffordable(household: HouseholdInputs, loan: LoanAssumptions, homePrice: number): UnaffordableExplanation {
  const result = classifyAffordability(household, loan, homePrice);
  const reasons: string[] = [];

  if (household.grossMonthlyIncome <= 0) {
    reasons.push("No gross monthly income was entered, so a lender debt-to-income ratio can't be calculated.");
    return { reasons };
  }

  if (result.housingToIncomeRatio > 0.36) {
    reasons.push(
      `The housing payment alone would take up ${(result.housingToIncomeRatio * 100).toFixed(0)}% of gross income — above the 36% ceiling lenders generally allow. A lower price, a larger down payment, or a lower rate would bring this down.`
    );
  }

  if (result.totalDebtToIncomeRatio > 0.5) {
    reasons.push(
      `Combined with other debts, total monthly obligations would reach ${(result.totalDebtToIncomeRatio * 100).toFixed(0)}% of gross income — above the 50% ceiling lenders generally allow. Paying down other debts would free up room here.`
    );
  }

  if (result.leftoverIncome < 0 && result.housingToIncomeRatio <= 0.36 && result.totalDebtToIncomeRatio <= 0.5) {
    reasons.push(
      `Even though the debt-to-income ratios pass, the household would run ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(result.leftoverIncome))}/mo negative after real-life expenses. That gap would need to close through higher income, lower expenses, or a smaller loan.`
    );
  }

  if (reasons.length === 0) {
    reasons.push("This scenario doesn't clear the affordability thresholds at this price. Try a lower price or a larger down payment.");
  }

  return { reasons };
}
