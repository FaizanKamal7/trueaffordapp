import { computeMonthlyCosts } from "./housingCost";
import { totalRealLifeExpenses } from "./types";
import type { AffordabilityResult, AffordabilityTier, HouseholdInputs, LoanAssumptions } from "./types";

/** Tier boundary constants — the single source of truth for the three-tier table. */
export const TIER_THRESHOLDS = {
  comfortable: { maxHousingRatio: 0.28, maxDebtRatio: 0.36, minLeftoverPctOfNet: 0.1 },
  stretch: { maxHousingRatio: 0.33, maxDebtRatio: 0.43, minLeftoverPctOfNet: 0 },
  risky: { maxHousingRatio: 0.36, maxDebtRatio: 0.5 },
} as const;

/** Exported for direct boundary testing — the pure ratio/leftover decision table behind classifyAffordability. */
export function classifyTierFromRatios(housingRatio: number, debtRatio: number, leftoverPctOfNet: number): AffordabilityTier {
  const c = TIER_THRESHOLDS.comfortable;
  const s = TIER_THRESHOLDS.stretch;
  const r = TIER_THRESHOLDS.risky;

  if (housingRatio <= c.maxHousingRatio && debtRatio <= c.maxDebtRatio && leftoverPctOfNet >= c.minLeftoverPctOfNet) {
    return "comfortable";
  }
  if (housingRatio <= s.maxHousingRatio && debtRatio <= s.maxDebtRatio && leftoverPctOfNet >= s.minLeftoverPctOfNet) {
    return "stretch";
  }
  if (housingRatio <= r.maxHousingRatio && debtRatio <= r.maxDebtRatio) {
    // Risky is flagged regardless of the leftover-income remainder — deliberately not gated on it.
    return "risky";
  }
  return "unaffordable";
}

/**
 * Full affordability assessment for a specific home price against a
 * household's income, debts, and real-life expenses.
 */
export function classifyAffordability(household: HouseholdInputs, loan: LoanAssumptions, homePrice: number): AffordabilityResult {
  const breakdown = computeMonthlyCosts(homePrice, loan);

  const housingToIncomeRatio = household.grossMonthlyIncome > 0 ? breakdown.lenderMonthlyPayment / household.grossMonthlyIncome : Infinity;
  const totalDebtToIncomeRatio =
    household.grossMonthlyIncome > 0 ? (breakdown.lenderMonthlyPayment + household.otherMonthlyDebts) / household.grossMonthlyIncome : Infinity;

  const leftoverIncome =
    household.netMonthlyIncome - breakdown.sustainableMonthlyPayment - household.otherMonthlyDebts - totalRealLifeExpenses(household.expenses);
  const leftoverIncomePctOfNet = household.netMonthlyIncome > 0 ? leftoverIncome / household.netMonthlyIncome : leftoverIncome >= 0 ? 0 : -Infinity;

  const tier = classifyTierFromRatios(housingToIncomeRatio, totalDebtToIncomeRatio, leftoverIncomePctOfNet);

  const lenderWouldLikelyApprove = housingToIncomeRatio <= TIER_THRESHOLDS.risky.maxHousingRatio && totalDebtToIncomeRatio <= TIER_THRESHOLDS.risky.maxDebtRatio;
  const householdCanSustain = leftoverIncome >= 0;

  return {
    breakdown,
    housingToIncomeRatio,
    totalDebtToIncomeRatio,
    leftoverIncome,
    leftoverIncomePctOfNet,
    tier,
    lenderWouldLikelyApprove,
    householdCanSustain,
  };
}
