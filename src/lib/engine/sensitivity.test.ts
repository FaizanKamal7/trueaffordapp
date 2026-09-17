import { describe, expect, it } from "vitest";
import { computeSensitivity, ILLUSTRATIVE_CHILDCARE_ADDITION } from "./sensitivity";
import type { HouseholdInputs, LoanAssumptions } from "./types";
import { ZERO_EXPENSES } from "./types";
import { solveMaxHomePrice } from "./maxPrice";

const household: HouseholdInputs = {
  grossMonthlyIncome: 9_000,
  netMonthlyIncome: 6_800,
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

describe("computeSensitivity", () => {
  it("a lower rate increases max price and a higher rate decreases it", () => {
    const evaluatedPrice = solveMaxHomePrice(household, loan, "comfortable").maxHomePrice;
    const result = computeSensitivity(household, loan, evaluatedPrice, "comfortable");
    expect(result.rate.minusOnePoint).toBeGreaterThan(result.rate.current);
    expect(result.rate.plusOnePoint).toBeLessThan(result.rate.current);
  });

  it("a 20% income drop never improves the tier", () => {
    const evaluatedPrice = solveMaxHomePrice(household, loan, "comfortable").maxHomePrice;
    const result = computeSensitivity(household, loan, evaluatedPrice, "comfortable");
    const tierRank: Record<string, number> = { comfortable: 0, stretch: 1, risky: 2, unaffordable: 3 };
    expect(tierRank[result.incomeDrop.droppedTier]).toBeGreaterThanOrEqual(tierRank[result.incomeDrop.currentTier]);
    expect(result.incomeDrop.droppedGrossMonthlyIncome).toBeCloseTo(household.grossMonthlyIncome * 0.8, 6);
  });

  it("adding a child's illustrative cost never improves the tier", () => {
    const evaluatedPrice = solveMaxHomePrice(household, loan, "comfortable").maxHomePrice;
    const result = computeSensitivity(household, loan, evaluatedPrice, "comfortable");
    const tierRank: Record<string, number> = { comfortable: 0, stretch: 1, risky: 2, unaffordable: 3 };
    expect(tierRank[result.addingChild.withChildTier]).toBeGreaterThanOrEqual(tierRank[result.addingChild.currentTier]);
    expect(result.addingChild.addedMonthlyCost).toBe(ILLUSTRATIVE_CHILDCARE_ADDITION);
  });

  it("a larger down payment never increases PMI and never increases the total monthly cost", () => {
    const lowDownLoan: LoanAssumptions = { ...loan, downPaymentDollars: 20_000 };
    const evaluatedPrice = solveMaxHomePrice(household, lowDownLoan, "comfortable").maxHomePrice;
    const result = computeSensitivity(household, lowDownLoan, evaluatedPrice, "comfortable");
    expect(result.downPayment.largerPmiMonthly).toBeLessThanOrEqual(result.downPayment.currentPmiMonthly);
    expect(result.downPayment.largerTotalMonthly).toBeLessThanOrEqual(result.downPayment.currentTotalMonthly);
  });

  it("never throws for a household with zero expenses", () => {
    const zeroExpenseHousehold: HouseholdInputs = { ...household, expenses: ZERO_EXPENSES };
    const evaluatedPrice = solveMaxHomePrice(zeroExpenseHousehold, loan, "comfortable").maxHomePrice;
    expect(() => computeSensitivity(zeroExpenseHousehold, loan, evaluatedPrice, "comfortable")).not.toThrow();
  });
});
