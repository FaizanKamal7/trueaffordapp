import { scenarioToHousehold, scenarioToRentCosts } from "./toEngine";
import { computeRentAffordability } from "../engine/rentAffordability";
import type { RentAffordabilityResult } from "../engine/rentAffordability";
import { totalRealLifeExpenses } from "../engine/types";
import type { ScenarioState } from "./schema";

export interface RentCalculatorResults {
  rentAffordability: RentAffordabilityResult;
  evaluatedRent: number;
  isCustomEvaluatedRent: boolean;
  leftoverAtEvaluatedRent: number;
  isOverBudgetAtEvaluatedRent: boolean;
}

export function computeRentResults(scenario: ScenarioState): RentCalculatorResults {
  const household = scenarioToHousehold(scenario);
  const rentCosts = scenarioToRentCosts(scenario);
  const rentAffordability = computeRentAffordability(household, rentCosts);

  const evaluatedRent = scenario.evaluatedRent ?? rentAffordability.maxAffordableRent;
  const leftoverAtEvaluatedRent =
    household.netMonthlyIncome - evaluatedRent - rentCosts.rentersInsuranceMonthly - rentCosts.utilitiesMonthly - household.otherMonthlyDebts - totalRealLifeExpenses(household.expenses);

  return {
    rentAffordability,
    evaluatedRent,
    isCustomEvaluatedRent: scenario.evaluatedRent !== undefined,
    leftoverAtEvaluatedRent,
    isOverBudgetAtEvaluatedRent: evaluatedRent > rentAffordability.maxAffordableRent,
  };
}
