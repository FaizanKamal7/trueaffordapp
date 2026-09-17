import { describe, expect, it } from "vitest";
import { explainUnaffordable } from "./explain";
import { classifyAffordability } from "./tiers";
import type { HouseholdInputs, LoanAssumptions } from "./types";
import { ZERO_EXPENSES } from "./types";

const loan: LoanAssumptions = {
  stateCode: "TX",
  downPaymentDollars: 20_000,
  interestRate: 0.06,
  creditBand: "760+",
  termYears: 30,
  hoaMonthly: 0,
};

describe("explainUnaffordable", () => {
  it("names the housing-ratio ceiling when it's the blown condition", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 4_000,
      netMonthlyIncome: 3_200,
      otherMonthlyDebts: 0,
      expenses: ZERO_EXPENSES,
    };
    // A price well beyond what $4k/mo gross can support even at risky-tier ceilings.
    const price = 900_000;
    const result = classifyAffordability(household, loan, price);
    expect(result.tier).toBe("unaffordable");

    const explanation = explainUnaffordable(household, loan, price);
    expect(explanation.reasons.length).toBeGreaterThan(0);
    expect(explanation.reasons.some((r) => r.includes("36%"))).toBe(true);
  });

  it("never throws and always returns at least one human-readable reason", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 0,
      netMonthlyIncome: 0,
      otherMonthlyDebts: 0,
      expenses: ZERO_EXPENSES,
    };
    expect(() => explainUnaffordable(household, loan, 500_000)).not.toThrow();
    const explanation = explainUnaffordable(household, loan, 500_000);
    expect(explanation.reasons.length).toBeGreaterThan(0);
  });
});
