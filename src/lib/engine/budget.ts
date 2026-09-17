import type { HouseholdInputs } from "./types";

export const BUDGET_TARGETS = {
  needsPct: 0.5,
  wantsPct: 0.3,
  savingsPct: 0.2,
} as const;

export interface BudgetBreakdown {
  netMonthlyIncome: number;
  /** Housing + other debts + childcare + healthcare + groceries + transport — the obligatory core */
  needs: number;
  /** The "other" real-life expense field — the closest this schema has to discretionary spending */
  wants: number;
  /** Whatever is left over — ideally savings/debt paydown, but can be negative */
  savings: number;
  needsPctOfNet: number;
  wantsPctOfNet: number;
  savingsPctOfNet: number;
  /** actual - target, in dollars. Positive means over target. */
  needsDeltaDollars: number;
  wantsDeltaDollars: number;
  savingsDeltaDollars: number;
  /** True when housing cost alone already exceeds the entire 50% needs target */
  housingAloneExceedsNeedsTarget: boolean;
}

/**
 * Maps this product's existing income/debt/expense fields onto the
 * classic 50/30/20 budget framing, against NET (take-home) income — the
 * standard basis for this rule. Deliberately reuses the shared household
 * schema rather than introducing a separate "wants" input, so a user's
 * numbers carry over from the affordability calculators with nothing
 * re-entered (spec 3.1).
 */
export function computeBudget(household: HouseholdInputs, monthlyHousingPayment: number): BudgetBreakdown {
  const net = household.netMonthlyIncome;
  const needs = monthlyHousingPayment + household.otherMonthlyDebts + household.expenses.childcare + household.expenses.healthcare + household.expenses.groceries + household.expenses.transport;
  const wants = household.expenses.other;
  const savings = net - needs - wants;

  const pctOf = (amount: number) => (net > 0 ? amount / net : amount > 0 ? Infinity : 0);

  const needsPctOfNet = pctOf(needs);
  const wantsPctOfNet = pctOf(wants);
  const savingsPctOfNet = pctOf(savings);

  return {
    netMonthlyIncome: net,
    needs,
    wants,
    savings,
    needsPctOfNet,
    wantsPctOfNet,
    savingsPctOfNet,
    needsDeltaDollars: needs - net * BUDGET_TARGETS.needsPct,
    wantsDeltaDollars: wants - net * BUDGET_TARGETS.wantsPct,
    savingsDeltaDollars: savings - net * BUDGET_TARGETS.savingsPct,
    housingAloneExceedsNeedsTarget: net > 0 && monthlyHousingPayment > net * BUDGET_TARGETS.needsPct,
  };
}
