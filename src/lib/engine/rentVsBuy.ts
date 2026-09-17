import { computeMonthlyCosts } from "./housingCost";
import { remainingBalance } from "./mortgage";
import type { LoanAssumptions } from "./types";

export interface RentVsBuyAssumptions {
  /** Annual home value appreciation, decimal (0.03 = 3%/yr) */
  homeAppreciationRate: number;
  /** Annual return the renter's foregone down payment + cash-flow savings would earn if invested instead */
  investmentReturnRate: number;
  /** Annual rent growth */
  rentGrowthRate: number;
  /** Cost to sell the home (agent commission, etc), as a fraction of sale value */
  sellingCostPct: number;
  /** Closing costs on purchase, as a fraction of home price */
  closingCostPct: number;
}

export const DEFAULT_RENT_VS_BUY_ASSUMPTIONS: RentVsBuyAssumptions = {
  homeAppreciationRate: 0.03,
  investmentReturnRate: 0.06,
  rentGrowthRate: 0.03,
  sellingCostPct: 0.06,
  closingCostPct: 0.03,
};

export interface RentVsBuyInputs {
  homePrice: number;
  loan: LoanAssumptions;
  monthlyRent: number;
  rentersInsuranceMonthly: number;
  utilitiesMonthly: number;
  /** How long they expect to stay — used to report the headline comparison, not to cap the analysis */
  tenureYears: number;
  assumptions?: Partial<RentVsBuyAssumptions>;
}

export interface RentVsBuyYearPoint {
  year: number;
  buyerNetWorth: number;
  renterNetWorth: number;
}

export interface RentVsBuyResult {
  /** Yearly net-worth snapshots for years 0-30, for charting */
  timeline: RentVsBuyYearPoint[];
  /** First year buying's net worth overtakes renting's, or null if it never does within 30 years */
  breakevenYear: number | null;
  netWorthAtTenure: { buyer: number; renter: number };
  betterChoiceAtTenure: "buy" | "rent" | "roughly equal";
  upfrontCashToBuy: number;
  closingCosts: number;
}

const SIMULATION_MONTHS = 30 * 12;
const ROUGHLY_EQUAL_THRESHOLD_DOLLARS = 2_000;

/**
 * Compares buying vs. renting as two net-worth trajectories over time,
 * rather than just comparing monthly payments — a monthly-payment
 * comparison alone misleads because it ignores equity, appreciation, and
 * the opportunity cost of the capital tied up in a down payment (spec
 * 3.9). Runs a real month-by-month simulation instead of a closed-form
 * shortcut, since the interaction between amortization, appreciation,
 * and compounding investment returns doesn't reduce to one.
 *
 * Methodology: the buyer's net worth at any point is (current home value
 * − remaining loan balance − cost to sell now). The renter's net worth
 * is what the down payment + closing costs would be worth if invested
 * instead, compounded monthly, plus every month's investment of
 * whatever cash owning would have cost beyond renting that month (if
 * renting costs more some month, no contribution is subtracted — the
 * renter's account simply doesn't grow that month, rather than modeling
 * them going into debt to match the owner's costs).
 */
export function simulateRentVsBuy(inputs: RentVsBuyInputs): RentVsBuyResult {
  const assumptions = { ...DEFAULT_RENT_VS_BUY_ASSUMPTIONS, ...inputs.assumptions };
  const { homePrice, loan, monthlyRent, rentersInsuranceMonthly, utilitiesMonthly } = inputs;

  const origination = computeMonthlyCosts(homePrice, loan);
  const closingCosts = homePrice * assumptions.closingCostPct;
  const upfrontCashToBuy = loan.downPaymentDollars + closingCosts;

  const annualRate = loan.interestRate ?? 0;
  const monthlyAppreciation = assumptions.homeAppreciationRate / 12;
  const monthlyInvestmentReturn = assumptions.investmentReturnRate / 12;
  const monthlyRentGrowth = assumptions.rentGrowthRate / 12;

  let investmentBalance = upfrontCashToBuy;
  const timeline: RentVsBuyYearPoint[] = [{ year: 0, buyerNetWorth: homePrice - origination.loanAmount - homePrice * assumptions.sellingCostPct, renterNetWorth: investmentBalance }];

  let breakevenYear: number | null = timeline[0].buyerNetWorth >= timeline[0].renterNetWorth ? 0 : null;

  for (let month = 1; month <= SIMULATION_MONTHS; month++) {
    const homeValue = homePrice * Math.pow(1 + monthlyAppreciation, month);
    const growthFactor = homeValue / homePrice;
    const loanBalance = remainingBalance(origination.loanAmount, annualRate, loan.termYears, month);

    const pmiThisMonth = origination.pmiDropoffMonth !== null && month <= origination.pmiDropoffMonth ? origination.pmi : 0;
    const ownerCashCost = origination.principalAndInterest + origination.propertyTax * growthFactor + origination.insurance * growthFactor + origination.maintenance * growthFactor + pmiThisMonth + origination.hoa;

    const rentThisMonth = monthlyRent * Math.pow(1 + monthlyRentGrowth, month) + rentersInsuranceMonthly + utilitiesMonthly;

    const contribution = Math.max(0, ownerCashCost - rentThisMonth);
    investmentBalance = investmentBalance * (1 + monthlyInvestmentReturn) + contribution;

    if (month % 12 === 0) {
      const year = month / 12;
      const buyerNetWorth = homeValue - loanBalance - homeValue * assumptions.sellingCostPct;
      const renterNetWorth = investmentBalance;
      timeline.push({ year, buyerNetWorth, renterNetWorth });
      if (breakevenYear === null && buyerNetWorth >= renterNetWorth) {
        breakevenYear = year;
      }
    }
  }

  const tenureYear = Math.max(0, Math.min(30, Math.round(inputs.tenureYears)));
  const tenurePoint = timeline.find((p) => p.year === tenureYear) ?? timeline[timeline.length - 1];

  const diff = tenurePoint.buyerNetWorth - tenurePoint.renterNetWorth;
  const betterChoiceAtTenure: "buy" | "rent" | "roughly equal" = Math.abs(diff) < ROUGHLY_EQUAL_THRESHOLD_DOLLARS ? "roughly equal" : diff > 0 ? "buy" : "rent";

  return {
    timeline,
    breakevenYear,
    netWorthAtTenure: { buyer: tenurePoint.buyerNetWorth, renter: tenurePoint.renterNetWorth },
    betterChoiceAtTenure,
    upfrontCashToBuy,
    closingCosts,
  };
}
