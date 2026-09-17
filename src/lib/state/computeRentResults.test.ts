import { describe, expect, it } from "vitest";
import { computeRentResults } from "./computeRentResults";
import { DEFAULT_SCENARIO } from "./schema";
import type { ScenarioState } from "./schema";

describe("computeRentResults", () => {
  it("defaults the evaluated rent to the max affordable rent", () => {
    const result = computeRentResults(DEFAULT_SCENARIO);
    expect(result.evaluatedRent).toBe(result.rentAffordability.maxAffordableRent);
    expect(result.isCustomEvaluatedRent).toBe(false);
  });

  it("flags over-budget when a custom evaluated rent exceeds the max affordable rent", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, evaluatedRent: 999_999 };
    const result = computeRentResults(scenario);
    expect(result.isCustomEvaluatedRent).toBe(true);
    expect(result.isOverBudgetAtEvaluatedRent).toBe(true);
    expect(result.leftoverAtEvaluatedRent).toBeLessThan(0);
  });

  it("never throws for a zero-income household", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, grossAnnualIncome: 0, netMonthlyIncome: 0 };
    expect(() => computeRentResults(scenario)).not.toThrow();
    const result = computeRentResults(scenario);
    expect(result.rentAffordability.maxAffordableRent).toBe(0);
  });
});
