import { describe, expect, it } from "vitest";
import { classifyCarAffordability, classifyCarTierFromRatio, computeCarMonthlyCosts, solveMaxCarPrice, solveSustainableMaxCarPrice } from "./carAffordability";
import type { CarLoanAssumptions } from "./carAffordability";
import type { HouseholdInputs } from "./types";
import { ZERO_EXPENSES } from "./types";

const baseLoan: CarLoanAssumptions = {
  stateCode: "TX",
  downPaymentDollars: 14_000,
  tradeInValueDollars: 0,
  interestRate: 0.07,
  creditBand: "740-759",
  termMonths: 60,
  insuranceMonthly: 120,
};

const household: HouseholdInputs = {
  grossMonthlyIncome: 80_000 / 12,
  netMonthlyIncome: 5_500,
  otherMonthlyDebts: 300,
  expenses: { childcare: 0, healthcare: 100, groceries: 500, transport: 200, other: 100 },
};

describe("computeCarMonthlyCosts", () => {
  it("matches a concrete worked example: $70k car, 20% down, TX sales tax, 7% APR / 60mo", () => {
    // $70,000 price, $14,000 down (20%), TX sales tax 6.25%, financed = 70,000 - 14,000 + tax
    const breakdown = computeCarMonthlyCosts(70_000, baseLoan);
    const expectedTax = 70_000 * 0.0625;
    expect(breakdown.salesTax).toBeCloseTo(expectedTax, 2);
    expect(breakdown.amountFinanced).toBeCloseTo(70_000 - 14_000 + expectedTax, 2);
    // Sanity: P&I on ~$60.4k at 7%/60mo should land in the ballpark of $1,200/mo.
    expect(breakdown.principalAndInterest).toBeGreaterThan(1_100);
    expect(breakdown.principalAndInterest).toBeLessThan(1_300);
    expect(breakdown.totalMonthlyCost).toBeCloseTo(breakdown.principalAndInterest + 120, 6);
  });

  it("handles the zero-interest edge case as a straight-line payoff of the financed amount", () => {
    const loan: CarLoanAssumptions = { ...baseLoan, interestRate: 0, tradeInValueDollars: 0, downPaymentDollars: 5_000 };
    const breakdown = computeCarMonthlyCosts(30_000, loan);
    expect(breakdown.principalAndInterest).toBeCloseTo(breakdown.amountFinanced / 60, 6);
  });

  it("a trade-in reduces the amount financed dollar-for-dollar (net of the tax it also reduces)", () => {
    const withoutTradeIn = computeCarMonthlyCosts(40_000, { ...baseLoan, tradeInValueDollars: 0 });
    const withTradeIn = computeCarMonthlyCosts(40_000, { ...baseLoan, tradeInValueDollars: 8_000 });
    expect(withTradeIn.amountFinanced).toBeLessThan(withoutTradeIn.amountFinanced);
    // Trade-in also lowers the taxable amount, so sales tax should drop too.
    expect(withTradeIn.salesTax).toBeLessThan(withoutTradeIn.salesTax);
  });

  it("charges zero sales tax in a sales-tax-free state (Oregon)", () => {
    const breakdown = computeCarMonthlyCosts(40_000, { ...baseLoan, stateCode: "OR" });
    expect(breakdown.salesTax).toBe(0);
  });

  it("clamps amount financed at 0 when down payment + trade-in exceed price plus tax", () => {
    const breakdown = computeCarMonthlyCosts(10_000, { ...baseLoan, downPaymentDollars: 20_000, tradeInValueDollars: 0 });
    expect(breakdown.amountFinanced).toBe(0);
    expect(breakdown.principalAndInterest).toBe(0);
  });
});

describe("classifyCarTierFromRatio", () => {
  it("classifies at and around the comfortable/stretch/risky boundaries (10% / 15% / 20% of gross income)", () => {
    expect(classifyCarTierFromRatio(0.1)).toBe("comfortable");
    expect(classifyCarTierFromRatio(0.1001)).toBe("stretch");
    expect(classifyCarTierFromRatio(0.15)).toBe("stretch");
    expect(classifyCarTierFromRatio(0.1501)).toBe("risky");
    expect(classifyCarTierFromRatio(0.2)).toBe("risky");
    expect(classifyCarTierFromRatio(0.2001)).toBe("unaffordable");
  });
});

describe("classifyCarAffordability", () => {
  it("handles the zero-income edge case as unaffordable rather than dividing by zero into NaN", () => {
    const zeroIncomeHousehold: HouseholdInputs = { grossMonthlyIncome: 0, netMonthlyIncome: 0, otherMonthlyDebts: 0, expenses: ZERO_EXPENSES };
    const result = classifyCarAffordability(zeroIncomeHousehold, baseLoan, 30_000);
    expect(result.pctOfGrossMonthlyIncome).toBe(Infinity);
    expect(result.tier).toBe("unaffordable");
    expect(result.householdCanSustain).toBe(false);
  });

  it("shows the leftover-income gap: a household can clear the income-ratio tier but still fail the sustainability test", () => {
    // Heavy other debts/expenses relative to net income, but a small, low-cost car that easily clears the 10% gross-income ratio.
    const strainedHousehold: HouseholdInputs = {
      grossMonthlyIncome: 6_000,
      netMonthlyIncome: 3_200,
      otherMonthlyDebts: 1_800,
      expenses: { childcare: 1000, healthcare: 200, groceries: 500, transport: 100, other: 100 },
    };
    const result = classifyCarAffordability(strainedHousehold, { ...baseLoan, downPaymentDollars: 3_000 }, 18_000);
    expect(result.tier).toBe("comfortable");
    expect(result.householdCanSustain).toBe(false);
    expect(result.leftoverIncome).toBeLessThan(0);
  });

  it("a comfortably-affordable car for a healthy-income household passes both the tier and the leftover-income test", () => {
    const result = classifyCarAffordability(household, baseLoan, 25_000);
    expect(result.tier).toBe("comfortable");
    expect(result.householdCanSustain).toBe(true);
    expect(result.leftoverIncome).toBeGreaterThan(0);
  });
});

describe("solveMaxCarPrice / solveSustainableMaxCarPrice", () => {
  it("solves a max price that actually lands at (or just under) the target tier's ratio boundary", () => {
    const solved = solveMaxCarPrice(household, baseLoan, "comfortable");
    expect(solved.affordability.pctOfGrossMonthlyIncome).toBeLessThanOrEqual(0.1 + 1e-6);
    expect(solved.converged).toBe(true);
  });

  it("the risky-tier max price is never smaller than the comfortable-tier max price", () => {
    const comfortable = solveMaxCarPrice(household, baseLoan, "comfortable");
    const risky = solveMaxCarPrice(household, baseLoan, "risky");
    expect(risky.maxCarPrice).toBeGreaterThanOrEqual(comfortable.maxCarPrice);
  });

  it("surfaces a 'rule says X, you can sustain Y' gap for a household with heavy real-life expenses", () => {
    const strainedHousehold: HouseholdInputs = {
      grossMonthlyIncome: 7_000,
      netMonthlyIncome: 4_000,
      otherMonthlyDebts: 700,
      expenses: { childcare: 1200, healthcare: 200, groceries: 600, transport: 200, other: 150 },
    };
    const riskyMax = solveMaxCarPrice(strainedHousehold, baseLoan, "risky");
    const sustainableMax = solveSustainableMaxCarPrice(strainedHousehold, baseLoan);
    expect(sustainableMax.maxCarPrice).toBeLessThan(riskyMax.maxCarPrice);
  });

  it("returns 0 when even a $0 car fails the predicate (down payment already exceeds what's sustainable)", () => {
    const brokeHousehold: HouseholdInputs = {
      grossMonthlyIncome: 1_500,
      netMonthlyIncome: 1_200,
      otherMonthlyDebts: 1_100,
      expenses: { childcare: 0, healthcare: 100, groceries: 300, transport: 100, other: 50 },
    };
    const result = solveSustainableMaxCarPrice(brokeHousehold, baseLoan);
    expect(result.maxCarPrice).toBe(0);
    expect(result.converged).toBe(true);
  });
});
