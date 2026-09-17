import type { ScenarioState } from "./schema";
import type { HouseholdInputs, LoanAssumptions } from "../engine/types";
import type { RentCosts } from "../engine/rentAffordability";
import type { CarLoanAssumptions } from "../engine/carAffordability";

export function scenarioToHousehold(state: ScenarioState): HouseholdInputs {
  return {
    grossMonthlyIncome: state.grossAnnualIncome / 12,
    netMonthlyIncome: state.netMonthlyIncome,
    otherMonthlyDebts: state.otherMonthlyDebts,
    expenses: {
      childcare: state.childcare,
      healthcare: state.healthcare,
      groceries: state.groceries,
      transport: state.transport,
      other: state.otherExpenses,
    },
  };
}

export function scenarioToLoan(state: ScenarioState): LoanAssumptions {
  return {
    stateCode: state.stateCode,
    downPaymentDollars: state.downPaymentDollars,
    interestRate: state.interestRateOverride,
    creditBand: state.creditBand,
    termYears: state.termYears,
    hoaMonthly: state.hoaMonthly,
  };
}

export function scenarioToRentCosts(state: ScenarioState): RentCosts {
  return {
    rentersInsuranceMonthly: state.rentersInsuranceMonthly,
    utilitiesMonthly: state.utilitiesMonthly,
  };
}

export function scenarioToCarLoan(state: ScenarioState): CarLoanAssumptions {
  return {
    stateCode: state.stateCode,
    downPaymentDollars: state.carDownPaymentDollars,
    tradeInValueDollars: state.carTradeInValueDollars,
    interestRate: state.carInterestRateOverride,
    creditBand: state.carCreditBand,
    termMonths: state.carTermMonths,
    insuranceMonthly: state.carInsuranceMonthly,
  };
}
