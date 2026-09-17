import type { CreditBand, LoanTerm } from "../engine/types";
import { CREDIT_BANDS } from "../data/pmi-rates";
import type { CarLoanTerm } from "../engine/carAffordability";

/**
 * The single shared input schema every calculator page reads from and
 * writes to — this is what makes income/debts/expenses/assumptions
 * "enter once, carry everywhere" across the site (spec 3.1).
 */
export interface ScenarioState {
  grossAnnualIncome: number;
  netMonthlyIncome: number;
  otherMonthlyDebts: number;
  childcare: number;
  healthcare: number;
  groceries: number;
  transport: number;
  otherExpenses: number;
  stateCode: string;
  downPaymentDollars: number;
  /** undefined = use the credit-band default rate */
  interestRateOverride: number | undefined;
  creditBand: CreditBand;
  termYears: LoanTerm;
  hoaMonthly: number;
  /** undefined = evaluate at the solved Comfortable-tier (or best available) max price */
  evaluatedHomePrice: number | undefined;

  // Rent-related — shared by the rent affordability and rent-vs-buy calculators.
  rentersInsuranceMonthly: number;
  utilitiesMonthly: number;
  /** undefined = evaluate at the solved max affordable rent */
  evaluatedRent: number | undefined;

  // Budget calculator.
  /** undefined = use the shared scenario's computed sustainable housing payment */
  budgetHousingOverride: number | undefined;

  // Rent-vs-buy calculator.
  tenureYears: number;

  // Amortization calculator.
  extraMonthlyPayment: number;

  // Car affordability calculator. Income/debts/expenses/stateCode above are
  // shared with every other calculator — "enter once, carry everywhere."
  carDownPaymentDollars: number;
  carTradeInValueDollars: number;
  carTermMonths: CarLoanTerm;
  /** undefined = use the credit-band default auto loan rate */
  carInterestRateOverride: number | undefined;
  /**
   * Reuses the mortgage CreditBand/CREDIT_BANDS type. Real auto lenders use
   * somewhat different tiering than mortgage lenders, but reusing the same
   * bands keeps the credit-band selector consistent across the whole site
   * instead of introducing a second, slightly-different scale.
   */
  carCreditBand: CreditBand;
  /** Monthly auto insurance premium — a user input, like rentersInsuranceMonthly, since it varies too much by driver to model from a table */
  carInsuranceMonthly: number;
  /** undefined = evaluate at the solved recommended (Comfortable-tier) max car price */
  evaluatedCarPrice: number | undefined;
}

export const DEFAULT_SCENARIO: ScenarioState = {
  grossAnnualIncome: 90_000,
  netMonthlyIncome: 5_850,
  otherMonthlyDebts: 450,
  childcare: 1_200,
  healthcare: 200,
  groceries: 700,
  transport: 450,
  otherExpenses: 200,
  stateCode: "TX",
  downPaymentDollars: 30_000,
  interestRateOverride: undefined,
  creditBand: "740-759",
  termYears: 30,
  hoaMonthly: 0,
  evaluatedHomePrice: undefined,
  rentersInsuranceMonthly: 20,
  utilitiesMonthly: 150,
  evaluatedRent: undefined,
  budgetHousingOverride: undefined,
  tenureYears: 7,
  extraMonthlyPayment: 0,
  carDownPaymentDollars: 3_000,
  carTradeInValueDollars: 0,
  carTermMonths: 60,
  carInterestRateOverride: undefined,
  carCreditBand: "740-759",
  carInsuranceMonthly: 120,
  evaluatedCarPrice: undefined,
};

export function isValidCarTermMonths(value: number): value is CarLoanTerm {
  return value === 36 || value === 48 || value === 60 || value === 72;
}

export function isValidCreditBand(value: string): value is CreditBand {
  return (CREDIT_BANDS as string[]).includes(value);
}
