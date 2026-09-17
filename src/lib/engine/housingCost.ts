import { getPropertyTaxRate } from "../data/property-tax-by-state";
import { getInsuranceRate } from "../data/homeowners-insurance-by-state";
import { getPmiAnnualRate } from "../data/pmi-rates";
import { getDefaultInterestRate } from "../data/interest-rates-by-credit-band";
import { monthlyPrincipalAndInterest, monthsToPmiDropoff, loanToValuePct } from "./mortgage";
import type { LoanAssumptions, MonthlyCostBreakdown } from "./types";

export const MAINTENANCE_RATE_ANNUAL = 0.01;

/**
 * Computes the full monthly cost breakdown for a given home price and loan
 * assumptions. This is the single source of truth every other engine
 * function (tier classification, max-price solver, constraint explainer)
 * builds on.
 */
export function computeMonthlyCosts(homePrice: number, loan: LoanAssumptions): MonthlyCostBreakdown {
  const loanAmount = Math.max(0, homePrice - loan.downPaymentDollars);
  const ltvPct = loanToValuePct(loanAmount, homePrice);
  const annualRate = loan.interestRate ?? getDefaultInterestRate(loan.creditBand, loan.termYears);

  const principalAndInterest = monthlyPrincipalAndInterest(loanAmount, annualRate, loan.termYears);

  const taxEntry = getPropertyTaxRate(loan.stateCode);
  const propertyTax = (homePrice * taxEntry.effectiveRatePct) / 12;

  const insuranceEntry = getInsuranceRate(loan.stateCode);
  const insurance = (insuranceEntry.annualPremiumAt300k * (homePrice / insuranceEntry.referenceHomeValue)) / 12;

  const pmiAnnualRate = getPmiAnnualRate(ltvPct, loan.creditBand);
  const pmi = (loanAmount * pmiAnnualRate) / 12;
  const pmiDropoffMonth = pmiAnnualRate > 0 ? monthsToPmiDropoff(loanAmount, homePrice, annualRate, loan.termYears) : null;

  const maintenance = (homePrice * MAINTENANCE_RATE_ANNUAL) / 12;

  const hoa = loan.hoaMonthly;

  const lenderMonthlyPayment = principalAndInterest + propertyTax + insurance + pmi + hoa;
  const sustainableMonthlyPayment = lenderMonthlyPayment + maintenance;

  return {
    homePrice,
    loanAmount,
    ltvPct,
    principalAndInterest,
    propertyTax,
    insurance,
    pmi,
    hoa,
    maintenance,
    lenderMonthlyPayment,
    sustainableMonthlyPayment,
    pmiDropoffMonth,
  };
}
