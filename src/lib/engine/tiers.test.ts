import { describe, expect, it } from "vitest";
import { classifyAffordability, classifyTierFromRatios } from "./tiers";
import type { HouseholdInputs, LoanAssumptions } from "./types";
import { ZERO_EXPENSES } from "./types";

describe("classifyTierFromRatios — exact tier boundaries", () => {
  it("is comfortable exactly at the comfortable cutoff (28% / 36% / 10% leftover)", () => {
    expect(classifyTierFromRatios(0.28, 0.36, 0.1)).toBe("comfortable");
  });

  it("drops to stretch just over the comfortable housing-ratio cutoff", () => {
    expect(classifyTierFromRatios(0.2801, 0.3, 0.2)).toBe("stretch");
  });

  it("drops to stretch just over the comfortable debt-ratio cutoff", () => {
    expect(classifyTierFromRatios(0.25, 0.3601, 0.2)).toBe("stretch");
  });

  it("drops to stretch just under the comfortable leftover-income cutoff", () => {
    expect(classifyTierFromRatios(0.25, 0.3, 0.0999)).toBe("stretch");
  });

  it("is stretch exactly at the stretch cutoff (33% / 43% / 0% leftover)", () => {
    expect(classifyTierFromRatios(0.33, 0.43, 0)).toBe("stretch");
  });

  it("drops to risky just over the stretch housing-ratio cutoff", () => {
    expect(classifyTierFromRatios(0.3301, 0.35, 0.01)).toBe("risky");
  });

  it("drops to risky just over the stretch debt-ratio cutoff", () => {
    expect(classifyTierFromRatios(0.3, 0.4301, 0.01)).toBe("risky");
  });

  it("drops to risky when leftover income goes negative, even with passing ratios", () => {
    expect(classifyTierFromRatios(0.3, 0.4, -0.01)).toBe("risky");
  });

  it("is risky exactly at the risky cutoff (36% / 50%) regardless of how negative leftover is", () => {
    expect(classifyTierFromRatios(0.36, 0.5, -5)).toBe("risky");
  });

  it("is unaffordable just over the risky housing-ratio cutoff", () => {
    expect(classifyTierFromRatios(0.3601, 0.4, 0.05)).toBe("unaffordable");
  });

  it("is unaffordable just over the risky debt-ratio cutoff", () => {
    expect(classifyTierFromRatios(0.3, 0.5001, 0.05)).toBe("unaffordable");
  });
});

const household: HouseholdInputs = {
  grossMonthlyIncome: 10_000,
  netMonthlyIncome: 7_500,
  otherMonthlyDebts: 0,
  expenses: ZERO_EXPENSES,
};

const loan: LoanAssumptions = {
  stateCode: "TX",
  downPaymentDollars: 60_000,
  interestRate: 0.06,
  creditBand: "760+",
  termYears: 30,
  hoaMonthly: 0,
};

describe("classifyAffordability — integration", () => {
  it("flags negative leftover income loudly even when DTI ratios pass — the core product differentiator", () => {
    const strainedHousehold: HouseholdInputs = {
      grossMonthlyIncome: 10_000,
      netMonthlyIncome: 7_500,
      otherMonthlyDebts: 0,
      expenses: { childcare: 3000, healthcare: 800, groceries: 900, transport: 600, other: 300 },
    };

    // A modest home price that easily passes DTI ratios at $10k gross income.
    const result = classifyAffordability(strainedHousehold, loan, 250_000);

    expect(result.housingToIncomeRatio).toBeLessThanOrEqual(0.36);
    expect(result.totalDebtToIncomeRatio).toBeLessThanOrEqual(0.5);
    expect(result.leftoverIncome).toBeLessThan(0);
    expect(result.householdCanSustain).toBe(false);
  });

  it("marks lender approval independently of household sustainability", () => {
    const result = classifyAffordability(household, loan, 300_000);
    expect(result.lenderWouldLikelyApprove).toBe(true);
  });

  it("handles zero gross income without crashing, and correctly reports it as unaffordable", () => {
    const zeroIncomeHousehold: HouseholdInputs = { ...household, grossMonthlyIncome: 0 };
    const result = classifyAffordability(zeroIncomeHousehold, loan, 300_000);
    expect(Number.isNaN(result.housingToIncomeRatio)).toBe(false);
    expect(result.tier).toBe("unaffordable");
    expect(result.lenderWouldLikelyApprove).toBe(false);
  });
});
