import { computeResults } from "./computeResults";
import { computeBudget } from "../engine/budget";
import type { BudgetBreakdown } from "../engine/budget";
import { scenarioToHousehold } from "./toEngine";
import type { ScenarioState } from "./schema";

export interface BudgetCalculatorResults {
  budget: BudgetBreakdown;
  housingPayment: number;
  isCustomHousingPayment: boolean;
  defaultHousingPayment: number;
}

/**
 * The budget calculator's housing line defaults to the shared scenario's
 * computed sustainable monthly payment (from the affordability engine),
 * so a household never has to re-enter a number that's already been
 * computed elsewhere on the site — but stays overridable for renters or
 * anyone testing a different figure.
 */
export function computeBudgetResults(scenario: ScenarioState): BudgetCalculatorResults {
  const household = scenarioToHousehold(scenario);
  const affordabilityResults = computeResults(scenario);
  const defaultHousingPayment = affordabilityResults.affordability.breakdown.sustainableMonthlyPayment;
  const housingPayment = scenario.budgetHousingOverride ?? defaultHousingPayment;
  const budget = computeBudget(household, housingPayment);

  return {
    budget,
    housingPayment,
    isCustomHousingPayment: scenario.budgetHousingOverride !== undefined,
    defaultHousingPayment,
  };
}
