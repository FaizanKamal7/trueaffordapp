import { describe, expect, it } from "vitest";
import { solveMaxHomePrice, CONVERGENCE_DOLLARS, MAX_BINARY_SEARCH_ITERATIONS } from "./maxPrice";
import { classifyAffordability } from "./tiers";
import type { HouseholdInputs, LoanAssumptions } from "./types";
import { ZERO_EXPENSES } from "./types";

const household: HouseholdInputs = {
  grossMonthlyIncome: 10_000,
  netMonthlyIncome: 7_500,
  otherMonthlyDebts: 300,
  expenses: { childcare: 0, healthcare: 100, groceries: 500, transport: 300, other: 100 },
};

const loan: LoanAssumptions = {
  stateCode: "TX",
  downPaymentDollars: 60_000,
  interestRate: 0.06,
  creditBand: "760+",
  termYears: 30,
  hoaMonthly: 0,
};

describe("solveMaxHomePrice — binary search", () => {
  it("converges within the $1 tolerance and under the iteration cap", () => {
    const result = solveMaxHomePrice(household, loan, "comfortable");
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThanOrEqual(MAX_BINARY_SEARCH_ITERATIONS);
  });

  it("the solved price satisfies the target tier", () => {
    const result = solveMaxHomePrice(household, loan, "stretch");
    expect(result.affordability.tier === "comfortable" || result.affordability.tier === "stretch").toBe(true);
  });

  it("a price just above the solved max price no longer satisfies the tier (tight boundary)", () => {
    const result = solveMaxHomePrice(household, loan, "comfortable");
    const justAbove = classifyAffordability(household, loan, result.maxHomePrice + CONVERGENCE_DOLLARS * 50);
    expect(justAbove.tier).not.toBe("comfortable");
  });

  it("looser tiers allow a higher (or equal) max price than stricter tiers", () => {
    const comfortable = solveMaxHomePrice(household, loan, "comfortable");
    const stretch = solveMaxHomePrice(household, loan, "stretch");
    const risky = solveMaxHomePrice(household, loan, "risky");
    expect(stretch.maxHomePrice).toBeGreaterThanOrEqual(comfortable.maxHomePrice);
    expect(risky.maxHomePrice).toBeGreaterThanOrEqual(stretch.maxHomePrice);
  });

  it("returns maxHomePrice 0 when the household can't afford anything (e.g. zero income)", () => {
    const zeroIncomeHousehold: HouseholdInputs = { ...household, grossMonthlyIncome: 0, netMonthlyIncome: 0 };
    const result = solveMaxHomePrice(zeroIncomeHousehold, loan, "comfortable");
    expect(result.maxHomePrice).toBe(0);
    expect(result.converged).toBe(true);
  });

  it("flags when the down payment exceeds the solved max price (debt/expenses eat all borrowing capacity)", () => {
    const overloadedHousehold: HouseholdInputs = {
      grossMonthlyIncome: 3_000,
      netMonthlyIncome: 2_200,
      otherMonthlyDebts: 2_800,
      expenses: ZERO_EXPENSES,
    };
    const result = solveMaxHomePrice(overloadedHousehold, { ...loan, downPaymentDollars: 60_000 }, "comfortable");
    expect(result.downPaymentExceedsMaxPrice).toBe(true);
  });

  it("does not flag downPaymentExceedsMaxPrice for a healthy, well-qualified household", () => {
    const result = solveMaxHomePrice(household, loan, "comfortable");
    expect(result.maxHomePrice).toBeGreaterThan(loan.downPaymentDollars);
    expect(result.downPaymentExceedsMaxPrice).toBe(false);
  });

  it("higher income increases the max sustainable price", () => {
    const lowerIncome = solveMaxHomePrice(household, loan, "comfortable");
    const higherIncomeHousehold: HouseholdInputs = { ...household, grossMonthlyIncome: 15_000, netMonthlyIncome: 11_000 };
    const higherIncome = solveMaxHomePrice(higherIncomeHousehold, loan, "comfortable");
    expect(higherIncome.maxHomePrice).toBeGreaterThan(lowerIncome.maxHomePrice);
  });
});
