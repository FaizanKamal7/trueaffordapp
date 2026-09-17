import { describe, expect, it } from "vitest";
import { estimateNetMonthlyIncome } from "./estimateNetIncome";

describe("estimateNetMonthlyIncome", () => {
  it("scales linearly with gross annual income", () => {
    expect(estimateNetMonthlyIncome(120_000)).toBeCloseTo(estimateNetMonthlyIncome(60_000) * 2, 5);
  });

  it("roughly matches the site's own default scenario ratio", () => {
    // Default scenario: $96k gross -> $6,200/mo net (spot check, not exact).
    expect(estimateNetMonthlyIncome(96_000)).toBeCloseTo(6_240, 0);
  });

  it("returns 0 for 0 income", () => {
    expect(estimateNetMonthlyIncome(0)).toBe(0);
  });
});
