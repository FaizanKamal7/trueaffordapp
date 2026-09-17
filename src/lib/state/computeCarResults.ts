import { scenarioToHousehold, scenarioToCarLoan } from "./toEngine";
import { classifyCarAffordability, solveMaxCarPrice, solveSustainableMaxCarPrice } from "../engine/carAffordability";
import type { CarAffordabilityResult } from "../engine/carAffordability";
import type { ScenarioState } from "./schema";

export interface CarCalculatorResults {
  comfortableMax: number;
  stretchMax: number;
  /** Also the pure-ratio "20/4/10-style rule would allow" ceiling */
  riskyMax: number;
  sustainableMax: number;
  evaluatedPrice: number;
  defaultEvaluatedPrice: number;
  isCustomEvaluatedPrice: boolean;
  affordability: CarAffordabilityResult;
  /** riskyMax - sustainableMax — the "rule of thumb vs. what you can actually sustain" gap */
  ruleVsSustainableGap: number;
  isUnaffordable: boolean;
}

/**
 * The single orchestration function the car affordability page — server-side
 * on first render, client-side on every subsequent input change — calls to
 * turn a ScenarioState into everything the results view needs. Mirrors
 * computeResults.ts's role for the home calculator.
 */
export function computeCarResults(scenario: ScenarioState): CarCalculatorResults {
  const household = scenarioToHousehold(scenario);
  const loan = scenarioToCarLoan(scenario);

  const comfortable = solveMaxCarPrice(household, loan, "comfortable");
  const stretch = solveMaxCarPrice(household, loan, "stretch");
  const risky = solveMaxCarPrice(household, loan, "risky");
  const sustainable = solveSustainableMaxCarPrice(household, loan);

  const defaultEvaluatedPrice = comfortable.maxCarPrice > 0 ? comfortable.maxCarPrice : stretch.maxCarPrice > 0 ? stretch.maxCarPrice : risky.maxCarPrice;
  const evaluatedPrice = scenario.evaluatedCarPrice ?? defaultEvaluatedPrice;

  const affordability = classifyCarAffordability(household, loan, evaluatedPrice);
  const isUnaffordable = evaluatedPrice <= 0 || affordability.tier === "unaffordable";

  return {
    comfortableMax: comfortable.maxCarPrice,
    stretchMax: stretch.maxCarPrice,
    riskyMax: risky.maxCarPrice,
    sustainableMax: sustainable.maxCarPrice,
    evaluatedPrice,
    defaultEvaluatedPrice,
    isCustomEvaluatedPrice: scenario.evaluatedCarPrice !== undefined,
    affordability,
    ruleVsSustainableGap: Math.max(0, risky.maxCarPrice - sustainable.maxCarPrice),
    isUnaffordable,
  };
}
