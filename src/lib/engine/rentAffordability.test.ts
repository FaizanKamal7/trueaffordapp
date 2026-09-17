import { describe, expect, it } from "vitest";
import { computeRentAffordability } from "./rentAffordability";
import type { HouseholdInputs } from "./types";
import { ZERO_EXPENSES } from "./types";

describe("computeRentAffordability", () => {
  it("the 30%-of-income rule and the 40x-annual-income screening rule are mathematically the same threshold", () => {
    // 40x monthly rent <= annual income  <=>  rent <= annual income / 40  <=>  rent <= (grossMonthly * 12) / 40 = grossMonthly * 0.3
    // This is worth asserting explicitly: it's real, useful content for the product (most renters don't realize
    // a landlord's "40x the rent" screen is the identical math to the informal 30%-of-income rule of thumb).
    const household: HouseholdInputs = {
      grossMonthlyIncome: 3_000,
      netMonthlyIncome: 2_600,
      otherMonthlyDebts: 0,
      expenses: ZERO_EXPENSES,
    };
    const result = computeRentAffordability(household, { rentersInsuranceMonthly: 20, utilitiesMonthly: 150 });
    expect(result.maxRentByIncomeRule).toBeCloseTo(result.maxRentByScreeningRule, 6);
  });

  it("is bound by the leftover-income rule when debts/expenses are heavy relative to a modest income gap", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 5_000,
      netMonthlyIncome: 3_800,
      otherMonthlyDebts: 900,
      expenses: { childcare: 1500, healthcare: 100, groceries: 400, transport: 300, other: 100 },
    };
    const result = computeRentAffordability(household, { rentersInsuranceMonthly: 20, utilitiesMonthly: 150 });
    expect(result.bindingRule).toBe("leftover");
    expect(result.maxAffordableRent).toBe(result.maxRentByLeftoverRule);
    expect(result.maxAffordableRent).toBeLessThan(result.maxRentByIncomeRule);
  });

  it("always returns the minimum of the three rules", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 6_500,
      netMonthlyIncome: 4_900,
      otherMonthlyDebts: 300,
      expenses: { childcare: 0, healthcare: 100, groceries: 500, transport: 300, other: 100 },
    };
    const result = computeRentAffordability(household, { rentersInsuranceMonthly: 25, utilitiesMonthly: 200 });
    const min = Math.min(result.maxRentByIncomeRule, result.maxRentByScreeningRule, result.maxRentByLeftoverRule);
    expect(result.maxAffordableRent).toBeCloseTo(min, 6);
  });

  it("never returns a negative max rent even when obligations exceed net income", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 2_000,
      netMonthlyIncome: 1_600,
      otherMonthlyDebts: 1_800,
      expenses: ZERO_EXPENSES,
    };
    const result = computeRentAffordability(household, { rentersInsuranceMonthly: 20, utilitiesMonthly: 150 });
    expect(result.maxAffordableRent).toBeGreaterThanOrEqual(0);
    expect(result.maxRentByLeftoverRule).toBe(0);
  });
});
