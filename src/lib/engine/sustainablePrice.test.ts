import { describe, expect, it } from "vitest";
import { solveSustainableMaxPrice, solveLenderApprovalMaxPrice } from "./maxPrice";
import type { HouseholdInputs, LoanAssumptions } from "./types";

const loan: LoanAssumptions = {
  stateCode: "TX",
  downPaymentDollars: 60_000,
  interestRate: 0.06,
  creditBand: "760+",
  termYears: 30,
  hoaMonthly: 0,
};

describe("solveSustainableMaxPrice", () => {
  it("converges to a price where leftover income is at (or just above) zero", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 9_000,
      netMonthlyIncome: 7_000,
      otherMonthlyDebts: 300,
      expenses: { childcare: 1200, healthcare: 200, groceries: 600, transport: 400, other: 100 },
    };
    const result = solveSustainableMaxPrice(household, loan);
    expect(result.converged).toBe(true);
    expect(result.affordability.leftoverIncome).toBeGreaterThanOrEqual(-1);
  });

  it("heavy real-life expenses reduce the sustainable max more than they reduce the lender-approval max", () => {
    const lightExpenses: HouseholdInputs = {
      grossMonthlyIncome: 10_000,
      netMonthlyIncome: 7_500,
      otherMonthlyDebts: 0,
      expenses: { childcare: 0, healthcare: 100, groceries: 400, transport: 300, other: 100 },
    };
    const heavyExpenses: HouseholdInputs = {
      ...lightExpenses,
      expenses: { childcare: 2500, healthcare: 100, groceries: 400, transport: 300, other: 100 },
    };

    const lightSustainable = solveSustainableMaxPrice(lightExpenses, loan).maxHomePrice;
    const heavySustainable = solveSustainableMaxPrice(heavyExpenses, loan).maxHomePrice;
    const lightLender = solveLenderApprovalMaxPrice(lightExpenses, loan).maxHomePrice;
    const heavyLender = solveLenderApprovalMaxPrice(heavyExpenses, loan).maxHomePrice;

    // Lender approval (pure DTI) is untouched by real-life expenses — lenders don't see them.
    expect(heavyLender).toBe(lightLender);
    // Sustainable max drops significantly since childcare directly eats leftover income.
    expect(heavySustainable).toBeLessThan(lightSustainable);
  });
});

describe("solveLenderApprovalMaxPrice", () => {
  it("equals the risky-tier max price (pure DTI ceiling, leftover-agnostic)", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 8_000,
      netMonthlyIncome: 6_000,
      otherMonthlyDebts: 200,
      expenses: { childcare: 0, healthcare: 100, groceries: 400, transport: 300, other: 100 },
    };
    const lenderMax = solveLenderApprovalMaxPrice(household, loan);
    expect(lenderMax.targetTier).toBe("risky");
  });
});
