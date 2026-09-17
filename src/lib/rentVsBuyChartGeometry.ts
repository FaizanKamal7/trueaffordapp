import type { RentVsBuyYearPoint } from "./engine/rentVsBuy";

export interface RentVsBuyChartGeometry {
  buyerPoints: string;
  renterPoints: string;
  minValue: number;
  maxValue: number;
  width: number;
  height: number;
  tenureX: number;
  breakevenX: number | null;
  zeroY: number;
}

/**
 * Computes SVG polyline coordinates for the rent-vs-buy net worth
 * timeline. Shared by the server render (Astro) and the client-side
 * recompute so the chart never drifts between the two — a small,
 * dependency-free alternative to pulling in a charting library, which
 * matters for a product whose whole competitive pitch includes "loads
 * fast, no bloat."
 */
export function computeRentVsBuyChartGeometry(timeline: RentVsBuyYearPoint[], tenureYears: number, breakevenYear: number | null, width = 600, height = 220): RentVsBuyChartGeometry {
  const padding = 12;
  const values = timeline.flatMap((p) => [p.buyerNetWorth, p.renterNetWorth]);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(1, ...values);

  const xFor = (year: number) => padding + (year / 30) * (width - 2 * padding);
  const yFor = (value: number) => height - padding - ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding);

  const buyerPoints = timeline.map((p) => `${xFor(p.year).toFixed(1)},${yFor(p.buyerNetWorth).toFixed(1)}`).join(" ");
  const renterPoints = timeline.map((p) => `${xFor(p.year).toFixed(1)},${yFor(p.renterNetWorth).toFixed(1)}`).join(" ");

  return {
    buyerPoints,
    renterPoints,
    minValue,
    maxValue,
    width,
    height,
    tenureX: xFor(Math.max(0, Math.min(30, tenureYears))),
    breakevenX: breakevenYear !== null ? xFor(breakevenYear) : null,
    zeroY: yFor(0),
  };
}
