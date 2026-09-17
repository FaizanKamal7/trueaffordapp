import { describe, expect, it } from "vitest";
import { generateAmortizationSchedule } from "./amortizationSchedule";

describe("generateAmortizationSchedule", () => {
  it("pays off exactly at term with no extra payment, and saves nothing", () => {
    const result = generateAmortizationSchedule(300_000, 0.06, 30, 0);
    expect(result.payoffMonth).toBe(360);
    expect(result.monthsSaved).toBe(0);
    expect(result.interestSaved).toBeCloseTo(0, 2);
    expect(result.totalInterestPaid).toBeCloseTo(result.baselineTotalInterestPaid, 2);
  });

  it("pays off early and saves interest with an extra monthly payment", () => {
    const result = generateAmortizationSchedule(300_000, 0.06, 30, 300);
    expect(result.payoffMonth).toBeLessThan(360);
    expect(result.monthsSaved).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.totalInterestPaid).toBeLessThan(result.baselineTotalInterestPaid);
  });

  it("the balance reaches exactly zero at payoff and never goes negative", () => {
    const result = generateAmortizationSchedule(250_000, 0.055, 30, 500);
    const last = result.schedule[result.schedule.length - 1];
    expect(last.balance).toBe(0);
    expect(result.schedule.every((m) => m.balance >= 0)).toBe(true);
  });

  it("sum of principal + extra payments across the schedule equals the loan amount", () => {
    const loanAmount = 300_000;
    const result = generateAmortizationSchedule(loanAmount, 0.06, 30, 250);
    const totalPrincipalPaid = result.schedule.reduce((sum, m) => sum + m.principal + m.extraPayment, 0);
    expect(totalPrincipalPaid).toBeCloseTo(loanAmount, 1);
  });

  it("produces a yearly summary that sums to the full schedule", () => {
    const result = generateAmortizationSchedule(300_000, 0.06, 30, 0);
    const totalFromYears = result.yearlySummary.reduce((sum, y) => sum + y.totalPrincipal + y.totalInterest, 0);
    const totalFromMonths = result.schedule.reduce((sum, m) => sum + m.principal + m.interest, 0);
    expect(totalFromYears).toBeCloseTo(totalFromMonths, 1);
    expect(result.yearlySummary.length).toBe(30);
  });

  it("handles a zero interest rate without throwing", () => {
    const result = generateAmortizationSchedule(120_000, 0, 10, 0);
    expect(result.payoffMonth).toBe(120);
    expect(result.totalInterestPaid).toBeCloseTo(0, 6);
  });

  it("handles a zero loan amount without throwing", () => {
    const result = generateAmortizationSchedule(0, 0.06, 30, 0);
    expect(result.payoffMonth).toBe(0);
    expect(result.schedule.length).toBe(0);
  });

  it("a very large extra payment doesn't overshoot into a negative balance", () => {
    const result = generateAmortizationSchedule(50_000, 0.06, 30, 10_000);
    expect(result.schedule.every((m) => m.balance >= 0)).toBe(true);
    expect(result.payoffMonth).toBeLessThan(10);
  });
});
