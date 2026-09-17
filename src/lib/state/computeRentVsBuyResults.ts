import { simulateRentVsBuy } from "../engine/rentVsBuy";
import type { RentVsBuyResult } from "../engine/rentVsBuy";
import { computeResults } from "./computeResults";
import { computeRentResults } from "./computeRentResults";
import { scenarioToLoan, scenarioToRentCosts } from "./toEngine";
import type { ScenarioState } from "./schema";

export interface RentVsBuyCalculatorResults {
  simulation: RentVsBuyResult;
  homePrice: number;
  monthlyRent: number;
  tenureYears: number;
}

export function computeRentVsBuyResults(scenario: ScenarioState): RentVsBuyCalculatorResults {
  const loan = scenarioToLoan(scenario);
  const rentCosts = scenarioToRentCosts(scenario);

  const homePrice = scenario.evaluatedHomePrice ?? computeResults(scenario).defaultEvaluatedPrice;
  const monthlyRent = computeRentResults(scenario).evaluatedRent;

  const simulation = simulateRentVsBuy({
    homePrice,
    loan,
    monthlyRent,
    rentersInsuranceMonthly: rentCosts.rentersInsuranceMonthly,
    utilitiesMonthly: rentCosts.utilitiesMonthly,
    tenureYears: scenario.tenureYears,
  });

  return { simulation, homePrice, monthlyRent, tenureYears: scenario.tenureYears };
}
