import { classifyAffordability } from "./tiers";
import { solveMaxHomePrice } from "./maxPrice";
import { getDefaultInterestRate } from "../data/interest-rates-by-credit-band";
import type { AffordabilityTier, HouseholdInputs, LoanAssumptions } from "./types";

/** A documented, illustrative national-average monthly cost of childcare for one child. Not state-specific. */
export const ILLUSTRATIVE_CHILDCARE_ADDITION = 1_200;

export interface RateSensitivity {
  minusOnePoint: number;
  current: number;
  plusOnePoint: number;
}

export interface IncomeDropSensitivity {
  currentTier: AffordabilityTier;
  droppedTier: AffordabilityTier;
  droppedGrossMonthlyIncome: number;
}

export interface AddingChildSensitivity {
  currentTier: AffordabilityTier;
  withChildTier: AffordabilityTier;
  addedMonthlyCost: number;
}

export interface DownPaymentSensitivity {
  currentDownPayment: number;
  largerDownPayment: number;
  currentPmiMonthly: number;
  largerPmiMonthly: number;
  currentTotalMonthly: number;
  largerTotalMonthly: number;
}

export interface SensitivityResult {
  rate: RateSensitivity;
  incomeDrop: IncomeDropSensitivity;
  addingChild: AddingChildSensitivity;
  downPayment: DownPaymentSensitivity;
}

const DOWN_PAYMENT_INCREASE = 20_000;

/**
 * The four "what if" comparisons called out in spec 3.8 — always
 * evaluated at the household's current evaluated home price, holding
 * everything else constant, so each panel isolates exactly one variable.
 */
export function computeSensitivity(household: HouseholdInputs, loan: LoanAssumptions, evaluatedPrice: number, targetTier: Exclude<AffordabilityTier, "unaffordable">): SensitivityResult {
  const baseRate = loan.interestRate ?? getDefaultInterestRate(loan.creditBand, loan.termYears);

  const rate: RateSensitivity = {
    minusOnePoint: solveMaxHomePrice(household, { ...loan, interestRate: Math.max(0, baseRate - 0.01) }, targetTier).maxHomePrice,
    current: solveMaxHomePrice(household, { ...loan, interestRate: baseRate }, targetTier).maxHomePrice,
    plusOnePoint: solveMaxHomePrice(household, { ...loan, interestRate: baseRate + 0.01 }, targetTier).maxHomePrice,
  };

  const currentAffordability = classifyAffordability(household, loan, evaluatedPrice);

  const droppedIncomeHousehold: HouseholdInputs = {
    ...household,
    grossMonthlyIncome: household.grossMonthlyIncome * 0.8,
    netMonthlyIncome: household.netMonthlyIncome * 0.8,
  };
  const incomeDrop: IncomeDropSensitivity = {
    currentTier: currentAffordability.tier,
    droppedTier: classifyAffordability(droppedIncomeHousehold, loan, evaluatedPrice).tier,
    droppedGrossMonthlyIncome: droppedIncomeHousehold.grossMonthlyIncome,
  };

  const withChildHousehold: HouseholdInputs = {
    ...household,
    expenses: { ...household.expenses, childcare: household.expenses.childcare + ILLUSTRATIVE_CHILDCARE_ADDITION },
  };
  const addingChild: AddingChildSensitivity = {
    currentTier: currentAffordability.tier,
    withChildTier: classifyAffordability(withChildHousehold, loan, evaluatedPrice).tier,
    addedMonthlyCost: ILLUSTRATIVE_CHILDCARE_ADDITION,
  };

  const largerDownPaymentLoan: LoanAssumptions = { ...loan, downPaymentDollars: loan.downPaymentDollars + DOWN_PAYMENT_INCREASE };
  const currentBreakdown = currentAffordability.breakdown;
  const largerBreakdown = classifyAffordability(household, largerDownPaymentLoan, evaluatedPrice).breakdown;
  const downPayment: DownPaymentSensitivity = {
    currentDownPayment: loan.downPaymentDollars,
    largerDownPayment: largerDownPaymentLoan.downPaymentDollars,
    currentPmiMonthly: currentBreakdown.pmi,
    largerPmiMonthly: largerBreakdown.pmi,
    currentTotalMonthly: currentBreakdown.sustainableMonthlyPayment,
    largerTotalMonthly: largerBreakdown.sustainableMonthlyPayment,
  };

  return { rate, incomeDrop, addingChild, downPayment };
}
