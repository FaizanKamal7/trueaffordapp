import { describe, expect, it } from "vitest";
import { computeCarResults } from "./computeCarResults";
import { DEFAULT_SCENARIO } from "./schema";
import type { ScenarioState } from "./schema";

describe("computeCarResults", () => {
  it("defaults the evaluated price to the best available (non-zero) tier max", () => {
    const result = computeCarResults(DEFAULT_SCENARIO);
    expect(result.evaluatedPrice).toBe(result.defaultEvaluatedPrice);
    expect(result.isCustomEvaluatedPrice).toBe(false);
  });

  it("respects a custom evaluated car price", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, evaluatedCarPrice: 40_000 };
    const result = computeCarResults(scenario);
    expect(result.isCustomEvaluatedPrice).toBe(true);
    expect(result.evaluatedPrice).toBe(40_000);
    expect(result.affordability.breakdown.carPrice).toBe(40_000);
  });

  it("tier max prices are non-decreasing: comfortable <= stretch <= risky", () => {
    const result = computeCarResults(DEFAULT_SCENARIO);
    expect(result.comfortableMax).toBeLessThanOrEqual(result.stretchMax);
    expect(result.stretchMax).toBeLessThanOrEqual(result.riskyMax);
  });

  it("never throws for a zero-income household, and every max collapses to 0", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, grossAnnualIncome: 0, netMonthlyIncome: 0 };
    expect(() => computeCarResults(scenario)).not.toThrow();
    const result = computeCarResults(scenario);
    expect(result.comfortableMax).toBe(0);
    expect(result.riskyMax).toBe(0);
  });

  it("reports a non-negative rule-vs-sustainable gap", () => {
    const result = computeCarResults(DEFAULT_SCENARIO);
    expect(result.ruleVsSustainableGap).toBeGreaterThanOrEqual(0);
    expect(result.ruleVsSustainableGap).toBeCloseTo(Math.max(0, result.riskyMax - result.sustainableMax), 0);
  });
});
