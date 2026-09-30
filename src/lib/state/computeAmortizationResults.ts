import { generateAmortizationSchedule } from "../engine/amortizationSchedule";
import type { AmortizationResult } from "../engine/amortizationSchedule";
import { computeResults } from "./computeResults";
import { scenarioToLoan } from "./toEngine";
import { getDefaultInterestRate } from "../data/interest-rates-by-credit-band";
import type { ScenarioState } from "./schema";

/** The illustrative extra payment the page's own intro copy cites ("An extra $200 a month…"). */
export const EXAMPLE_EXTRA_MONTHLY_PAYMENT = 200;

export interface AmortizationExtraPaymentExample {
  extraMonthlyPayment: number;
  interestSaved: number;
  monthsSaved: number;
}

export interface AmortizationCalculatorResults {
  amortization: AmortizationResult;
  homePrice: number;
  loanAmount: number;
  rate: number;
  /**
   * When the user hasn't entered an extra payment, the same schedule re-run
   * with EXAMPLE_EXTRA_MONTHLY_PAYMENT on this exact loan — so the page can
   * show what an extra payment does before anyone types one. Null when the
   * user has entered their own extra payment (the real result is shown) or
   * there's no loan.
   */
  extraPaymentExample: AmortizationExtraPaymentExample | null;
}

export function computeAmortizationResults(scenario: ScenarioState): AmortizationCalculatorResults {
  const loan = scenarioToLoan(scenario);
  const homePrice = scenario.evaluatedHomePrice ?? computeResults(scenario).defaultEvaluatedPrice;
  const loanAmount = Math.max(0, homePrice - loan.downPaymentDollars);
  const rate = loan.interestRate ?? getDefaultInterestRate(loan.creditBand, loan.termYears);
  const amortization = generateAmortizationSchedule(loanAmount, rate, loan.termYears, scenario.extraMonthlyPayment);

  let extraPaymentExample: AmortizationExtraPaymentExample | null = null;
  if (scenario.extraMonthlyPayment <= 0 && loanAmount > 0) {
    const example = generateAmortizationSchedule(loanAmount, rate, loan.termYears, EXAMPLE_EXTRA_MONTHLY_PAYMENT);
    extraPaymentExample = { extraMonthlyPayment: EXAMPLE_EXTRA_MONTHLY_PAYMENT, interestSaved: example.interestSaved, monthsSaved: example.monthsSaved };
  }

  return { amortization, homePrice, loanAmount, rate, extraPaymentExample };
}
