import { totalRealLifeExpenses } from "./types";
import type { HouseholdInputs } from "./types";

export interface RentCosts {
  rentersInsuranceMonthly: number;
  utilitiesMonthly: number;
}

export type RentBindingRule = "income" | "screening" | "leftover";

export interface RentAffordabilityResult {
  /** 30% of gross monthly income — the common rule of thumb */
  maxRentByIncomeRule: number;
  /** Annual gross income must be >= 40x monthly rent — the standard landlord screening rule in many markets */
  maxRentByScreeningRule: number;
  /** Max rent at which leftover income (after renters insurance, utilities, other debts, real-life expenses) stays >= 0 */
  maxRentByLeftoverRule: number;
  /** The most conservative (lowest) of the three — the actual answer */
  maxAffordableRent: number;
  bindingRule: RentBindingRule;
}

/**
 * Rent affordability is evaluated against three independent constraints,
 * and the MOST conservative one wins — never the average, never the most
 * generous. The screening rule (40x annual income) is what trips people
 * up: many renters clear the 30%-of-income rule comfortably but still
 * get screened out by a landlord's income requirement, and almost no
 * calculator explains that gap (spec 3.9).
 */
export function computeRentAffordability(household: HouseholdInputs, rent: RentCosts): RentAffordabilityResult {
  const maxRentByIncomeRule = household.grossMonthlyIncome * 0.3;
  const maxRentByScreeningRule = (household.grossMonthlyIncome * 12) / 40;

  const nonRentObligations = rent.rentersInsuranceMonthly + rent.utilitiesMonthly + household.otherMonthlyDebts + totalRealLifeExpenses(household.expenses);
  const maxRentByLeftoverRule = Math.max(0, household.netMonthlyIncome - nonRentObligations);

  const candidates: [RentBindingRule, number][] = [
    ["income", maxRentByIncomeRule],
    ["screening", maxRentByScreeningRule],
    ["leftover", maxRentByLeftoverRule],
  ];

  const [bindingRule, maxAffordableRent] = candidates.reduce((min, curr) => (curr[1] < min[1] ? curr : min));

  return {
    maxRentByIncomeRule,
    maxRentByScreeningRule,
    maxRentByLeftoverRule,
    maxAffordableRent: Math.max(0, maxAffordableRent),
    bindingRule,
  };
}
