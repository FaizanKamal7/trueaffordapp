import { describe, expect, it } from "vitest";
import { simulateRentVsBuy } from "./rentVsBuy";
import type { LoanAssumptions } from "./types";

const loan: LoanAssumptions = {
  stateCode: "TX",
  downPaymentDollars: 60_000,
  interestRate: 0.06,
  creditBand: "760+",
  termYears: 30,
  hoaMonthly: 0,
};

describe("simulateRentVsBuy", () => {
  it("produces a 31-point yearly timeline (year 0 through 30)", () => {
    const result = simulateRentVsBuy({
      homePrice: 400_000,
      loan,
      monthlyRent: 2_000,
      rentersInsuranceMonthly: 20,
      utilitiesMonthly: 100,
      tenureYears: 7,
    });
    expect(result.timeline.length).toBe(31);
    expect(result.timeline[0].year).toBe(0);
    expect(result.timeline[30].year).toBe(30);
  });

  it("renting wins when rent is far cheaper than owning and investment returns are strong", () => {
    const result = simulateRentVsBuy({
      homePrice: 600_000,
      loan: { ...loan, downPaymentDollars: 120_000 },
      monthlyRent: 1_200,
      rentersInsuranceMonthly: 15,
      utilitiesMonthly: 80,
      tenureYears: 5,
      assumptions: { investmentReturnRate: 0.08, homeAppreciationRate: 0.01 },
    });
    expect(result.betterChoiceAtTenure).toBe("rent");
  });

  it("buying eventually overtakes renting when rent is close to the ownership cost and appreciation is healthy", () => {
    const result = simulateRentVsBuy({
      homePrice: 300_000,
      loan: { ...loan, downPaymentDollars: 60_000 },
      monthlyRent: 2_300,
      rentersInsuranceMonthly: 15,
      utilitiesMonthly: 80,
      tenureYears: 15,
      assumptions: { homeAppreciationRate: 0.04, investmentReturnRate: 0.05 },
    });
    expect(result.breakevenYear).not.toBeNull();
    if (result.breakevenYear !== null) {
      expect(result.breakevenYear).toBeGreaterThan(0);
      expect(result.breakevenYear).toBeLessThanOrEqual(30);
    }
  });

  it("upfront cash to buy is the down payment plus closing costs", () => {
    const result = simulateRentVsBuy({
      homePrice: 400_000,
      loan: { ...loan, downPaymentDollars: 80_000 },
      monthlyRent: 2_000,
      rentersInsuranceMonthly: 20,
      utilitiesMonthly: 100,
      tenureYears: 5,
      assumptions: { closingCostPct: 0.03 },
    });
    expect(result.closingCosts).toBeCloseTo(12_000, 6);
    expect(result.upfrontCashToBuy).toBeCloseTo(92_000, 6);
  });

  it("clamps tenure year reporting to the 0-30 year simulation window", () => {
    const result = simulateRentVsBuy({
      homePrice: 400_000,
      loan,
      monthlyRent: 2_000,
      rentersInsuranceMonthly: 20,
      utilitiesMonthly: 100,
      tenureYears: 100,
    });
    expect(result.netWorthAtTenure.buyer).toBeCloseTo(result.timeline[30].buyerNetWorth, 2);
  });

  it("never throws on a zero-interest loan", () => {
    expect(() =>
      simulateRentVsBuy({
        homePrice: 400_000,
        loan: { ...loan, interestRate: 0 },
        monthlyRent: 2_000,
        rentersInsuranceMonthly: 20,
        utilitiesMonthly: 100,
        tenureYears: 5,
      })
    ).not.toThrow();
  });
});
