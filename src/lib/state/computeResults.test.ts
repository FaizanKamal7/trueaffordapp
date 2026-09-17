import { describe, expect, it } from "vitest";
import { computeResults } from "./computeResults";
import { DEFAULT_SCENARIO } from "./schema";
import type { ScenarioState } from "./schema";

describe("computeResults", () => {
  it("produces a coherent, non-throwing result for the default scenario", () => {
    const result = computeResults(DEFAULT_SCENARIO);
    expect(result.comfortableMax).toBeGreaterThan(0);
    expect(result.stretchMax).toBeGreaterThanOrEqual(result.comfortableMax);
    expect(result.riskyMax).toBeGreaterThanOrEqual(result.stretchMax);
    expect(result.evaluatedPrice).toBe(result.comfortableMax);
    expect(result.isCustomEvaluatedPrice).toBe(false);
    expect(result.isUnaffordable).toBe(false);
  });

  it("respects an explicit evaluatedHomePrice override", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, evaluatedHomePrice: 999_999_999 };
    const result = computeResults(scenario);
    expect(result.evaluatedPrice).toBe(999_999_999);
    expect(result.isCustomEvaluatedPrice).toBe(true);
    expect(result.isUnaffordable).toBe(true);
    expect(result.unaffordableReasons.length).toBeGreaterThan(0);
  });

  it("never throws for a household that can't afford anything", () => {
    const scenario: ScenarioState = { ...DEFAULT_SCENARIO, grossAnnualIncome: 0, netMonthlyIncome: 0 };
    expect(() => computeResults(scenario)).not.toThrow();
    const result = computeResults(scenario);
    expect(result.isUnaffordable).toBe(true);
    expect(result.unaffordableReasons.length).toBeGreaterThan(0);
  });
});
