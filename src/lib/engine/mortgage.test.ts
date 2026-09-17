import { describe, expect, it } from "vitest";
import { monthlyPrincipalAndInterest, remainingBalance, monthsToPmiDropoff, loanToValuePct } from "./mortgage";

describe("monthlyPrincipalAndInterest", () => {
  it("matches a well-known published amortization example: $200,000 / 4% / 30yr = $954.83", () => {
    const payment = monthlyPrincipalAndInterest(200_000, 0.04, 30);
    expect(payment).toBeCloseTo(954.83, 1);
  });

  it("matches a second published example: $300,000 / 6% / 30yr = $1,798.65", () => {
    const payment = monthlyPrincipalAndInterest(300_000, 0.06, 30);
    expect(payment).toBeCloseTo(1798.65, 0);
  });

  it("matches a 15-year example: $250,000 / 5% / 15yr = $1,976.98", () => {
    const payment = monthlyPrincipalAndInterest(250_000, 0.05, 15);
    expect(payment).toBeCloseTo(1976.98, 1);
  });

  it("handles zero interest rate as a straight-line payoff", () => {
    const payment = monthlyPrincipalAndInterest(360_000, 0, 30);
    expect(payment).toBeCloseTo(1000, 6);
  });

  it("handles zero loan amount", () => {
    expect(monthlyPrincipalAndInterest(0, 0.06, 30)).toBe(0);
  });

  it("handles a negative/invalid loan amount defensively rather than returning NaN", () => {
    expect(monthlyPrincipalAndInterest(-1000, 0.06, 30)).toBe(0);
  });
});

describe("remainingBalance", () => {
  it("equals the loan amount at month 0", () => {
    expect(remainingBalance(300_000, 0.06, 30, 0)).toBe(300_000);
  });

  it("reaches 0 at the end of the term", () => {
    expect(remainingBalance(300_000, 0.06, 30, 360)).toBeCloseTo(0, 6);
  });

  it("decreases monotonically month over month", () => {
    const b1 = remainingBalance(300_000, 0.06, 30, 12);
    const b2 = remainingBalance(300_000, 0.06, 30, 24);
    const b3 = remainingBalance(300_000, 0.06, 30, 36);
    expect(b1).toBeGreaterThan(b2);
    expect(b2).toBeGreaterThan(b3);
  });

  it("handles zero interest as straight-line", () => {
    // $120,000 over 10 years (120 months) at 0% => $1000/mo principal reduction
    expect(remainingBalance(120_000, 0, 10, 60)).toBeCloseTo(60_000, 6);
  });
});

describe("monthsToPmiDropoff", () => {
  it("finds the month where balance first reaches 78% of original home value", () => {
    // $380,000 loan on a $400,000 home (95% LTV) — target balance is $312,000
    const month = monthsToPmiDropoff(380_000, 400_000, 0.06, 30);
    expect(month).not.toBeNull();
    if (month !== null) {
      const balanceAtMonth = remainingBalance(380_000, 0.06, 30, month);
      const balanceBefore = remainingBalance(380_000, 0.06, 30, month - 1);
      expect(balanceAtMonth).toBeLessThanOrEqual(400_000 * 0.78);
      expect(balanceBefore).toBeGreaterThan(400_000 * 0.78);
    }
  });

  it("returns null when the loan never required PMI in the first place (LTV already <= 78%)", () => {
    // $300,000 loan on a $400,000 home = 75% LTV, already below the 78% dropoff line
    expect(monthsToPmiDropoff(300_000, 400_000, 0.06, 30)).toBeNull();
  });
});

describe("loanToValuePct", () => {
  it("computes basic LTV", () => {
    expect(loanToValuePct(380_000, 400_000)).toBeCloseTo(95, 6);
  });

  it("returns 0 for a zero or negative home price rather than dividing by zero", () => {
    expect(loanToValuePct(100_000, 0)).toBe(0);
  });
});
