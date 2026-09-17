import { describe, expect, it } from "vitest";
import { computeRentVsBuyChartGeometry } from "./rentVsBuyChartGeometry";
import type { RentVsBuyYearPoint } from "./engine/rentVsBuy";

function buildTimeline(): RentVsBuyYearPoint[] {
  return Array.from({ length: 31 }, (_, year) => ({ year, buyerNetWorth: year * 10_000, renterNetWorth: year * 8_000 }));
}

describe("computeRentVsBuyChartGeometry", () => {
  it("produces one coordinate pair per timeline point", () => {
    const timeline = buildTimeline();
    const geometry = computeRentVsBuyChartGeometry(timeline, 7, 15);
    expect(geometry.buyerPoints.split(" ").length).toBe(31);
    expect(geometry.renterPoints.split(" ").length).toBe(31);
  });

  it("clamps tenure and breakeven markers within the chart width", () => {
    const timeline = buildTimeline();
    const geometry = computeRentVsBuyChartGeometry(timeline, 7, 15, 600, 220);
    expect(geometry.tenureX).toBeGreaterThanOrEqual(0);
    expect(geometry.tenureX).toBeLessThanOrEqual(600);
    expect(geometry.breakevenX).not.toBeNull();
    if (geometry.breakevenX !== null) {
      expect(geometry.breakevenX).toBeGreaterThanOrEqual(0);
      expect(geometry.breakevenX).toBeLessThanOrEqual(600);
    }
  });

  it("returns a null breakevenX when there is no breakeven", () => {
    const timeline = buildTimeline();
    const geometry = computeRentVsBuyChartGeometry(timeline, 7, null);
    expect(geometry.breakevenX).toBeNull();
  });

  it("never throws on a flat-zero timeline", () => {
    const timeline: RentVsBuyYearPoint[] = Array.from({ length: 31 }, (_, year) => ({ year, buyerNetWorth: 0, renterNetWorth: 0 }));
    expect(() => computeRentVsBuyChartGeometry(timeline, 5, null)).not.toThrow();
  });
});
