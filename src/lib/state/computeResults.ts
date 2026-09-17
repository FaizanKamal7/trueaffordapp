import { scenarioToHousehold, scenarioToLoan } from "./toEngine";
import { solveMaxHomePrice, solveSustainableMaxPrice } from "../engine/maxPrice";
import { classifyAffordability } from "../engine/tiers";
import { explainConstraints } from "../engine/constraints";
import type { ConstraintExplanation } from "../engine/constraints";
import { explainUnaffordable } from "../engine/explain";
import { computeSensitivity } from "../engine/sensitivity";
import type { SensitivityResult } from "../engine/sensitivity";
import type { AffordabilityResult, AffordabilityTier } from "../engine/types";
import type { ScenarioState } from "./schema";

export interface CalculatorResults {
  comfortableMax: number;
  stretchMax: number;
  /** Also the pure-DTI "lender would likely approve" ceiling — see solveLenderApprovalMaxPrice */
  riskyMax: number;
  sustainableMax: number;
  evaluatedPrice: number;
  defaultEvaluatedPrice: number;
  isCustomEvaluatedPrice: boolean;
  affordability: AffordabilityResult;
  constraints: ConstraintExplanation[];
  isUnaffordable: boolean;
  unaffordableReasons: string[];
  sensitivity: SensitivityResult;
}

/**
 * The single orchestration function every calculator page — server-side
 * on first render, client-side on every subsequent input change — calls
 * to turn a ScenarioState into everything the results view needs. Having
 * exactly one call site definition means the SSR render and the live
 * client recompute can never drift apart.
 */
export function computeResults(scenario: ScenarioState): CalculatorResults {
  const household = scenarioToHousehold(scenario);
  const loan = scenarioToLoan(scenario);

  const comfortable = solveMaxHomePrice(household, loan, "comfortable");
  const stretch = solveMaxHomePrice(household, loan, "stretch");
  const risky = solveMaxHomePrice(household, loan, "risky");
  const sustainable = solveSustainableMaxPrice(household, loan);

  const bestNonZeroTier: Exclude<AffordabilityTier, "unaffordable"> =
    comfortable.maxHomePrice > 0 ? "comfortable" : stretch.maxHomePrice > 0 ? "stretch" : "risky";

  const defaultEvaluatedPrice = comfortable.maxHomePrice > 0 ? comfortable.maxHomePrice : stretch.maxHomePrice > 0 ? stretch.maxHomePrice : risky.maxHomePrice;
  const evaluatedPrice = scenario.evaluatedHomePrice ?? defaultEvaluatedPrice;

  const affordability = classifyAffordability(household, loan, evaluatedPrice);
  const constraints = explainConstraints(household, loan, bestNonZeroTier);
  const isUnaffordable = evaluatedPrice <= 0 || affordability.tier === "unaffordable";
  const unaffordableReasons = isUnaffordable ? explainUnaffordable(household, loan, evaluatedPrice).reasons : [];
  const sensitivity = computeSensitivity(household, loan, evaluatedPrice, bestNonZeroTier);

  return {
    comfortableMax: comfortable.maxHomePrice,
    stretchMax: stretch.maxHomePrice,
    riskyMax: risky.maxHomePrice,
    sustainableMax: sustainable.maxHomePrice,
    evaluatedPrice,
    defaultEvaluatedPrice,
    isCustomEvaluatedPrice: scenario.evaluatedHomePrice !== undefined,
    affordability,
    constraints,
    isUnaffordable,
    unaffordableReasons,
    sensitivity,
  };
}
