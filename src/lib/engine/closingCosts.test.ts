import { describe, expect, it } from "vitest";
import { estimateClosingCosts } from "./closingCosts";

describe("estimateClosingCosts", () => {
  it("computes a 2-5% range of home price", () => {
    const result = estimateClosingCosts(400_000, 40_000);
    expect(result.low).toBeCloseTo(8_000, 6);
    expect(result.high).toBeCloseTo(20_000, 6);
    expect(result.typical).toBeCloseTo(12_000, 6);
  });

  it("adds closing costs on top of the down payment for total cash needed", () => {
    const result = estimateClosingCosts(400_000, 40_000);
    expect(result.totalCashNeededTypical).toBeCloseTo(52_000, 6);
    expect(result.totalCashNeededLow).toBeCloseTo(48_000, 6);
    expect(result.totalCashNeededHigh).toBeCloseTo(60_000, 6);
  });

  it("handles a zero home price without throwing", () => {
    const result = estimateClosingCosts(0, 0);
    expect(result.low).toBe(0);
    expect(result.totalCashNeededTypical).toBe(0);
  });
});
