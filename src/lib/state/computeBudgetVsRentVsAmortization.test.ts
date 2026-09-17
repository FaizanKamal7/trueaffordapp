import { describe, expect, it } from "vitest";
import { computeBudgetResults } from "./computeBudgetResults";
import { computeRentVsBuyResults } from "./computeRentVsBuyResults";
import { computeAmortizationResults } from "./computeAmortizationResults";
import { DEFAULT_SCENARIO } from "./schema";
import type { ScenarioState } from "./schema";

describe("computeBudgetResults", () => {
  it("defaults the housing payment to the sustainable monthly payment from the shared scenario", () => {
    const result = computeBudgetResults(DEFAULT_SCENARIO);
    expect(result.housingPayment).toBe(result.defaultHousingPayment);
    expect(result.isCustomHousingPayment).toBe(false);
    expect(result.budget.needs).toBeGreaterThan(0);
  });

  it("respects an explicit budgetHousingOverride", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, budgetHousingOverride: 1_500 };
    const result = computeBudgetResults(scenario);
    expect(result.housingPayment).toBe(1_500);
    expect(result.isCustomHousingPayment).toBe(true);
  });
});

describe("computeRentVsBuyResults", () => {
  it("never throws and returns a coherent simulation for the default scenario", () => {
    expect(() => computeRentVsBuyResults(DEFAULT_SCENARIO)).not.toThrow();
    const result = computeRentVsBuyResults(DEFAULT_SCENARIO);
    expect(result.homePrice).toBeGreaterThan(0);
    expect(result.simulation.timeline.length).toBe(31);
  });

  it("uses the shared tenureYears field for the headline comparison", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, tenureYears: 10 };
    const result = computeRentVsBuyResults(scenario);
    expect(result.tenureYears).toBe(10);
  });
});

describe("computeAmortizationResults", () => {
  it("derives loan amount from evaluated home price minus down payment", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, evaluatedHomePrice: 400_000, downPaymentDollars: 60_000 };
    const result = computeAmortizationResults(scenario);
    expect(result.loanAmount).toBeCloseTo(340_000, 6);
    expect(result.amortization.payoffMonth).toBeGreaterThan(0);
  });

  it("respects an extra monthly payment from shared state", () => {
    const withoutExtra = computeAmortizationResults({ ...DEFAULT_SCENARIO, evaluatedHomePrice: 400_000, extraMonthlyPayment: 0 });
    const withExtra = computeAmortizationResults({ ...DEFAULT_SCENARIO, evaluatedHomePrice: 400_000, extraMonthlyPayment: 300 });
    expect(withExtra.amortization.payoffMonth).toBeLessThan(withoutExtra.amortization.payoffMonth);
  });
});
