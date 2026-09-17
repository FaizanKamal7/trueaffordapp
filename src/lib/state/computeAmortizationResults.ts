import { generateAmortizationSchedule } from "../engine/amortizationSchedule";
import type { AmortizationResult } from "../engine/amortizationSchedule";
import { computeResults } from "./computeResults";
import { scenarioToLoan } from "./toEngine";
import { getDefaultInterestRate } from "../data/interest-rates-by-credit-band";
import type { ScenarioState } from "./schema";

export interface AmortizationCalculatorResults {
  amortization: AmortizationResult;
  homePrice: number;
  loanAmount: number;
  rate: number;
}

export function computeAmortizationResults(scenario: ScenarioState): AmortizationCalculatorResults {
  const loan = scenarioToLoan(scenario);
  const homePrice = scenario.evaluatedHomePrice ?? computeResults(scenario).defaultEvaluatedPrice;
  const loanAmount = Math.max(0, homePrice - loan.downPaymentDollars);
  const rate = loan.interestRate ?? getDefaultInterestRate(loan.creditBand, loan.termYears);
  const amortization = generateAmortizationSchedule(loanAmount, rate, loan.termYears, scenario.extraMonthlyPayment);

  return { amortization, homePrice, loanAmount, rate };
}
