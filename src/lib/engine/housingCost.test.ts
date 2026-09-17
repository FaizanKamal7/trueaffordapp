import { describe, expect, it } from "vitest";
import { computeMonthlyCosts, MAINTENANCE_RATE_ANNUAL } from "./housingCost";
import type { LoanAssumptions } from "./types";
import { DEFAULT_SCENARIO } from "../state/schema";
import { computeResults } from "../state/computeResults";
import { scenarioToLoan } from "../state/toEngine";

const baseLoan: LoanAssumptions = {
  stateCode: "TX",
  downPaymentDollars: 40_000,
  interestRate: 0.06,
  creditBand: "760+",
  termYears: 30,
  hoaMonthly: 50,
};

describe("computeMonthlyCosts", () => {
  it("charges PMI when down payment is under 20%", () => {
    // $40,000 down on a $400,000 home = 10% down, 90% LTV
    const result = computeMonthlyCosts(400_000, baseLoan);
    expect(result.ltvPct).toBeCloseTo(90, 6);
    expect(result.pmi).toBeGreaterThan(0);
  });

  it("charges no PMI when down payment is 20% or more", () => {
    const loan: LoanAssumptions = { ...baseLoan, downPaymentDollars: 80_000 };
    const result = computeMonthlyCosts(400_000, loan);
    expect(result.ltvPct).toBeCloseTo(80, 6);
    expect(result.pmi).toBe(0);
  });

  it("charges no PMI comfortably above 20% down", () => {
    const loan: LoanAssumptions = { ...baseLoan, downPaymentDollars: 200_000 };
    const result = computeMonthlyCosts(400_000, loan);
    expect(result.pmi).toBe(0);
  });

  it("includes a 1%-of-value annual maintenance reserve, split monthly", () => {
    const result = computeMonthlyCosts(400_000, baseLoan);
    expect(result.maintenance).toBeCloseTo((400_000 * MAINTENANCE_RATE_ANNUAL) / 12, 6);
  });

  it("sustainable payment equals lender payment plus maintenance, and nothing else", () => {
    const result = computeMonthlyCosts(400_000, baseLoan);
    expect(result.sustainableMonthlyPayment).toBeCloseTo(result.lenderMonthlyPayment + result.maintenance, 6);
  });

  it("lender payment sums P&I, tax, insurance, PMI, and HOA", () => {
    const result = computeMonthlyCosts(400_000, baseLoan);
    const sum = result.principalAndInterest + result.propertyTax + result.insurance + result.pmi + result.hoa;
    expect(result.lenderMonthlyPayment).toBeCloseTo(sum, 6);
  });

  it("passes the HOA input straight through", () => {
    const result = computeMonthlyCosts(400_000, { ...baseLoan, hoaMonthly: 275 });
    expect(result.hoa).toBe(275);
  });

  it("falls back to the credit-band default rate when no interest rate is supplied", () => {
    const { interestRate, ...loanNoRate } = baseLoan;
    const result = computeMonthlyCosts(400_000, loanNoRate as LoanAssumptions);
    expect(result.principalAndInterest).toBeGreaterThan(0);
    expect(Number.isFinite(result.principalAndInterest)).toBe(true);
  });

  it("reports a PMI dropoff month only when PMI applies", () => {
    const withPmi = computeMonthlyCosts(400_000, baseLoan);
    expect(withPmi.pmiDropoffMonth).not.toBeNull();

    const withoutPmi = computeMonthlyCosts(400_000, { ...baseLoan, downPaymentDollars: 100_000 });
    expect(withoutPmi.pmiDropoffMonth).toBeNull();
  });

  it("handles a zero home price without throwing or producing NaN", () => {
    const result = computeMonthlyCosts(0, baseLoan);
    expect(result.loanAmount).toBe(0);
    expect(Number.isNaN(result.lenderMonthlyPayment)).toBe(false);
    expect(result.lenderMonthlyPayment).toBeGreaterThanOrEqual(0);
  });

  it("handles a down payment that exceeds home price by clamping loan amount to zero", () => {
    const result = computeMonthlyCosts(100_000, { ...baseLoan, downPaymentDollars: 150_000 });
    expect(result.loanAmount).toBe(0);
    expect(result.principalAndInterest).toBe(0);
    expect(result.pmi).toBe(0);
  });

  it("pins the site's default scenario PMI dropoff month as a regression guard — a data or default-input change should update this deliberately, not silently", () => {
    const loan = scenarioToLoan(DEFAULT_SCENARIO);
    const results = computeResults(DEFAULT_SCENARIO);
    const costs = computeMonthlyCosts(results.defaultEvaluatedPrice, loan);
    expect(costs.pmiDropoffMonth).toBe(91);
  });
});
