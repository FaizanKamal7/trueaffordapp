import { classifyAffordability } from "./tiers";
import type { HouseholdInputs, LoanAssumptions } from "./types";

/** Structured form of each reason (same order as `reasons`), so the UI can phrase it in other locales. */
export type UnaffordableReasonDetail =
  | { id: "no-income" }
  | { id: "housing-ratio"; pct: string }
  | { id: "total-dti"; pct: string }
  | { id: "leftover-deficit"; amount: number }
  | { id: "generic" };

export interface UnaffordableExplanation {
  reasons: string[];
  details: UnaffordableReasonDetail[];
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
  const details: UnaffordableReasonDetail[] = [];

  if (household.grossMonthlyIncome <= 0) {
    reasons.push("No gross monthly income was entered, so a lender debt-to-income ratio can't be calculated.");
    details.push({ id: "no-income" });
    return { reasons, details };
  }

  if (result.housingToIncomeRatio > 0.36) {
    const pct = (result.housingToIncomeRatio * 100).toFixed(0);
    reasons.push(
      `The housing payment alone would take up ${pct}% of gross income — above the 36% ceiling lenders generally allow. A lower price, a larger down payment, or a lower rate would bring this down.`
    );
    details.push({ id: "housing-ratio", pct });
  }

  if (result.totalDebtToIncomeRatio > 0.5) {
    const pct = (result.totalDebtToIncomeRatio * 100).toFixed(0);
    reasons.push(
      `Combined with other debts, total monthly obligations would reach ${pct}% of gross income — above the 50% ceiling lenders generally allow. Paying down other debts would free up room here.`
    );
    details.push({ id: "total-dti", pct });
  }

  if (result.leftoverIncome < 0 && result.housingToIncomeRatio <= 0.36 && result.totalDebtToIncomeRatio <= 0.5) {
    const amount = Math.abs(result.leftoverIncome);
    reasons.push(
      `Even though the debt-to-income ratios pass, the household would run ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)}/mo negative after real-life expenses. That gap would need to close through higher income, lower expenses, or a smaller loan.`
    );
    details.push({ id: "leftover-deficit", amount });
  }

  if (reasons.length === 0) {
    reasons.push("This scenario doesn't clear the affordability thresholds at this price. Try a lower price or a larger down payment.");
    details.push({ id: "generic" });
  }

  return { reasons, details };
}
