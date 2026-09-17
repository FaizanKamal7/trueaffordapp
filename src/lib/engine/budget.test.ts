import { describe, expect, it } from "vitest";
import { computeBudget, BUDGET_TARGETS } from "./budget";
import type { HouseholdInputs } from "./types";

describe("computeBudget", () => {
  it("flags when housing alone exceeds the 50% needs target", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 6_000,
      netMonthlyIncome: 4_500,
      otherMonthlyDebts: 0,
      expenses: { childcare: 0, healthcare: 0, groceries: 0, transport: 0, other: 0 },
    };
    const result = computeBudget(household, 2_500); // 2500/4500 = 55.5%
    expect(result.housingAloneExceedsNeedsTarget).toBe(true);
  });

  it("does not flag when housing alone is under 50%", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 6_000,
      netMonthlyIncome: 4_500,
      otherMonthlyDebts: 0,
      expenses: { childcare: 0, healthcare: 0, groceries: 0, transport: 0, other: 0 },
    };
    const result = computeBudget(household, 2_000); // 2000/4500 = 44%
    expect(result.housingAloneExceedsNeedsTarget).toBe(false);
  });

  it("computes needs as housing + debts + childcare/healthcare/groceries/transport, and wants as the 'other' field", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 8_000,
      netMonthlyIncome: 6_000,
      otherMonthlyDebts: 300,
      expenses: { childcare: 800, healthcare: 150, groceries: 500, transport: 350, other: 400 },
    };
    const result = computeBudget(household, 1_800);
    expect(result.needs).toBeCloseTo(1_800 + 300 + 800 + 150 + 500 + 350, 6);
    expect(result.wants).toBe(400);
    expect(result.savings).toBeCloseTo(6_000 - result.needs - result.wants, 6);
  });

  it("delta is zero when a household lands exactly on every target", () => {
    const net = 5_000;
    const household: HouseholdInputs = {
      grossMonthlyIncome: 7_000,
      netMonthlyIncome: net,
      otherMonthlyDebts: 0,
      expenses: { childcare: 0, healthcare: 0, groceries: 0, transport: 0, other: net * BUDGET_TARGETS.wantsPct },
    };
    const housingPayment = net * BUDGET_TARGETS.needsPct;
    const result = computeBudget(household, housingPayment);
    expect(result.needsDeltaDollars).toBeCloseTo(0, 6);
    expect(result.wantsDeltaDollars).toBeCloseTo(0, 6);
    expect(result.savingsDeltaDollars).toBeCloseTo(0, 6);
  });

  it("handles zero net income without throwing or dividing by zero into NaN", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 0,
      netMonthlyIncome: 0,
      otherMonthlyDebts: 100,
      expenses: { childcare: 0, healthcare: 0, groceries: 0, transport: 0, other: 0 },
    };
    expect(() => computeBudget(household, 500)).not.toThrow();
    const result = computeBudget(household, 500);
    expect(Number.isNaN(result.needsPctOfNet)).toBe(false);
  });
});
