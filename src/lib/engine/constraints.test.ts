import { describe, expect, it } from "vitest";
import { explainConstraints } from "./constraints";
import type { HouseholdInputs, LoanAssumptions } from "./types";
import { ZERO_EXPENSES } from "./types";

const loan: LoanAssumptions = {
  stateCode: "TX",
  downPaymentDollars: 60_000,
  interestRate: 0.06,
  creditBand: "760+",
  termYears: 30,
  hoaMonthly: 0,
};

describe("explainConstraints", () => {
  it("surfaces other debts as a constraint with a meaningful price impact", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 8_000,
      netMonthlyIncome: 6_000,
      otherMonthlyDebts: 900,
      expenses: ZERO_EXPENSES,
    };
    const constraints = explainConstraints(household, loan, "comfortable");
    const debtConstraint = constraints.find((c) => c.id === "other-debts");
    expect(debtConstraint).toBeDefined();
    expect(debtConstraint!.priceImpact).toBeGreaterThan(0);
    expect(debtConstraint!.description).toContain("$900");
  });

  it("does not surface a debts constraint when there are no other debts", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 8_000,
      netMonthlyIncome: 6_000,
      otherMonthlyDebts: 0,
      expenses: ZERO_EXPENSES,
    };
    const constraints = explainConstraints(household, loan, "comfortable");
    expect(constraints.find((c) => c.id === "other-debts")).toBeUndefined();
  });

  it("surfaces high-tax-state property tax as a constraint (Texas is above the national average)", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 12_000,
      netMonthlyIncome: 9_000,
      otherMonthlyDebts: 0,
      expenses: ZERO_EXPENSES,
    };
    const constraints = explainConstraints(household, loan, "comfortable");
    expect(constraints.find((c) => c.id === "state-property-tax")).toBeDefined();
  });

  it("does not surface a tax constraint for a low-tax state", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 12_000,
      netMonthlyIncome: 9_000,
      otherMonthlyDebts: 0,
      expenses: ZERO_EXPENSES,
    };
    const lowTaxLoan: LoanAssumptions = { ...loan, stateCode: "HI" };
    const constraints = explainConstraints(household, lowTaxLoan, "comfortable");
    expect(constraints.find((c) => c.id === "state-property-tax")).toBeUndefined();
  });

  it("surfaces PMI as a constraint when down payment is under 20%", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 12_000,
      netMonthlyIncome: 9_000,
      otherMonthlyDebts: 0,
      expenses: ZERO_EXPENSES,
    };
    const lowDownLoan: LoanAssumptions = { ...loan, downPaymentDollars: 20_000 };
    const constraints = explainConstraints(household, lowDownLoan, "comfortable");
    expect(constraints.find((c) => c.id === "pmi")).toBeDefined();
  });

  it("returns at most 3 constraints", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 6_000,
      netMonthlyIncome: 4_200,
      otherMonthlyDebts: 800,
      expenses: { childcare: 1200, healthcare: 300, groceries: 500, transport: 300, other: 200 },
    };
    const lowDownLoan: LoanAssumptions = { ...loan, downPaymentDollars: 10_000 };
    const constraints = explainConstraints(household, lowDownLoan, "comfortable");
    expect(constraints.length).toBeLessThanOrEqual(3);
  });

  it("never crashes on a household that can't afford anything", () => {
    const household: HouseholdInputs = {
      grossMonthlyIncome: 0,
      netMonthlyIncome: 0,
      otherMonthlyDebts: 0,
      expenses: ZERO_EXPENSES,
    };
    expect(() => explainConstraints(household, loan, "comfortable")).not.toThrow();
  });
});
