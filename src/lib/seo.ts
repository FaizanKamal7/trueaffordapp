import { formatUSD } from "./format";
import type { CalculatorResults } from "./state/computeResults";
import type { ScenarioState } from "./state/schema";
import { getPropertyTaxRate } from "./data/property-tax-by-state";

/**
 * Builds a share-specific title/description when a scenario URL carries
 * real computed numbers — this is what a forum link unfurl or social
 * share card shows, so it should say the actual answer, not generic
 * marketing copy (spec 3.2 treats shareable scenarios as the primary
 * distribution channel).
 */
export function scenarioOgCopy(scenario: ScenarioState, results: CalculatorResults): { title: string; description: string } {
  const stateName = getPropertyTaxRate(scenario.stateCode).state;

  if (results.isUnaffordable) {
    return {
      title: `What it would take to afford a home in ${stateName} — TrueAfford`,
      description: "This scenario doesn't clear affordability thresholds yet. See exactly what would need to change.",
    };
  }

  return {
    title: `This household can afford up to ${formatUSD(results.evaluatedPrice)} in ${stateName} — TrueAfford`,
    description: `Comfortable up to ${formatUSD(results.comfortableMax)}, Stretch up to ${formatUSD(results.stretchMax)}, Risky up to ${formatUSD(results.riskyMax)}. Full monthly breakdown, no ads in the result.`,
  };
}
