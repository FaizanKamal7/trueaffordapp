import { CALCULATOR_COPY } from "../i18n/calculators";
import { DEFAULT_LOCALE, type LocaleCode } from "../i18n/locales";
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
export function scenarioOgCopy(scenario: ScenarioState, results: CalculatorResults, locale: LocaleCode = DEFAULT_LOCALE): { title: string; description: string } {
  const stateName = getPropertyTaxRate(scenario.stateCode).state;
  const t = CALCULATOR_COPY[locale].og;

  if (results.isUnaffordable) {
    return {
      title: t.unaffordableTitle(stateName),
      description: t.unaffordableDescription,
    };
  }

  return {
    title: t.title(results.evaluatedPrice, stateName),
    description: t.description(results.comfortableMax, results.stretchMax, results.riskyMax),
  };
}
