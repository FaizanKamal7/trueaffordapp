import { describe, expect, it } from "vitest";
import { getPmiAnnualRate } from "./pmi-rates";

describe("getPmiAnnualRate", () => {
  it("charges no PMI at or below 80% LTV", () => {
    expect(getPmiAnnualRate(80, "760+")).toBe(0);
    expect(getPmiAnnualRate(75, "620-639")).toBe(0);
    expect(getPmiAnnualRate(0, "760+")).toBe(0);
  });

  it("charges PMI just above the 80% threshold", () => {
    expect(getPmiAnnualRate(80.5, "760+")).toBeGreaterThan(0);
  });

  it("charges a higher rate for worse credit at the same LTV", () => {
    const goodCredit = getPmiAnnualRate(93, "760+");
    const badCredit = getPmiAnnualRate(93, "620-639");
    expect(badCredit).toBeGreaterThan(goodCredit);
  });

  it("charges a higher rate for higher LTV at the same credit band", () => {
    const lowerLtv = getPmiAnnualRate(85, "700-719");
    const higherLtv = getPmiAnnualRate(96, "700-719");
    expect(higherLtv).toBeGreaterThan(lowerLtv);
  });

  it("clamps LTV above 97 to the top published band instead of throwing or returning 0", () => {
    const at97 = getPmiAnnualRate(97, "700-719");
    const above97 = getPmiAnnualRate(99.5, "700-719");
    expect(above97).toBe(at97);
  });
});
